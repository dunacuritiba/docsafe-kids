import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Navbar } from './components/Navbar';
import { DocumentList } from './components/Documents/DocumentList';
import { DiaconoDashboard } from './components/Diacono/DiaconoDashboard';
import { LgpdPrivacyCenter } from './components/LgpdPrivacyCenter';
import { UserProfileEdit } from './components/Profile/UserProfileEdit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, CheckCircle2, FileText, Camera } from 'lucide-react';
import { isUserAdmin } from './types';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentTab, setCurrentTab] = useState<'DOCUMENTS' | 'LGPD' | 'DIACONO' | 'PROFILE'>('DOCUMENTS');

  const isAdmin = isUserAdmin(user?.email);
  const isDiacono = user?.role === 'DIACONO' || isAdmin;

  // Se o usuário for Diácono ou Admin, abre diretamente a visão diaconal para supervisão
  useEffect(() => {
    if (isDiacono) {
      setCurrentTab('DIACONO');
    } else {
      setCurrentTab('DOCUMENTS');
    }
  }, [isDiacono]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-3 sm:p-6 lg:p-8">
        {/* Header Superior */}
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-foreground text-lg tracking-tight">DocSafe</span>
              <Badge variant="secondary" className="ml-1.5 text-xs font-bold uppercase py-0.5 px-2">
                LGPD
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={authView === 'LOGIN' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthView('LOGIN')}
              className="text-xs font-semibold h-9 px-3.5"
            >
              Entrar
            </Button>
            <Button
              variant={authView === 'REGISTER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthView('REGISTER')}
              className="text-xs font-semibold h-9 px-3.5"
            >
              Cadastrar
            </Button>
          </div>
        </div>

        {/* Conteúdo Central Responsivo */}
        <div className="max-w-5xl w-full mx-auto my-auto py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Lado Esquerdo: Mensagem de valor */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Segurança Criptográfica & Proteção de Dados
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Validação de Antecedentes Criminais com{' '}
                <span className="text-blue-600">
                  Blindagem LGPD
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Plataforma corporativa moderna para vincular sua rede e validar <strong>Certidões de Antecedentes Criminais (PF e Civil)</strong>. O sistema cruza automaticamente o <strong>Nome</strong> e a <strong>Data de Nascimento</strong> do titular e monitora o prazo legal de validade de até <strong>90 dias</strong> a partir da expedição.
              </p>

              {/* Destaques das Funcionalidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-700 max-w-lg mx-auto lg:mx-0">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Upload de PDF ou Foto da Câmera</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Validade Legal de 90 Dias</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-left">Cruzamento de Nome e Nascimento</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg flex-shrink-0">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {currentTab === 'DIACONO' ? (
          <DiaconoDashboard />
        ) : currentTab === 'PROFILE' ? (
          <UserProfileEdit />
        ) : currentTab === 'LGPD' ? (
          <LgpdPrivacyCenter />
        ) : (
          <DocumentList />
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
