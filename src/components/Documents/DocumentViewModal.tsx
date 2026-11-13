import React, { useState, useEffect } from 'react';
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
  User as UserIcon,
} from 'lucide-react';
import type { DocumentRecord, User } from '../../types';
import { REDES_DISPONIVEIS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../utils/masks';
import { normalizeString, normalizeDate } from '../../utils/certidaoParser';
import { getStoredUsers } from '../../utils/storage';
import { supabaseGetUserByEmail } from '../../services/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DocumentViewModalProps {
  document: DocumentRecord | null;
  targetUser?: User | null;
  onClose: () => void;
  onEdit: (doc: DocumentRecord) => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document,
  targetUser,
  onClose,
  onEdit,
}) => {
  const { user: currentUser } = useAuth();
  const [resolvedUser, setResolvedUser] = useState<User | null>(targetUser || null);
  const [showNumber, setShowNumber] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRawEncrypted, setShowRawEncrypted] = useState(false);

  // Identifica o titular do documento (membro dono da certidão)
  useEffect(() => {
    if (targetUser) {
      setResolvedUser(targetUser);
      return;
    }
    if (!document) return;

    // Se o documento for do próprio usuário autenticado:
    if (
      currentUser &&
      (document.userId === currentUser.id ||
        (document.userEmail &&
          currentUser.email &&
          document.userEmail.toLowerCase() === currentUser.email.toLowerCase()))
    ) {
      setResolvedUser(currentUser);
      return;
    }

    // Busca no cache local de usuários cadastrados
    const localUsers = getStoredUsers();
    const found = localUsers.find(
      u =>
        u.id === document.userId ||
        (document.userEmail && u.email.toLowerCase() === document.userEmail.toLowerCase())
    );

    if (found) {
      setResolvedUser(found);
    } else if (document.userEmail) {
      // Busca no Supabase caso ainda não esteja em cache local
      supabaseGetUserByEmail(document.userEmail).then(remote => {
        if (remote) setResolvedUser(remote);
      });
    }
  }, [document, targetUser, currentUser]);

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

  // DADOS DO TITULAR (Dono do documento - NUNCA comparar com os dados do diácono/admin logado!)
  const titularNome = resolvedUser?.nome || document.userNome || document.nomeExtraido || 'Membro Titular';
  const titularNasc = resolvedUser?.dataNascimento || '';
  const titularEmail = resolvedUser?.email || document.userEmail || '';
  const titularRede = resolvedUser?.rede || document.userRede;
  const titularFoto = resolvedUser?.fotoUrl;
  const titularCpf = resolvedUser?.cpf || '';

  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === titularRede);

  // Comparação de dados contra o TITULAR
  const titularNomeNorm = normalizeString(titularNome);
  const docNomeNorm = normalizeString(document.nomeExtraido || '');
  const isNomeMatch =
    docNomeNorm &&
    titularNomeNorm &&
    (docNomeNorm === titularNomeNorm ||
      (docNomeNorm.split(' ')[0] === titularNomeNorm.split(' ')[0] &&
        docNomeNorm.split(' ').slice(-1)[0] === titularNomeNorm.split(' ').slice(-1)[0]));

  const titularNascNorm = titularNasc ? normalizeDate(titularNasc) : '';
  const docNascNorm = normalizeDate(document.dataNascimentoExtraida || '');
  const isNascMatch = docNascNorm && titularNascNorm && docNascNorm === titularNascNorm;

  const titularCpfClean = titularCpf ? titularCpf.replace(/\D/g, '') : '';
  const docCpfClean = (document.cpfExtraido || '').replace(/\D/g, '');
  const isCpfMatch =
    !document.cpfExtraido || (titularCpfClean && docCpfClean && titularCpfClean === docCpfClean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card text-card-foreground rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight">
                Certidão de Antecedentes Criminais
              </h3>
              <p className="text-xs text-muted-foreground">
                {document.orgaoEmissor || 'Polícia Federal - ePol/SINIC'} • Validade Legal de 90 Dias
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* CARTÃO EM DESTAQUE DO MEMBRO TITULAR COM FOTO */}
          <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-20 sm:size-24 rounded-2xl border-2 border-primary/20 shadow-sm">
                {titularFoto ? (
                  <AvatarImage src={titularFoto} alt={titularNome} className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-2xl text-xl sm:text-2xl font-black bg-primary/10 text-primary">
                  {(titularNome || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {titularFoto ? (
                <span
                  className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white shadow-xs"
                  title="Foto do titular cadastrada"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span
                  className="absolute -bottom-1 -right-1 p-1 bg-muted-foreground/30 rounded-full text-muted-foreground shadow-xs"
                  title="Sem foto de perfil"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-base sm:text-lg text-foreground truncate">
                  {titularNome}
                </span>
                {redeMeta && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                  >
                    {redeMeta.label}
                  </span>
                )}
                {resolvedUser?.role && (
                  <Badge
                    variant={resolvedUser.role === 'DIACONO' ? 'secondary' : 'outline'}
                    className="text-[10px] font-bold py-0.5"
                  >
                    {resolvedUser.role === 'DIACONO' ? 'Diácono' : 'Usuário'}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {titularEmail || 'E-mail não informado'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-foreground font-medium">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Nascimento Cadastrado:{' '}
                  <strong className="font-mono">
                    {titularNasc ? (
                      normalizeDate(titularNasc)
                    ) : (
                      <span className="text-amber-500 font-sans">Não cadastrada</span>
                    )}
                  </strong>
                </span>

                {titularFoto ? (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Foto do Perfil OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[11px]">
                    Sem foto no perfil
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Status Badges da Certidão */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Criptografado AES-256 (LGPD)
            </span>

            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-3.5 h-3.5" /> Expirada há {Math.abs(document.diasRestantesValidade)} dias
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Calendar className="w-3.5 h-3.5" /> Válida por mais {document.diasRestantesValidade} dias
              </span>
            )}

            {!document.constataAntecedentes && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Nada Consta
              </span>
            )}
          </div>

          {/* PAINEL DE VERIFICAÇÃO CRUZADA (Comparação com o Membro Titular) */}
          <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-primary" />
                Cruzamento de Dados com o Titular
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Comparado com o cadastro do titular
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Nome */}
              <div className="p-3.5 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</span>
                  {isNomeMatch ? (
                    <Badge variant="default" className="bg-emerald-600 text-white text-[11px] font-bold gap-1 py-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Confere (Match)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px] font-bold gap-1 py-0.5">
                      <AlertCircle className="w-3 h-3" /> Divergente
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cadastro Titular: <strong className="text-foreground">{titularNome}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Na Certidão: <strong className={isNomeMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {document.nomeExtraido || 'Não identificado no PDF'}
                  </strong>
                </p>
              </div>

              {/* Data de Nascimento */}
              <div className="p-3.5 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Data de Nascimento</span>
                  {isNascMatch ? (
                    <Badge variant="default" className="bg-emerald-600 text-white text-[11px] font-bold gap-1 py-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Confere (Match)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px] font-bold gap-1 py-0.5">
                      <AlertCircle className="w-3 h-3" /> Divergente
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cadastro Titular:{' '}
                  <strong className="text-foreground font-mono">
                    {titularNasc ? normalizeDate(titularNasc) : 'Não cadastrada'}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Na Certidão:{' '}
                  <strong className={`font-mono ${isNascMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {document.dataNascimentoExtraida || 'Não identificada'}
                  </strong>
                </p>
              </div>
            </div>

            {/* CPF se extraído */}
            {document.cpfExtraido && (
              <div className="p-3.5 rounded-xl bg-background border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase block">CPF na Certidão</span>
                  <span className="text-foreground font-mono font-bold text-sm">{document.cpfExtraido}</span>
                </div>
                {isCpfMatch ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CPF coincide com o cadastro
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> CPF divergente do titular
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Número da Certidão com Opção Revelar/Copiar */}
          <div className="p-4 bg-muted/30 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Número de Registro da Certidão
              </span>
              <p className="text-base sm:text-lg font-mono font-bold text-foreground mt-0.5">
                {showNumber ? document.numeroDocumento : '••••••••••••••••'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNumber(!showNumber)}
                className="gap-1.5 h-10 sm:h-9 text-xs font-semibold"
              >
                {showNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showNumber ? 'Ocultar' : 'Revelar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 h-10 sm:h-9 text-xs font-semibold"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Dados de Expedição e Validade de 90 dias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-xl border border-border">
              <span className="text-muted-foreground flex items-center gap-1 font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Data de Expedição
              </span>
              <span className="font-bold text-foreground text-sm">{document.dataEmissao}</span>
            </div>

            <div className="p-3 bg-muted/30 rounded-xl border border-border">
              <span className="text-muted-foreground flex items-center gap-1 font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Data Limite de Validade (90 dias)
              </span>
              <span className={`font-bold text-sm ${isExpired ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {document.dataValidade}
              </span>
            </div>
          </div>

          {/* Anexo / Documento Descriptografado */}
          {document.arquivoUrl ? (
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-foreground block">
                    Cópia Descriptografada da Certidão
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {document.nomeArquivo} • {formatFileSize(document.tamanhoArquivo)}
                  </span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadFile}
                  className="gap-2 h-10 sm:h-9 text-xs sm:text-sm font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Baixar Certidão
                </Button>
              </div>

              <div className="p-4 bg-muted/20 flex items-center justify-center max-h-80 overflow-auto">
                {document.arquivoUrl.startsWith('data:image') ? (
                  <img
                    src={document.arquivoUrl}
                    alt={document.titulo}
                    className="max-h-72 rounded-lg object-contain shadow-xs border border-border"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-primary mx-auto mb-2 opacity-80" />
                    <p className="text-xs sm:text-sm text-foreground font-medium">Arquivo PDF da Certidão Anexado</p>
                    <button
                      type="button"
                      onClick={downloadFile}
                      className="mt-3 text-xs sm:text-sm text-primary hover:underline flex items-center gap-1.5 mx-auto cursor-pointer font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" /> Baixar ou Abrir PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
              Nenhuma cópia anexada a esta certidão.
            </div>
          )}

          {/* Inspetor de Criptografia LGPD */}
          <div className="border border-border rounded-xl p-3 bg-muted/20">
            <button
              type="button"
              onClick={() => setShowRawEncrypted(!showRawEncrypted)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Auditoria Técnica: Visualizar Carga Criptografada AES-GCM (LGPD)
              </span>
              <span className="text-xs text-primary font-bold">{showRawEncrypted ? 'Ocultar' : 'Exibir'}</span>
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
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(document);
            }}
            className="text-xs sm:text-sm font-semibold h-10 sm:h-9"
          >
            Editar Certidão
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold h-10 sm:h-9"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};