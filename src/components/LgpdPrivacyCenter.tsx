import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Key,
  Database,
  AlertTriangle,
  History,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredLgpdLogs, getStoredUsers } from '../utils/storage';
import { REDES_DISPONIVEIS, type LGPDLog, type User } from '../types';

export const LgpdPrivacyCenter: React.FC = () => {
  const { user, exportUserData, deleteUserAccount } = useAuth();
  const [showEncryptedRaw, setShowEncryptedRaw] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!user) return null;

  const logs = getStoredLgpdLogs().filter((l: LGPDLog) => l.userId === user.id);
  const rawUserData = getStoredUsers().find((u: User) => u.id === user.id);
  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === user.rede);

  const handleExport = async () => {
    const jsonString = await exportUserData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados_pessoais_lgpd_${user.nome.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 4000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteUserAccount();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner de Conformidade */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Central de Privacidade & LGPD
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                Em conformidade rigorosa com a Lei Federal Brasileira nº 13.709/2018.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/30 border border-emerald-300/40 backdrop-blur-md">
            Status: 100% Criptografado
          </span>
        </div>
      </div>

      {/* Grid de Informações de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Algoritmo Criptográfico
          </h4>
          <p className="text-sm font-semibold text-slate-700">AES-GCM (256 bits)</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Chave simétrica derivada através de PBKDF2 com 100.000 iterações de SHA-256.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3">
            <Key className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Isolamento de Chaves
          </h4>
          <p className="text-sm font-semibold text-slate-700">Chave Exclusiva por Titular</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Nenhum dado é salvo em texto claro. Salt exclusivo:{' '}
            <code className="font-mono text-[10px] text-emerald-600">
              {user.passwordSalt.slice(0, 8)}...
            </code>
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl w-fit mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Consentimento e Base Legal
          </h4>
          <p className="text-sm font-semibold text-slate-700">Art. 7º, Inciso I da LGPD</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Consentimento manifestado em {new Date(user.lgpdConsentDate).toLocaleDateString('pt-BR')}.
          </p>
        </div>
      </div>

      {/* Inspetor de Dados: Texto Claro vs Texto Cifrado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Transparência Criptográfica do Titular
            </h3>
            <p className="text-xs text-slate-500">
              Veja a diferença entre os dados em memória ativa e o que é fisicamente persistido no banco.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEncryptedRaw(!showEncryptedRaw)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {showEncryptedRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showEncryptedRaw ? 'Ocultar Criptograma' : 'Auditar Criptograma'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dados Decifrados em Memória */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold block uppercase tracking-wider text-[11px] text-blue-700">
              1. Em Memória (Decifrado na Sessão do Titular)
            </span>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <strong>Nome:</strong> {user.nome}
              </p>
              <p>
                <strong>E-mail:</strong> {user.email}
              </p>
              <p>
                <strong>Data de Nascimento:</strong> {user.dataNascimento}
              </p>
              <p>
                <strong>Telefone:</strong> {user.telefone}
              </p>
              <p>
                <strong>CPF:</strong> {user.cpf}
              </p>
              <p>
                <strong>Rede:</strong>{' '}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${redeMeta?.bg} ${redeMeta?.color}`}
                >
                  {redeMeta?.label}
                </span>
              </p>
            </div>
          </div>

          {/* Dados Criptografados no Banco */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] space-y-2">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px]">
              2. No Armazenamento Seguro (Cifrado com AES-256)
            </span>
            {showEncryptedRaw ? (
              <div className="space-y-1.5 break-all">
                <p>
                  <span className="text-slate-400">encryptedTelefone:</span>{' '}
                  <span className="text-amber-300">{rawUserData?.encryptedTelefone}</span>
                </p>
                <p>
                  <span className="text-slate-400">encryptedCpf:</span>{' '}
                  <span className="text-amber-300">{rawUserData?.encryptedCpf}</span>
                </p>
                <p>
                  <span className="text-slate-400">passwordHash:</span>{' '}
                  <span className="text-blue-300">
                    {rawUserData?.passwordHash.slice(0, 24)}... (SHA-256)
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px] pt-3">
                Clique no botão "Auditar Criptograma" acima para inspecionar os hashes e payloads protegidos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Direitos do Titular (Artigo 18 da LGPD) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          Ações e Direitos do Titular (Art. 18 da LGPD)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Portabilidade de Dados */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1">
                <Download className="w-4 h-4 text-blue-600" />
                Portabilidade de Dados (Art. 18, V)
              </div>
              <p className="text-xs text-blue-800/80 mb-3">
                Baixe uma cópia completa dos seus dados cadastrais e documentos em formato aberto JSON.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleExport}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Meus Dados (JSON)
              </button>
              {exportSuccess && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1.5 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Arquivo JSON exportado com sucesso!
                </p>
              )}
            </div>
          </div>

          {/* Direito à Eliminação */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm mb-1">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Direito de Eliminação (Art. 18, VI)
              </div>
              <p className="text-xs text-rose-800/80 mb-3">
                Exclua definitivamente sua conta e todos os documentos criptografados do sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Solicitar Exclusão Total
            </button>
          </div>
        </div>
      </div>

      {/* Trilha de Auditoria LGPD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-base">
            Registro de Atividades e Acessos (Auditoria LGPD)
          </h3>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum evento registrado ainda.</p>
          ) : (
            logs.map((log: LGPDLog) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.operacao === 'CADASTRO'
                        ? 'bg-blue-100 text-blue-700'
                        : log.operacao === 'CRIPTOGRAFIA'
                        ? 'bg-emerald-100 text-emerald-700'
                        : log.operacao === 'EXPORTACAO'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {log.operacao}
                  </span>
                  <span className="text-slate-700 font-medium">{log.detalhes}</span>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão da Conta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Confirmar Eliminação Definitiva?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Você está exercendo seu direito ao esquecimento (Art. 18, VI da LGPD). Sua conta, chaves de criptografia e todos os documentos anexados serão deletados permanentemente.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Eliminando...' : 'Sim, Eliminar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
