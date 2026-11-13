import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Camera,
  Upload,
  Lock,
  Calendar,
  AlertCircle,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { DocumentRecord } from '../../types';
import { CameraModal } from '../CameraModal';
import { encryptData } from '../../utils/crypto';
import { useAuth } from '../../context/AuthContext';
import { addLgpdLog, getStoredDocuments, saveDocuments } from '../../utils/storage';
import { supabaseSaveDocument } from '../../services/supabase';
import { formatFileSize } from '../../utils/masks';
import {
  parseCertidaoText,
  extractTextFromPdf,
  extractTextFromImage,
  calculateValidade90Dias,
  normalizeString,
  normalizeDate,
} from '../../utils/certidaoParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  documentToEdit?: DocumentRecord | null;
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  documentToEdit,
}) => {
  const { user, activeKey } = useAuth();
  const { updateBirthDate } = useAuth();

  const [savingUserBirth, setSavingUserBirth] = useState(false);

  // Campos da Certidão
  const [numeroCertidao, setNumeroCertidao] = useState('');
  const [orgaoEmissor, setOrgaoEmissor] = useState('Polícia Federal - ePol/SINIC');
  const [dataExpedicao, setDataExpedicao] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [diasRestantes, setDiasRestantes] = useState<number>(90);
  const [observacoes, setObservacoes] = useState('');

  // Dados extraídos e validação
  const [nomeExtraido, setNomeExtraido] = useState('');
  const [dataNascExtraida, setDataNascExtraida] = useState('');
  const [cpfExtraido, setCpfExtraido] = useState('');
  const [constataAntecedentes, setConstataAntecedentes] = useState(false);
  const [divergencias, setDivergencias] = useState<string[]>([]);

  // Arquivo / Foto
  const [arquivoUrl, setArquivoUrl] = useState<string | undefined>(undefined);
  const [nomeArquivo, setNomeArquivo] = useState<string | undefined>(undefined);
  const [tamanhoArquivo, setTamanhoArquivo] = useState<number | undefined>(undefined);
  const [tipoArquivo, setTipoArquivo] = useState<string | undefined>(undefined);

  // Estados de processamento
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializa dados para edição ou novo upload
  useEffect(() => {
    if (documentToEdit) {
      setNumeroCertidao(documentToEdit.numeroDocumento);
      setOrgaoEmissor(documentToEdit.orgaoEmissor || 'Polícia Federal - ePol/SINIC');
      setDataExpedicao(documentToEdit.dataEmissao || '');
      setDataValidade(documentToEdit.dataValidade || '');
      setDiasRestantes(documentToEdit.diasRestantesValidade || 0);
      setObservacoes(documentToEdit.observacoes || '');
      setNomeExtraido(documentToEdit.nomeExtraido || '');
      setDataNascExtraida(documentToEdit.dataNascimentoExtraida || '');
      setCpfExtraido(documentToEdit.cpfExtraido || '');
      setConstataAntecedentes(documentToEdit.constataAntecedentes || false);
      setDivergencias(documentToEdit.divergencias || []);
      setArquivoUrl(documentToEdit.arquivoUrl);
      setNomeArquivo(documentToEdit.nomeArquivo);
      setTamanhoArquivo(documentToEdit.tamanhoArquivo);
      setTipoArquivo(documentToEdit.tipoArquivo);
    } else {
      setNumeroCertidao('');
      setOrgaoEmissor('Polícia Federal - ePol/SINIC');
      setDataExpedicao('');
      setDataValidade('');
      setDiasRestantes(90);
      setObservacoes('');
      setNomeExtraido('');
      setDataNascExtraida('');
      setCpfExtraido('');
      setConstataAntecedentes(false);
      setDivergencias([]);
      setArquivoUrl(undefined);
      setNomeArquivo(undefined);
      setTamanhoArquivo(undefined);
      setTipoArquivo(undefined);
    }
    setErrorMessage(null);
  }, [documentToEdit, isOpen]);

  // Recalcula validade de 90 dias sempre que a data de expedição mudar
  const handleExpedicaoChange = (dateVal: string) => {
    setDataExpedicao(dateVal);
    if (dateVal) {
      const { dataValidadeStr, diasRestantes: dias } = calculateValidade90Dias(dateVal);
      setDataValidade(dataValidadeStr);
      setDiasRestantes(dias);
    }
  };

  // Processa o texto extraído da certidão e compara com o usuário
  const processDocumentText = (rawText: string) => {
    if (!rawText.trim()) return;

    const parsed = parseCertidaoText(rawText, user);

    if (parsed.numeroCertidao) setNumeroCertidao(parsed.numeroCertidao);
    if (parsed.nome) setNomeExtraido(parsed.nome);
    if (parsed.dataNascimento) setDataNascExtraida(parsed.dataNascimento);
    if (parsed.cpf) setCpfExtraido(parsed.cpf);
    if (parsed.dataExpedicao) {
      setDataExpedicao(parsed.dataExpedicao);
      setDataValidade(parsed.dataValidade);
      setDiasRestantes(parsed.diasRestantes);
    }
    setConstataAntecedentes(parsed.constataAntecedentes);
    setDivergencias(parsed.divergencias);
  };

  // Análise automática ao subir PDF ou Imagem
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('O documento deve ter no máximo 15MB.');
      return;
    }

    setNomeArquivo(file.name);
    setTamanhoArquivo(file.size);
    setTipoArquivo(file.type);
    setIsScanning(true);
    setErrorMessage(null);

    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      setScanStatusMessage('Extraindo camada de texto do PDF da certidão...');
      try {
        // Converte para dataUrl para download e visualização instantânea
        const dataUrlPromise = new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });

        const bufferPromise = file.arrayBuffer();
        const [dataUrl, buffer] = await Promise.all([dataUrlPromise, bufferPromise]);

        setArquivoUrl(dataUrl);

        // Extrai o texto do PDF com pdfjs
        const extractedText = await extractTextFromPdf(buffer);
        processDocumentText(extractedText);
      } catch (err: any) {
        console.warn('Erro ao ler PDF:', err);
        setErrorMessage('Não foi possível ler o texto do PDF automaticamente. Você pode digitar os dados.');
      } finally {
        setIsScanning(false);
      }
    } else {
      // É uma imagem (PNG, JPG, etc.)
      setScanStatusMessage('Analisando imagem da certidão com Reconhecimento Óptico (OCR)...');
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setArquivoUrl(dataUrl);
        try {
          const text = await extractTextFromImage(dataUrl);
          processDocumentText(text);
        } catch (err: any) {
          console.warn('Erro no OCR:', err);
          setErrorMessage('O OCR não conseguiu ler todos os textos. Por favor, confirme os campos abaixo.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Análise ao capturar foto pela câmera
  const handleCameraCapture = async (imageDataUrl: string) => {
    setArquivoUrl(imageDataUrl);
    setNomeArquivo(`foto_certidao_${Date.now()}.jpg`);
    setTamanhoArquivo(Math.round((imageDataUrl.length * 3) / 4));
    setTipoArquivo('image/jpeg');

    setIsScanning(true);
    setScanStatusMessage('Lendo texto da foto capturada com OCR...');
    try {
      const text = await extractTextFromImage(imageDataUrl);
      processDocumentText(text);
    } catch (err) {
      console.warn('Erro OCR na câmera:', err);
      setErrorMessage('Não foi possível extrair todo o texto da foto. Preencha os campos abaixo.');
    } finally {
      setIsScanning(false);
    }
  };

  // Comparação em tempo real com o usuário
  const userNomeNorm = user ? normalizeString(user.nome) : '';
  const docNomeNorm = normalizeString(nomeExtraido);
  const isNomeMatch = docNomeNorm && userNomeNorm && (
    docNomeNorm === userNomeNorm ||
    (docNomeNorm.split(' ')[0] === userNomeNorm.split(' ')[0] &&
     docNomeNorm.split(' ').slice(-1)[0] === userNomeNorm.split(' ').slice(-1)[0])
  );

  const userNascNorm = user ? normalizeDate(user.dataNascimento) : '';
  const docNascNorm = normalizeDate(dataNascExtraida);
  const isNascMatch = docNascNorm && userNascNorm && docNascNorm === userNascNorm;

  const userCpfClean = user ? user.cpf.replace(/\D/g, '') : '';
  const docCpfClean = cpfExtraido.replace(/\D/g, '');
  const isCpfMatch = !cpfExtraido || (userCpfClean && docCpfClean && userCpfClean === docCpfClean);

  const isExpirada = diasRestantes < 0;

  // Status consolidado
  let statusValidacao: DocumentRecord['statusValidacao'] = 'APROVADO';
  if (constataAntecedentes) {
    statusValidacao = 'COM_ANTECEDENTES';
  } else if (isExpirada) {
    statusValidacao = 'EXPIRADO';
  } else if (!isNomeMatch || !isNascMatch || !isCpfMatch || divergencias.length > 0) {
    statusValidacao = 'DIVERGENTE';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeKey) {
      setErrorMessage('Sessão inválida ou chave de criptografia indisponível.');
      return;
    }

    if (!numeroCertidao.trim() || !dataExpedicao.trim()) {
      setErrorMessage('Preencha ao menos o Número da certidão e a Data de Expedição.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Criptografia AES-GCM 256 bits do número da certidão
      const encryptedNumero = await encryptData(numeroCertidao, activeKey);

      // Criptografia do anexo se presente
      let encryptedArquivo: string | undefined = undefined;
      if (arquivoUrl) {
        encryptedArquivo = await encryptData(arquivoUrl, activeKey);
      }

      const allDocs = getStoredDocuments();
      const now = new Date().toISOString();

      const docPayload: DocumentRecord = {
        id: documentToEdit ? documentToEdit.id : 'cert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        userId: user.id,
        titulo: 'Certidão de Antecedentes Criminais',
        tipo: 'CERTIDAO_ANTECEDENTES',
        numeroDocumento: numeroCertidao.trim(),
        encryptedNumeroDocumento: encryptedNumero,
        orgaoEmissor: orgaoEmissor.trim() || 'Polícia Federal - ePol/SINIC',
        dataEmissao: dataExpedicao.trim(),
        dataValidade: dataValidade.trim(),
        diasRestantesValidade: diasRestantes,
        observacoes: observacoes.trim() || undefined,
        isSensivel: true,
        arquivoUrl,
        encryptedArquivoUrl: encryptedArquivo,
        nomeArquivo,
        tamanhoArquivo,
        tipoArquivo,
        nomeExtraido: nomeExtraido.trim() || undefined,
        dataNascimentoExtraida: dataNascExtraida.trim() || undefined,
        cpfExtraido: cpfExtraido.trim() || undefined,
        constataAntecedentes,
        statusValidacao,
        divergencias,
        criadoEm: documentToEdit ? documentToEdit.criadoEm : now,
        atualizadoEm: now,
      };

      if (documentToEdit) {
        const updatedDocs = allDocs.map(d => (d.id === documentToEdit.id ? docPayload : d));
        saveDocuments(updatedDocs);
      } else {
        saveDocuments([docPayload, ...allDocs]);
      }

      // Sincroniza com a tabela documentos-kids no Supabase
      await supabaseSaveDocument(docPayload);

      addLgpdLog(
        user.id,
        'VALIDACAO_CERTIDAO',
        `Certidão nº ${numeroCertidao} registrada e verificada com status: ${statusValidacao}. Validade: 90 dias (${dataValidade}).`
      );

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar certidão:', err);
      setErrorMessage('Erro ao aplicar criptografia nos dados da certidão.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                {documentToEdit ? 'Editar Certidão' : 'Registrar Certidão de Antecedentes'}
              </h3>
              <p className="text-xs text-slate-500">
                Validade legal de 90 dias com verificação de Nome e Data de Nascimento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Responsivo */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Área de Upload / Câmera - Clean & Neutra sem Gradiente Azul */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <FileText className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-bold text-slate-800">
                Carregue o arquivo da Certidão (PDF ou Imagem)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 max-w-lg mx-auto">
              O sistema lê automaticamente o número, nome, data de nascimento e data de expedição para calcular os 90 dias de validade legal.
            </p>

            {isScanning ? (
              <div className="py-6 flex flex-col items-center justify-center">
                <RefreshCw className="w-7 h-7 text-slate-700 animate-spin mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-slate-800">{scanStatusMessage}</p>
                <p className="text-xs text-slate-400 mt-0.5">Cruzando dados com seu cadastro...</p>
              </div>
            ) : arquivoUrl ? (
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  {arquivoUrl.startsWith('data:image') ? (
                    <img
                      src={arquivoUrl}
                      alt="Prévia"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {nomeArquivo || 'Certidão anexada'}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {formatFileSize(tamanhoArquivo)} • Análise Concluída
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArquivoUrl(undefined);
                      setNomeArquivo(undefined);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 py-1">
                <Button
                  asChild
                  size="default"
                  className="w-full sm:w-auto text-xs sm:text-sm font-semibold gap-2 cursor-pointer h-11 sm:h-10 px-4"
                >
                  <label>
                    <Upload className="w-4 h-4" />
                    Carregar Certidão (PDF / Imagem)
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full sm:w-auto text-xs sm:text-sm font-semibold gap-2 h-11 sm:h-10 px-4"
                >
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  Fotografar Certidão com Câmera
                </Button>
              </div>
            )}
          </div>

          {/* PAINEL DE VERIFICAÇÃO CRUZADA DOS DADOS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Validação Cruzada: Documento vs Cadastro
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                  statusValidacao === 'APROVADO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : statusValidacao === 'DIVERGENTE'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {statusValidacao === 'APROVADO' && '✓ Dados 100% Compatíveis'}
                {statusValidacao === 'DIVERGENTE' && '✗ Divergência Encontrada'}
                {statusValidacao === 'EXPIRADO' && '✗ Certidão Vencida (>90 dias)'}
                {statusValidacao === 'COM_ANTECEDENTES' && '✗ Constam Antecedentes'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Nome */}
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Nome do Titular</span>
                  {isNomeMatch ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confere
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Divergente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Usuário: <strong className="text-slate-800">{user?.nome}</strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Certidão: <strong className={isNomeMatch ? 'text-emerald-700' : 'text-rose-700'}>
                    {nomeExtraido || '(Aguardando leitura...)'}
                  </strong>
                </p>
              </div>

              {/* Data de Nascimento */}
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Data de Nascimento</span>
                  {isNascMatch ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confere
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Divergente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Usuário:{' '}
                  <strong className={user?.dataNascimento ? 'text-slate-800' : 'text-amber-600'}>
                    {user?.dataNascimento ? normalizeDate(user.dataNascimento) : '(Não informada no cadastro)'}
                  </strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Certidão: <strong className={isNascMatch ? 'text-emerald-700' : 'text-rose-700'}>
                    {dataNascExtraida || '(Aguardando leitura...)'}
                  </strong>
                </p>
                {(!user?.dataNascimento || user.dataNascimento.trim() === '') && dataNascExtraida && (
                  <button
                    type="button"
                    disabled={savingUserBirth}
                    onClick={async () => {
                      setSavingUserBirth(true);
                      await updateBirthDate(dataNascExtraida);
                      setSavingUserBirth(false);
                    }}
                    className="mt-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    {savingUserBirth ? 'Salvando...' : `Salvar ${dataNascExtraida} no meu cadastro`}
                  </button>
                )}
              </div>
            </div>

            {/* Alerta de Validade de 90 dias */}
            <div className={`p-3 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
              isExpirada
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Regra de 90 Dias:</strong>{' '}
                  {dataExpedicao ? (
                    <>
                      Expedida em {dataExpedicao} • Válida até <strong>{dataValidade}</strong>
                    </>
                  ) : (
                    'Informe a data de expedição para calcular a validade.'
                  )}
                </span>
              </div>
              {dataExpedicao && (
                <span className="font-bold text-xs sm:text-sm">
                  {isExpirada ? 'VENCIDA' : `${diasRestantes} dias restantes`}
                </span>
              )}
            </div>
          </div>

          {/* Dados do Formulário para Ajuste / Confirmação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  Número da Certidão <span className="text-destructive">*</span>
                </Label>
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Protegido
                </Badge>
              </div>
              <Input
                type="text"
                required
                placeholder="Ex: 216367922026"
                value={numeroCertidao}
                onChange={e => setNumeroCertidao(e.target.value)}
                className="font-mono text-base sm:text-sm h-11 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">Órgão Expedidor</Label>
              <Input
                type="text"
                value={orgaoEmissor}
                onChange={e => setOrgaoEmissor(e.target.value)}
                className="text-base sm:text-sm h-11 sm:h-10"
              />
            </div>
          </div>

          {/* Datas: Expedição e Validade Calculada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">
                Data de Expedição no Documento <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                placeholder="DD/MM/AAAA"
                required
                value={dataExpedicao}
                onChange={e => handleExpedicaoChange(e.target.value)}
                className="text-base sm:text-sm h-11 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">Validade Legal (Exatos 90 Dias)</Label>
              <Input
                type="text"
                readOnly
                value={dataValidade ? `${dataValidade} (${diasRestantes} dias)` : ''}
                placeholder="Calculada automaticamente"
                className="bg-muted text-muted-foreground font-semibold text-base sm:text-sm h-11 sm:h-10"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-semibold">Observações Adicionais</Label>
            <textarea
              rows={2}
              placeholder="Ex: Certidão original emitida pelo portal da Polícia Federal..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="text-xs sm:text-sm font-medium h-11 sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              size="default"
              className="font-semibold text-xs sm:text-sm gap-2 h-11 sm:h-10"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Criptografando e Salvando...
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Salvar Certidão Criptografada
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal da Câmera */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Fotografar Certidão de Antecedentes"
      />
    </div>
  );
};
