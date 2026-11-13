import React from 'react';
import { ShieldCheck, LogOut, FileText, User as UserIcon, Lock, Users, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { REDES_DISPONIVEIS, isUserAdmin } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  currentTab: 'DOCUMENTS' | 'LGPD' | 'DIACONO';
  onTabChange: (tab: 'DOCUMENTS' | 'LGPD' | 'DIACONO') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, toggleRole } = useAuth();

  if (!user) return null;

  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === user.rede);
  const isAdmin = isUserAdmin(user.email);
  const isDiacono = user.role === 'DIACONO' || isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Nome */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">DocSafe</span>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
                  LGPD
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-0.5 hidden lg:block">
                Cofre de Certidões de Antecedentes Criminais • 90 Dias
              </p>
            </div>
          </div>

          {/* Abas de Navegação Responsivas com shadcn Button */}
          <nav className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
            {/* Aba do Diácono se for Diácono ou Administrador */}
            {isDiacono && (
              <Button
                variant={currentTab === 'DIACONO' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('DIACONO')}
                className={`text-xs font-semibold gap-1.5 ${
                  currentTab === 'DIACONO'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 font-bold'
                }`}
                title="Supervisão geral de todos os documentos"
              >
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Painel do Diácono</span>
                <span className="sm:hidden">Diácono</span>
              </Button>
            )}

            <Button
              variant={currentTab === 'DOCUMENTS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('DOCUMENTS')}
              className={`text-xs font-semibold gap-1.5 ${
                currentTab === 'DOCUMENTS' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Minhas Certidões</span>
              <span className="sm:hidden">Certidões</span>
            </Button>

            <Button
              variant={currentTab === 'LGPD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('LGPD')}
              className={`text-xs font-semibold gap-1.5 ${
                currentTab === 'LGPD'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Privacidade & LGPD</span>
              <span className="sm:hidden">LGPD</span>
            </Button>
          </nav>

          {/* Perfil do Usuário e Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* SE FOR ADMINISTRADOR: Mostra badge de Admin com opção de teste de papel */}
            {isAdmin ? (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  const newRole = user.role === 'DIACONO' ? 'USUARIO' : 'DIACONO';
                  toggleRole(newRole);
                }}
                className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 gap-1 rounded-full text-[10px] font-bold"
                title="Administrador Geral: Clique para alternar sua visão entre Usuário e Diácono"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">Admin (Luan):</span>
                <span>{user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}</span>
              </Button>
            ) : (
              /* USUÁRIO COMUM: APENAS VISUALIZA SEU PAPEL, SEM PODER ALTERAR */
              <Badge
                variant={user.role === 'DIACONO' ? 'secondary' : 'outline'}
                className={`gap-1 select-none text-[10px] font-bold py-0.5 px-2 ${
                  user.role === 'DIACONO'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-muted/70 text-muted-foreground border-border'
                }`}
                title="Papel gerenciado exclusivamente pelo Administrador luan@secid.pr.gov.br"
              >
                <Users className="w-3 h-3 text-muted-foreground" />
                <span>{user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}</span>
              </Badge>
            )}

            {/* Tag da Rede selecionada */}
            {redeMeta && (
              <span
                className={`hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                title={`Pertence à ${redeMeta.label}`}
              >
                {redeMeta.label}
              </span>
            )}

            {/* Avatar & Nome shadcn Avatar */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-border">
              <Avatar size="sm" className="border border-border">
                {user.fotoUrl && <AvatarImage src={user.fotoUrl} alt={user.nome} />}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                  {user.nome.charAt(0) || <UserIcon className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>

              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[110px]">
                  {user.nome.split(' ')[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[110px]">{user.email}</p>
              </div>
            </div>

            {/* Botão Sair */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              title="Encerrar sessão segura"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
