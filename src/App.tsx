import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Navbar } from './components/Navbar';
import { DocumentList } from './components/Documents/DocumentList';
import { DiaconoDashboard } from './components/Diacono/DiaconoDashboard';
import { LgpdPrivacyCenter } from './components/LgpdPrivacyCenter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, CheckCircle2, FileText, Camera } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentTab, setCurrentTab] = useState<'DOCUMENTS' | 'LGPD' | 'DIACONO'>('DOCUMENTS');

  // Se o usuário for Diácono, abre diretamente a visão diaconal para supervisão
  useEffect(() => {
    if (user?.role === 'DIACONO') {
      setCurrentTab('DIACONO');
    } else {
      setCurrentTab('DOCUMENTS');
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-700">Iniciando ambiente seguro...</p>
        <p className="text-xs text-slate-400 mt-1">Carregando sistema seguro...</p>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de Autenticação (Login ou Cadastro)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Header Superior Limpo */}
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-foreground text-base tracking-tight">DocSafe</span>
              <Badge variant="secondary" className="ml-1.5 text-[9px] font-bold uppercase py-0 px-1.5">
                LGPD
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={authView === 'LOGIN' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthView('LOGIN')}
              className="text-xs font-semibold h-8"
            >
              Entrar
            </Button>
            <Button
              variant={authView === 'REGISTER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthView('REGISTER')}
              className="text-xs font-semibold h-8"
            >
              Cadastrar
            </Button>
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="max-w-5xl w-full mx-auto my-auto py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Lado Esquerdo: Mensagem de valor e segurança */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Segurança Criptográfica & Proteção de Dados
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Validação de Antecedentes Criminais com{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Blindagem LGPD
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Plataforma corporativa moderna para vincular sua rede e validar <strong>Certidões de Antecedentes Criminais (PF e Civil)</strong>. O sistema cruza automaticamente o <strong>Nome</strong> e a <strong>Data de Nascimento</strong> do titular e monitora o prazo legal de validade de até <strong>90 dias</strong> a partir da expedição.
              </p>

              {/* Destaques das Funcionalidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700 max-w-lg mx-auto lg:mx-0">
                <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Upload de PDF ou Foto da Câmera</span>
                </div>

                <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Validade Legal de 90 Dias</span>
                </div>

                <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Cruzamento de Nome e Nascimento</span>
                </div>

                <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Supervisão para Diáconos</span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Formulário Ativo */}
            <div className="lg:col-span-6 w-full">
              {authView === 'LOGIN' ? (
                <LoginForm onSwitchToRegister={() => setAuthView('REGISTER')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setAuthView('LOGIN')} />
              )}
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="max-w-6xl w-full mx-auto py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
          DocSafe LGPD • Proteção de Dados com Base Legal no Art. 7º, I da Lei 13.709/2018 • Criptografia no Cliente
        </div>
      </div>
    );
  }

  // Usuário Autenticado: Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'DIACONO' && user.role === 'DIACONO' ? (
          <DiaconoDashboard />
        ) : currentTab === 'DOCUMENTS' ? (
          <DocumentList />
        ) : (
          <LgpdPrivacyCenter />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
        DocSafe • Sistema de Certidões de Antecedentes • Supervisão Diaconal e Conformidade LGPD
      </footer>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
