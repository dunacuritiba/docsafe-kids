import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Network,
  Calendar,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { REDES_DISPONIVEIS, isUserAdmin, type RedeType, type UserRole } from '../../types';
import { maskPhone, maskCPF, validateCPF } from '../../utils/masks';
import { CameraModal } from '../CameraModal';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileEditProps {
  onSavedSuccess?: () => void;
}

export const UserProfileEdit: React.FC<UserProfileEditProps> = ({ onSavedSuccess }) => {
  const { user, updateUserProfile, toggleRole } = useAuth();

  if (!user) return null;

  const isAdmin = isUserAdmin(user.email);

  // Estados locais do formulário de perfil
  const [nome, setNome] = useState(user.nome || '');
  const [telefone, setTelefone] = useState(user.telefone || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [dataNascimento, setDataNascimento] = useState(user.dataNascimento || '');
  const [rede, setRede] = useState<RedeType>(user.rede || 'AMARELA');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(user.fotoUrl);

  // Estados de controle e UI
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCpfValid = cpf.length === 14 ? validateCPF(cpf) : null;
  const selectedRedeMeta = REDES_DISPONIVEIS.find(r => r.id === rede);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(maskPhone(e.target.value));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
  };

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
    setSuccessMessage(null);

    if (!nome.trim() || !telefone.trim() || !cpf.trim() || !dataNascimento.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!validateCPF(cpf)) {
      setErrorMessage('O CPF informado é matematicamente inválido.');
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile({
      nome: nome.trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim(),
      dataNascimento: dataNascimento.trim(),
      rede,
      fotoUrl,
    });
    setIsSaving(false);

    if (result.success) {
      setSuccessMessage('Dados e foto de perfil atualizados com sucesso e protegidos com criptografia LGPD!');
      setTimeout(() => setSuccessMessage(null), 5000);
      if (onSavedSuccess) {
        onSavedSuccess();
      }
    } else {
      setErrorMessage(result.error || 'Erro ao salvar alterações no perfil.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Banner Principal com Apresentação */}
      <Card className="p-4 sm:p-7 border-border shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Meu Perfil & Identificação
                </CardTitle>
                <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> LGPD Ativa
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Edite suas informações pessoais, rede regional vinculada e altere sua foto de perfil.
              </CardDescription>
            </div>
          </div>

          {/* Badge do Papel do Usuário */}
          <div className="flex items-center gap-2">
            <Badge
              variant={user.role === 'DIACONO' ? 'secondary' : 'outline'}
              className={`text-xs font-bold py-1 px-3 gap-1.5 ${
                user.role === 'DIACONO'
                  ? 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/40'
                  : 'bg-muted text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Papel: {user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Feedback de Sucesso */}
      {successMessage && (
        <Card className="p-4 bg-emerald-50/90 border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </Button>
        </Card>
      )}

      {/* Feedback de Erro */}
      {errorMessage && (
        <Card className="p-4 bg-destructive/10 border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </Card>
      )}

      {/* Formulário Principal */}
      <Card className="p-4 sm:p-8 border-border shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Foto de Perfil */}
          <div className="p-4 sm:p-5 bg-muted/40 rounded-2xl border border-dashed border-border flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <Avatar className="w-24 h-24 rounded-2xl border-2 border-background shadow-md">
                {fotoUrl && <AvatarImage src={fotoUrl} alt={nome} className="object-cover" />}
                <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground rounded-2xl">
                  {nome.charAt(0) || <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>

              {fotoUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => setFotoUrl(undefined)}
                  className="absolute -top-1.5 -right-1.5 rounded-full shadow-sm"
                  title="Remover foto de perfil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-bold text-foreground">Foto de Perfil & Identificação</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tire uma foto nova pela câmera do dispositivo ou carregue um arquivo (JPG, PNG).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs sm:text-sm gap-1.5 h-10 sm:h-9"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  Tirar Foto com Câmera
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm gap-1.5 h-10 sm:h-9 cursor-pointer"
                >
                  <label>
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    Carregar do Aparelho
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

          {/* Seção 2: Dados Pessoais Cadastrais */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/60">
              <User className="w-4 h-4 text-primary" />
              Informações Cadastrais
            </h4>

            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Grid: E-mail (Readonly) e Data de Nascimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* E-mail (Identificador imutável) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-semibold">E-mail Cadastrado</Label>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Login Imutável
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    disabled
                    value={user.email}
                    className="pl-9 h-11 sm:h-10 text-base sm:text-sm bg-muted/60 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-semibold">
                    Data de Nascimento <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Cruzamento SINIC
                  </span>
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
                <p className="text-xs text-muted-foreground">
                  Necessária para validação automática com a sua Certidão de Antecedentes.
                </p>
              </div>
            </div>

            {/* Grid: Celular e CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Celular com máscara */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-semibold">
                    Celular (BR) <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-emerald-600 font-medium">AES-256</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              </div>

              {/* CPF com validação matemática */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-semibold">
                    CPF <span className="text-destructive">*</span>
                  </Label>
                  {isCpfValid !== null && (
                    <Badge
                      variant={isCpfValid ? 'default' : 'destructive'}
                      className={`text-xs py-0 px-2 font-bold ${isCpfValid ? 'bg-emerald-600 text-white' : ''}`}
                    >
                      {isCpfValid ? 'CPF Válido' : 'CPF Inválido'}
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
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

            {/* Gestão do Papel (Role) */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Papel no Sistema
                </span>
                <Badge
                  variant={user.role === 'DIACONO' ? 'secondary' : 'outline'}
                  className="text-xs font-bold py-0.5 px-2"
                >
                  {user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
                </Badge>
              </div>

              {isAdmin ? (
                <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Como Administrador Geral (<strong>luan@secid.pr.gov.br</strong>), você pode alternar seu papel.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newRole: UserRole = user.role === 'DIACONO' ? 'USUARIO' : 'DIACONO';
                      toggleRole(newRole);
                    }}
                    className="text-xs font-bold gap-1.5 h-8 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Alternar para {user.role === 'DIACONO' ? 'USUÁRIO' : 'DIÁCONO'}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Seu papel atual é <strong>{user.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}</strong>. Por determinação de segurança, apenas o Administrador Geral pode conceder ou revogar permissões de Diácono.
                </p>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isSaving}
              size="lg"
              className="w-full sm:w-auto font-bold gap-2 text-sm sm:text-base h-11 sm:h-10 px-6 cursor-pointer"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Criptografando e Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações do Perfil
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal da Câmera para troca de foto */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={imageDataUrl => {
          setFotoUrl(imageDataUrl);
          setIsCameraOpen(false);
        }}
        title="Fotografar Nova Foto de Perfil"
      />
    </div>
  );
};
