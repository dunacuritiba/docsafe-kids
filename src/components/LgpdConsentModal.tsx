import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, X } from 'lucide-react';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Termo de Consentimento & LGPD</h3>
              <p className="text-xs text-slate-500">Conformidade com a Lei Federal nº 13.709/2018</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-emerald-900">
            <p className="font-semibold text-emerald-800 flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-600" />
              Compromisso com a Criptografia Ponta a Ponta
            </p>
            <p className="text-xs text-emerald-700">
              Nossa aplicação implementa padrões rigorosos de segurança técnica e administrativa. Seus dados cadastrais sensíveis (CPF, telefone e imagens de documentos) são criptografados com o padrão internacional <strong>AES-GCM de 256 bits</strong>, impedindo qualquer vazamento ou acesso indevido por terceiros.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Finalidade do Tratamento de Dados (Art. 6º, I)
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              Os dados coletados neste formulário (Nome completo, E-mail, Telefone Celular, CPF, Rede de vinculação e Foto de identificação) têm por finalidade exclusiva:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-600 pl-2">
              <li>Identificação individualizada e segura do titular na rede institucional indicada;</li>
              <li>Autenticação e geração de chaves criptográficas para o cofre seguro de documentos;</li>
              <li>Gestão, arquivamento e consulta de documentos civis e profissionais pelo próprio titular.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-600" />
              2. Tratamento de Dados Sensíveis e Proteção Criptográfica
            </h4>
            <p className="text-xs text-slate-600">
              Em estrita conformidade com os Arts. 11 a 13 da LGPD, os dados sensíveis nunca trafegam em texto puro. A chave de decifração é derivada dinamicamente através do padrão PBKDF2 (100.000 iterações com Salt criptográfico), garantindo que nem mesmo os administradores tenham acesso sem a autorização do usuário.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Direitos Fundamentais do Titular (Art. 18 da LGPD)
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              A qualquer momento e gratuitamente, você pode exercer diretamente através da plataforma:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-800 block">I. Confirmação e Acesso</span>
                Visualização clara de todos os dados registrados.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-800 block">II. Correção e Atualização</span>
                Modificação de dados incompletos ou inexatos.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-800 block">III. Portabilidade (Exportar)</span>
                Download integral dos seus dados em formato estruturado JSON.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-800 block">IV. Eliminação dos Dados</span>
                Exclusão total e definitiva de sua conta e documentos.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Concordar e Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
