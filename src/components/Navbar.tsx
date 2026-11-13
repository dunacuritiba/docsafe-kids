import React from 'react';
import { ShieldCheck, LogOut, FileText, User as UserIcon, Lock, Users, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { REDES_DISPONIVEIS, isUserAdmin } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  currentTab: 'DOCUMENTS' | 'LGPD' | 'DIACONO' | 'PROFILE';
  onTabChange: (tab: 'DOCUMENTS' | 'LGPD' | 'DIACONO' | 'PROFILE') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, toggleRole } = useAuth();

  if (!user) return null;

  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === user.rede);
  const isAdmin = isUserAdmin(user.email);
  const isDiacono = user.role === 'DIACONO' || isAdmin;

  return (
    <>
      {/* Top Header Principal */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Marca */}
            <div
              onClick={() => onTabChange('DOCUMENTS')}
              className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">DocSafe</span>
                  <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider py-0.5 px-2">
                    LGPD
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground -mt-0.5 hidden sm:block">
                  Cofre de Certidões de Antecedentes Criminais
                </p>
              </div>
            </div>

            {/* Abas de Navegação (Desktop: md e acima) */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
              {isDiacono && (
                <Button
                  variant={currentTab === 'DIACONO' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onTabChange('DIACONO')}
                  className={`text-xs font-semibold gap-1.5 h-8 px-3 ${
                    currentTab === 'DIACONO'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 font-bold'
                  }`}
                  title="Supervisão geral de todos os documentos"
                >
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  Painel do Diácono
                </Button>
              )}

              <Button
                variant={currentTab === 'DOCUMENTS' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('DOCUMENTS')}
                className={`text-xs font-semibold gap-1.5 h-8 px-3 ${
                  currentTab === 'DOCUMENTS' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                Minhas Certidões
              </Button>

              <Button
                variant={currentTab === 'PROFILE' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('PROFILE')}
                className={`text-xs font-semibold gap-1.5 h-8 px-3 ${
                  currentTab === 'PROFILE'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
                Meu Perfil
              </Button>

              <Button
                variant={currentTab === 'LGPD' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('LGPD')}
                className={`text-xs font-semibold gap-1.5 h-8 px-3 ${
                  currentTab === 'LGPD'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                Privacidade & LGPD
              </Button>
            </nav>

            {/* Perfil do Usuário e Logout */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Badge de Papel */}
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const newRole = user.role === 'DIACONO' ? 'USUARIO' : 'DIACONO';
                    toggleRole(newRole);
                  }}
                  className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 gap-1 rounded-full text-xs font-bold py-1 px-2.5 h-7"
                  title="Administrador Geral: Clique para alternar sua visão entre Usuário e Diácono"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Admin:</span>
                  <span>{user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}</span>
                </Button>
              ) : (
                <Badge
                  variant={user.role === 'DIACONO' ? 'secondary' : 'outline'}
                  className={`gap-1 select-none text-xs font-bold py-1 px-2.5 ${
                    user.role === 'DIACONO'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-muted/70 text-muted-foreground border-border'
                  }`}
                  title="Papel gerenciado pelo Administrador"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}</span>
                </Badge>
              )}

              {/* Tag da Rede selecionada */}
              {redeMeta && (
                <span
                  className={`hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                  title={`Pertence à ${redeMeta.label}`}
                >
                  {redeMeta.label}
                </span>
              )}

              {/* Avatar & Nome (Clicável para ir ao perfil) */}
              <button
                type="button"
                onClick={() => onTabChange('PROFILE')}
                className={`flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-border p-1 rounded-xl transition-colors text-left cursor-pointer ${
                  currentTab === 'PROFILE' ? 'bg-primary/10' : 'hover:bg-muted/60'
                }`}
                title="Clique para editar seus dados e trocar foto de perfil"
              >
                <Avatar size="sm" className="border border-border size-9">
                  {user.fotoUrl && <AvatarImage src={user.fotoUrl} alt={user.nome} />}
                  <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                    {user.nome.charAt(0) || <UserIcon className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                    {user.nome.split(' ')[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[120px]">Editar Perfil</p>
                </div>
              </button>

              {/* Botão Sair */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl size-9"
                title="Encerrar sessão segura"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar Exclusivo para Mobile (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-1.5 shadow-lg flex items-center justify-around">
        <button
          type="button"
          onClick={() => onTabChange('DOCUMENTS')}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
            currentTab === 'DOCUMENTS'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'DOCUMENTS' ? 'bg-primary/10' : ''}`}>
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-medium">Certidões</span>
        </button>

        {isDiacono && (
          <button
            type="button"
            onClick={() => onTabChange('DIACONO')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
              currentTab === 'DIACONO'
                ? 'text-purple-600 font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === 'DIACONO' ? 'bg-purple-100 dark:bg-purple-950/40' : ''}`}>
              <ShieldAlert className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[11px] mt-0.5 font-medium">Diácono</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onTabChange('PROFILE')}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
            currentTab === 'PROFILE'
              ? 'text-blue-600 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'PROFILE' ? 'bg-blue-100 dark:bg-blue-950/40' : ''}`}>
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[11px] mt-0.5 font-medium">Perfil</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('LGPD')}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
            currentTab === 'LGPD'
              ? 'text-emerald-600 font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'LGPD' ? 'bg-emerald-100 dark:bg-emerald-950/40' : ''}`}>
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] mt-0.5 font-medium">LGPD</span>
        </button>
      </nav>
    </>
  );
};
