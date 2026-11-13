import React, { useState } from 'react';
import {
  X,
  FileText,
  Lock,
  Download,
  Calendar,
  Check,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { DocumentRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../utils/masks';
import { normalizeString, normalizeDate } from '../../utils/certidaoParser';

interface DocumentViewModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
  onEdit: (doc: DocumentRecord) => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document,
  onClose,
  onEdit,
}) => {
  const { user } = useAuth();
  const [showNumber, setShowNumber] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRawEncrypted, setShowRawEncrypted] = useState(false);

  if (!document) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(document.numeroDocumento);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!document.arquivoUrl) return;
    const a = window.document.createElement('a');
    a.href = document.arquivoUrl;
    a.download = document.nomeArquivo || `certidao_${document.numeroDocumento}.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const isExpired = document.diasRestantesValidade < 0;

  // Comparação de dados
  const userNomeNorm = user ? normalizeString(user.nome) : '';
  const docNomeNorm = normalizeString(document.nomeExtraido || '');
  const isNomeMatch = docNomeNorm && userNomeNorm && (
    docNomeNorm === userNomeNorm ||
    (docNomeNorm.split(' ')[0] === userNomeNorm.split(' ')[0] &&
     docNomeNorm.split(' ').slice(-1)[0] === userNomeNorm.split(' ').slice(-1)[0])
  );

  const userNascNorm = user ? normalizeDate(user.dataNascimento) : '';
  const docNascNorm = normalizeDate(document.dataNascimentoExtraida || '');
  const isNascMatch = docNascNorm && userNascNorm && docNascNorm === userNascNorm;

  const userCpfClean = user ? user.cpf.replace(/\D/g, '') : '';
  const docCpfClean = (document.cpfExtraido || '').replace(/\D/g, '');
  const isCpfMatch = !document.cpfExtraido || (userCpfClean && docCpfClean && userCpfClean === docCpfClean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                Certidão de Antecedentes Criminais
              </h3>
              <p className="text-xs text-slate-500">
                {document.orgaoEmissor || 'Polícia Federal - ePol/SINIC'}
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Criptografado AES-256 (LGPD)
            </span>

            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Expirada há {Math.abs(document.diasRestantesValidade)} dias
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5" /> Válida por mais {document.diasRestantesValidade} dias
              </span>
            )}

            {!document.constataAntecedentes && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Nada Consta
              </span>
            )}
          </div>

          {/* PAINEL DE VERIFICAÇÃO CRUZADA */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Resultado da Verificação Cadastral Cruzada
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Nome */}
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase">Nome Completo</span>
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
                <p className="text-xs text-slate-600">Usuário: <strong className="text-slate-800">{user?.nome}</strong></p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Certidão: <strong className={isNomeMatch ? 'text-emerald-700' : 'text-rose-700'}>
                    {document.nomeExtraido || 'Não identificado'}
                  </strong>
                </p>
              </div>

              {/* Data de Nascimento */}
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
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
                  Usuário: <strong className="text-slate-800">{user ? normalizeDate(user.dataNascimento) : ''}</strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Certidão: <strong className={isNascMatch ? 'text-emerald-700' : 'text-rose-700'}>
                    {document.dataNascimentoExtraida || 'Não identificada'}
                  </strong>
                </p>
              </div>
            </div>

            {/* CPF */}
            {document.cpfExtraido && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">CPF Informado</span>
                  <span className="text-slate-800 font-mono font-semibold text-sm">{document.cpfExtraido}</span>
                </div>
                {isCpfMatch ? (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CPF Idêntico ao do Usuário
                  </span>
                ) : (
                  <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> CPF Divergente do Titular
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Número da Certidão com Opção Revelar/Copiar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Número de Registro da Certidão
              </span>
              <p className="text-base sm:text-lg font-mono font-bold text-slate-800 mt-0.5">
                {showNumber ? document.numeroDocumento : '••••••••••••••••'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNumber(!showNumber)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer h-10 sm:h-9"
              >
                {showNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showNumber ? 'Ocultar' : 'Revelar'}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer h-10 sm:h-9"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Dados de Expedição e Validade de 90 dias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1 font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data de Expedição
              </span>
              <span className="font-bold text-slate-800 text-sm">{document.dataEmissao}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1 font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data Limite de Validade (90 dias)
              </span>
              <span className={`font-bold text-sm ${isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                {document.dataValidade}
              </span>
            </div>
          </div>

          {/* Anexo / Documento Descriptografado */}
          {document.arquivoUrl ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                    Cópia Descriptografada da Certidão
                  </span>
                  <span className="text-xs text-slate-500">
                    {document.nomeArquivo} • {formatFileSize(document.tamanhoArquivo)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer h-10 sm:h-9"
                >
                  <Download className="w-4 h-4" />
                  Baixar Certidão
                </button>
              </div>

              <div className="p-4 bg-slate-100 flex items-center justify-center max-h-80 overflow-auto">
                {document.arquivoUrl.startsWith('data:image') ? (
                  <img
                    src={document.arquivoUrl}
                    alt={document.titulo}
                    className="max-h-72 rounded-lg object-contain shadow-xs border border-slate-300"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">Arquivo PDF da Certidão Anexado</p>
                    <button
                      onClick={downloadFile}
                      className="mt-3 text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1.5 mx-auto cursor-pointer font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" /> Baixar ou Abrir PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Nenhuma cópia anexada a esta certidão.
            </div>
          )}

          {/* Inspetor de Criptografia LGPD */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowRawEncrypted(!showRawEncrypted)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Auditoria Técnica: Visualizar Carga Criptografada AES-GCM (LGPD)
              </span>
              <span className="text-xs text-blue-600 font-bold">{showRawEncrypted ? 'Ocultar' : 'Exibir'}</span>
            </button>

            {showRawEncrypted && (
              <div className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-xs break-all space-y-2">
                <div>
                  <span className="text-emerald-400 block font-semibold mb-0.5">
                    // Ciphertext do Número da Certidão (IV:Payload Base64):
                  </span>
                  <code>{document.encryptedNumeroDocumento || 'Não criptografado'}</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(document);
            }}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer h-10 sm:h-9"
          >
            Editar Certidão
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer h-10 sm:h-9"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
