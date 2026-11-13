import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Network,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Save,
  UserCheck,
  Crown,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { User as UserType, RedeType, UserRole, DocumentRecord } from '../../types';
import { REDES_DISPONIVEIS, isUserAdmin } from '../../types';
import { supabaseUpdateUserByDiacono } from '../../services/supabase';
import { getStoredUsers, saveUsers, addLgpdLog } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { CameraModal } from '../CameraModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserEditByDiaconoModalProps {
  userToEdit: UserType | null;
  userDocuments?: DocumentRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const UserEditByDiaconoModal: React.FC<UserEditByDiaconoModalProps> = ({
  userToEdit,
  userDocuments = [],
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user: currentDiacono } = useAuth();
  const isAdmin = isUserAdmin(currentDiacono?.email);

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [rede, setRede] = useState<RedeType>('AMARELA');
  const [role, setRole] = useState<UserRole>('USUARIO');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setNome(userToEdit.nome || '');
      setDataNascimento(userToEdit.dataNascimento || '');
      setRede(userToEdit.rede || 'AMARELA');
      setRole(userToEdit.role || 'USUARIO');
      setFotoUrl(userToEdit.fotoUrl);
      setErrorMessage(null);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen || !userToEdit) return null;

  const selectedRedeMeta = REDES_DISPONIVEIS.find(r => r.id === rede);

  // Certidões deste usuário
  const userDocs = userDocuments.filter(d => d.userId === userToEdit.id);
  const latestDoc = userDocs[0]; // mais recente
  const isDocValid = latestDoc && latestDoc.statusValidacao === 'APROVADO' && latestDoc.diasRestantesValidade >= 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFotoUrl(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim() || !dataNascimento.trim()) {
      setErrorMessage('Nome e Data de Nascimento são campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        nome: nome.trim(),
        dataNascimento: dataNascimento.trim(),
        rede,
        fotoUrl,
        ...(isAdmin ? { role } : {}),
      };

      // 1. Atualiza no Supabase (usuarios-kids)
      const res = await supabaseUpdateUserByDiacono(userToEdit.id, updates);
      if (!res.success) {
        console.warn('Alerta Supabase:', res.error);
      }

      // 2. Atualiza localmente
      const allUsers = getStoredUsers();
      const updatedList = allUsers.map(u => {
        if (u.id === userToEdit.id) {
          return {
            ...u,
            nome: updates.nome,
            dataNascimento: updates.dataNascimento,
            rede: updates.rede,
            fotoUrl: updates.fotoUrl,
            role: updates.role || u.role,
          };
        }
        return u;
      });
      saveUsers(updatedList);

      // 3. Auditoria LGPD
      if (currentDiacono) {
        addLgpdLog(
          currentDiacono.id,
          'ACESSO_DADOS',
          `Diácono ${currentDiacono.nome} verificou e editou os dados cadastrais do membro ${nome} (${userToEdit.email}).`
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar usuário pelo Diácono:', err);
      setErrorMessage(err.message || 'Erro ao persistir as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Verificar & Editar Usuário
                </h3>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  Supervisão Diaconal
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Ajuste os dados cadastrais, data de nascimento e rede regional do membro.
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Painel de Status da Certidão de Antecedentes */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Certidão de Antecedentes Criminais (90 Dias)
              </span>
              {latestDoc ? (
                <Badge
                  variant={isDocValid ? 'default' : 'destructive'}
                  className={`text-xs font-bold py-0.5 px-2.5 ${
                    isDocValid
                      ? 'bg-emerald-600 text-white'
                      : latestDoc.statusValidacao === 'DIVERGENTE'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isDocValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Válida & Aprovada
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {latestDoc.statusValidacao}
                    </>
                  )}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">
                  Nenhuma Certidão Anexada
                </Badge>
              )}
            </div>

            {latestDoc ? (
              <div className="text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40">
                <div>
                  <span className="text-[11px] block">Nº Documento:</span>
                  <span className="font-mono font-bold text-foreground">{latestDoc.numeroDocumento || '••••••••'}</span>
                </div>
                <div>
                  <span className="text-[11px] block">Expedição:</span>
                  <span className="font-semibold text-foreground">{latestDoc.dataEmissao || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] block">Validade:</span>
                  <span className={`font-bold ${latestDoc.diasRestantesValidade < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {latestDoc.dataValidade} ({latestDoc.diasRestantesValidade}d)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">
                Este membro ainda não realizou o envio da Certidão de Antecedentes Criminais no sistema.
              </p>
            )}
          </div>

          {/* Seção Foto de Perfil */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 rounded-2xl border-2 border-white shadow-md">
                {fotoUrl && <AvatarImage src={fotoUrl} alt={nome} className="object-cover" />}
                <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground rounded-2xl">
                  {nome.charAt(0) || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>

              {fotoUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => setFotoUrl(undefined)}
                  className="absolute -top-1.5 -right-1.5 rounded-full"
                  title="Remover foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <p className="text-sm font-bold text-slate-800">Foto de Identificação do Membro</p>
              <p className="text-xs text-slate-500">
                Atualize a imagem através da câmera ou selecionando um arquivo de imagem.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs gap-1.5 h-9"
                >
                  <Camera className="w-4 h-4 text-purple-600" />
                  Fotografar Câmera
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-9 cursor-pointer"
                >
                  <label>
                    <Upload className="w-4 h-4 text-slate-600" />
                    Carregar Arquivo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>

          {/* Nome Completo */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-semibold">
              Nome Completo do Membro <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Linha: E-mail (Somente Leitura) e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">E-mail Cadastrado</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  disabled
                  value={userToEdit.email}
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm bg-muted/60 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-purple-700 font-semibold">Cruza c/ Certidão</span>
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm font-sans"
                />
              </div>
            </div>
          </div>

          {/* Rede de Vinculação */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-semibold">
                Rede de Vinculação <span className="text-destructive">*</span>
              </Label>
              {selectedRedeMeta && (
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${selectedRedeMeta.bg} ${selectedRedeMeta.color} ${selectedRedeMeta.border}`}
                >
                  {selectedRedeMeta.label}
                </span>
              )}
            </div>
            <div className="relative">
              <Network className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={rede}
                onChange={e => setRede(e.target.value as RedeType)}
                className="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none font-medium cursor-pointer h-11 sm:h-10"
              >
                {REDES_DISPONIVEIS.map(item => (
                  <option key={item.id} value={item.id} className="text-foreground py-1">
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Papel no Sistema (Role) */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Papel do Usuário
              </span>
              <Badge
                variant={role === 'DIACONO' ? 'secondary' : 'outline'}
                className="text-xs font-bold py-0.5 px-2"
              >
                {role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
              </Badge>
            </div>

            {isAdmin ? (
              <div className="pt-1 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Como Administrador Geral, você pode alternar o papel deste membro:
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={role === 'USUARIO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRole('USUARIO')}
                    className="text-xs h-8 px-2.5"
                  >
                    Usuário Comum
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'DIACONO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRole('DIACONO')}
                    className={`text-xs h-8 px-2.5 ${role === 'DIACONO' ? 'bg-purple-600 text-white' : ''}`}
                  >
                    <Crown className="w-3 h-3 mr-1 text-amber-400" />
                    Diácono
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Por motivo de segurança institucional, apenas o Administrador Geral (<strong>luan@secid.pr.gov.br</strong>) tem autorização para promover ou rebaixar papéis de Diácono.
              </p>
            )}
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm gap-2 h-11 sm:h-10 px-5 shadow-xs"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Salvando Alterações...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações do Membro
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
        onCapture={imageDataUrl => {
          setFotoUrl(imageDataUrl);
          setIsCameraOpen(false);
        }}
        title="Fotografar Identificação do Membro"
      />
    </div>
  );
};
