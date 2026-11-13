import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Network,
  Camera,
  Upload,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
} from 'lucide-react';
import { REDES_DISPONIVEIS, isUserAdmin, type RedeType, type UserRole } from '../../types';
import { maskPhone, maskCPF, validateCPF } from '../../utils/masks';
import { CameraModal } from '../CameraModal';
import { LgpdConsentModal } from '../LgpdConsentModal';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading } = useAuth();

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rede, setRede] = useState<RedeType>('AMARELA');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [lgpdConsent, setLgpdConsent] = useState(false);

  // Estados de controle e UI
  const [showPassword, setShowPassword] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preenchimento de exemplo rápido para testes com os dados da certidão real da PF
  const fillSampleData = () => {
    setNome('LUAN ALVES DA SILVA');
    setEmail('luan.silva@exemplo.com');
    setDataNascimento('1992-06-15');
    setTelefone('(41) 99876-5432');
    setCpf('082.830.099-23');
    setRede('ARAUCÁRIA');
    setSenha('segredo123');
    setConfirmarSenha('segredo123');
    setLgpdConsent(true);
    setErrorMessage(null);
  };

  const isCpfValid = cpf.length === 14 ? validateCPF(cpf) : null;

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

    if (!nome.trim() || !email.trim() || !dataNascimento || !telefone.trim() || !cpf.trim() || !senha) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios, incluindo data de nascimento.');
      return;
    }

    if (!validateCPF(cpf)) {
      setErrorMessage('O CPF informado é matematicamente inválido.');
      return;
    }

    if (senha.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (!lgpdConsent) {
      setErrorMessage('É necessário consentir com os termos da LGPD para continuar.');
      return;
    }

    const assignedRole: UserRole = isUserAdmin(email) ? 'DIACONO' : 'USUARIO';

    const res = await register({
      nome: nome.trim(),
      email: email.trim(),
      senha,
      telefone,
      cpf,
      dataNascimento: dataNascimento.trim(),
      role: assignedRole,
      rede,
      fotoUrl,
      lgpdConsent,
    });

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const selectedRedeMeta = REDES_DISPONIVEIS.find(r => r.id === rede);

  return (
    <Card className="p-6 sm:p-8 w-full max-w-xl mx-auto border-border shadow-xl">
      {/* Cabeçalho */}
      <CardHeader className="text-center p-0 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-2xl mx-auto mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta Segura</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Seus dados e documentos protegidos com criptografia de ponta a ponta (LGPD).
        </CardDescription>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={fillSampleData}
          className="mt-2.5 mx-auto text-[11px] font-medium"
        >
          ✨ Preencher Exemplo de Teste Rápido
        </Button>
      </CardHeader>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção Foto de Perfil / Documento */}
          <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-border flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-background shadow-md overflow-hidden flex items-center justify-center">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 text-muted-foreground" />
                )}
              </div>
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

            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-foreground">Foto de Identificação</p>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                Tire direto da câmera ou envie um arquivo de foto do seu aparelho.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  Abrir Câmera
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-8 cursor-pointer"
                >
                  <label>
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    Upload Foto
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
            <Label className="text-xs font-semibold">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                required
                placeholder="Ex: Maria da Silva"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Linha: E-mail e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Data de Nascimento <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  className="pl-9 h-10 font-sans"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Necessária para validação cruzada com a certidão.
              </p>
            </div>
          </div>

          {/* Linha: Celular e CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Telefone com máscara brasileira */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Celular (BR) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="pl-9 h-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Protegido por Criptografia (LGPD)
              </p>
            </div>

            {/* CPF com validação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  CPF <span className="text-destructive">*</span>
                </Label>
                {isCpfValid !== null && (
                  <Badge
                    variant={isCpfValid ? 'default' : 'destructive'}
                    className={`text-[10px] py-0 px-1.5 ${isCpfValid ? 'bg-emerald-600 text-white' : ''}`}
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
                  className="pl-9 h-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Protegido por Criptografia (LGPD)
              </p>
            </div>
          </div>

          {/* Campo Select: REDE que a pessoa pertence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Rede de Vinculação <span className="text-destructive">*</span>
              </Label>
              {selectedRedeMeta && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${selectedRedeMeta.bg} ${selectedRedeMeta.color} ${selectedRedeMeta.border}`}
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
                className="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none font-medium cursor-pointer h-10"
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

          {/* Linha: Senha e Confirmação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Senha de Acesso <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 dígitos"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="pl-9 pr-9 h-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Confirmar Senha <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita sua senha"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>

          {/* Checkbox Termo de Consentimento LGPD */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={lgpdConsent}
                onChange={e => setLgpdConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                Concordo com o tratamento dos meus dados pessoais e autorizo a proteção criptográfica dos meus documentos conforme a{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLgpdModalOpen(true)}
                  className="p-0 h-auto font-semibold text-xs text-primary underline inline"
                >
                  Lei Geral de Proteção de Dados (LGPD)
                </Button>
                .
              </span>
            </label>
          </div>

          {/* Botão de Submissão */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full font-semibold text-sm gap-2"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Criptografando e Cadastrando...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Cadastrar e Proteger Dados
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Alternar para Login */}
        <div className="mt-6 pt-5 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Já possui cadastro no sistema?{' '}
            <Button
              variant="link"
              onClick={onSwitchToLogin}
              className="p-0 h-auto font-semibold text-xs text-primary"
            >
              Acessar com E-mail e Senha
            </Button>
          </p>
        </div>
      </CardContent>

      {/* Modal da Câmera */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={imageDataUrl => setFotoUrl(imageDataUrl)}
        title="Fotografar Identificação"
      />

      {/* Modal LGPD */}
      <LgpdConsentModal
        isOpen={isLgpdModalOpen}
        onClose={() => setIsLgpdModalOpen(false)}
        onAccept={() => setLgpdConsent(true)}
      />
    </Card>
  );
};
