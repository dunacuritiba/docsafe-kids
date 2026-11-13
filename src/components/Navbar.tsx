import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  LogOut,
  FileText,
  User as UserIcon,
  Lock,
  Users,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { REDES_DISPONIVEIS, isUserAdmin } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  currentTab: 'DOCUMENTS' | 'LGPD' | 'DIACONO' | 'USERS' | 'PROFILE';
  onTabChange: (tab: 'DOCUMENTS' | 'LGPD' | 'DIACONO' | 'USERS' | 'PROFILE') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, toggleRole } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === user.rede);
  const isAdmin = isUserAdmin(user.email);
  const isDiacono = user.role === 'DIACONO' || isAdmin;

  // Fecha o dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Metadados da aba atual
  const currentTabMeta = useMemo(() => {
    switch (currentTab) {
      case 'DIACONO':
        return { label: 'Painel do Diácono', icon: ShieldAlert, color: 'text-purple-600' };
      case 'USERS':
        return { label: 'Gestão de Usuários', icon: Users, color: 'text-emerald-600' };
      case 'DOCUMENTS':
        return {
          label: isDiacono ? 'Lista de Certidões' : 'Minhas Certidões',
          icon: FileText,
          color: 'text-primary',
        };
      case 'PROFILE':
        return { label: 'Meu Perfil', icon: UserIcon, color: 'text-blue-600' };
      case 'LGPD':
        return { label: 'Privacidade & LGPD', icon: Lock, color: 'text-emerald-600' };
      default:
        return { label: 'Menu de Telas', icon: LayoutGrid, color: 'text-foreground' };
    }
  }, [currentTab]);

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

            {/* Menu Dropdown de Telas / Views (Desktop: md e acima) */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-xs sm:text-sm font-semibold gap-2.5 h-10 px-4 rounded-2xl border-border bg-background hover:bg-muted/70 shadow-xs cursor-pointer transition-all"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                  <LayoutGrid className="w-3.5 h-3.5" />
                </div>
                <span className="text-muted-foreground text-xs font-normal">Telas:</span>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <currentTabMeta.icon className={`w-3.5 h-3.5 ${currentTabMeta.color}`} />
                  {currentTabMeta.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {/* Conteúdo Dropdown */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {isDiacono && (
                    <div className="mb-1 pb-1 border-b border-border/60">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Supervisão Diaconal
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onTabChange('DIACONO');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                          currentTab === 'DIACONO'
                            ? 'bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg ${
                              currentTab === 'DIACONO'
                                ? 'bg-purple-100 dark:bg-purple-900/60'
                                : 'bg-muted'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-bold block">Painel do Diácono</span>
                            <span className="text-[11px] text-muted-foreground block font-normal">
                              Supervisão das certidões e 90 dias
                            </span>
                          </div>
                        </div>
                        {currentTab === 'DIACONO' && <Check className="w-4 h-4 text-purple-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onTabChange('USERS');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                          currentTab === 'USERS'
                            ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg ${
                              currentTab === 'USERS'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60'
                                : 'bg-muted'
                            }`}
                          >
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-bold block">Gestão de Usuários</span>
                            <span className="text-[11px] text-muted-foreground block font-normal">
                              Editar dados e fotos dos membros
                            </span>
                          </div>
                        </div>
                        {currentTab === 'USERS' && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    </div>
                  )}

                  <div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Minha Conta & Documentos
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onTabChange('DOCUMENTS');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        currentTab === 'DOCUMENTS'
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentTab === 'DOCUMENTS' ? 'bg-primary/20' : 'bg-muted'
                          }`}
                        >
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-bold block">
                            {isDiacono ? 'Lista de Certidões (Todos)' : 'Minhas Certidões'}
                          </span>
                          <span className="text-[11px] text-muted-foreground block font-normal">
                            {isDiacono
                              ? 'Ver certidões de todos os membros e baixar'
                              : 'Consultar e registrar antecedentes'}
                          </span>
                        </div>
                      </div>
                      {currentTab === 'DOCUMENTS' && <Check className="w-4 h-4 text-primary" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onTabChange('PROFILE');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                        currentTab === 'PROFILE'
                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentTab === 'PROFILE' ? 'bg-blue-100 dark:bg-blue-900/60' : 'bg-muted'
                          }`}
                        >
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-bold block">Meu Perfil</span>
                          <span className="text-[11px] text-muted-foreground block font-normal">
                            Meus dados cadastrais e foto
                          </span>
                        </div>
                      </div>
                      {currentTab === 'PROFILE' && <Check className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onTabChange('LGPD');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                        currentTab === 'LGPD'
                          ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentTab === 'LGPD' ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-muted'
                          }`}
                        >
                          <Lock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="font-bold block">Privacidade & LGPD</span>
                          <span className="text-[11px] text-muted-foreground block font-normal">
                            Criptografia e termos legais
                          </span>
                        </div>
                      </div>
                      {currentTab === 'LGPD' && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

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
          <>
            <button
              type="button"
              onClick={() => onTabChange('DIACONO')}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                currentTab === 'DIACONO'
                  ? 'text-purple-600 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'DIACONO' ? 'bg-purple-100 dark:bg-purple-950/40' : ''}`}>
                <ShieldAlert className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">Diácono</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('USERS')}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                currentTab === 'USERS'
                  ? 'text-emerald-600 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'USERS' ? 'bg-emerald-100 dark:bg-emerald-950/40' : ''}`}>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">Membros</span>
            </button>
          </>
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
