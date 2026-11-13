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
  CheckCircle2,
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

  // Limite máximo de data para ter pelo menos 18 anos completos na data de hoje
  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

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
    setFotoUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%232563eb" width="100" height="100"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>');
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

    // 1. Foto de perfil obrigatória
    if (!fotoUrl || !fotoUrl.trim()) {
      setErrorMessage('É obrigatório anexar uma foto de perfil (tire uma foto com a câmera ou envie um arquivo).');
      return;
    }

    // 2. Nome completo e e-mail
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu Nome Completo.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu E-mail.');
      return;
    }

    // 3. Data de Nascimento Obrigatória e Maior de 18 anos
    if (!dataNascimento) {
      setErrorMessage('A Data de Nascimento é obrigatória.');
      return;
    }

    const [ano, mes, dia] = dataNascimento.split('-').map(Number);
    const today = new Date();
    let calculatedAge = today.getFullYear() - ano;
    const m = (today.getMonth() + 1) - mes;
    if (m < 0 || (m === 0 && today.getDate() < dia)) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setErrorMessage(
        `Cadastro permitido exclusivamente para maiores de 18 anos. Idade atual calculada: ${calculatedAge} anos.`
      );
      return;
    }

    if (calculatedAge > 120 || ano < 1900) {
      setErrorMessage('Por favor, informe uma data de nascimento válida.');
      return;
    }

    // 4. Celular para contato obrigatório
    const rawPhone = telefone.replace(/\D/g, '');
    if (!telefone.trim() || rawPhone.length < 10) {
      setErrorMessage('O número de celular para contato é obrigatório (mínimo de 10 a 11 dígitos com DDD).');
      return;
    }

    // 5. CPF Obrigatório e matematicamente válido
    const rawCpf = cpf.replace(/\D/g, '');
    if (!cpf.trim() || rawCpf.length !== 11) {
      setErrorMessage('O CPF é obrigatório e deve conter 11 dígitos.');
      return;
    }

    if (!validateCPF(cpf)) {
      setErrorMessage('O CPF informado é matematicamente inválido. Verifique os números digitados.');
      return;
    }

    // 6. Senhas
    if (senha.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    // 7. Termos da LGPD
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
    <Card className="p-4 sm:p-8 w-full max-w-xl mx-auto border-border shadow-xl">
      {/* Cabeçalho */}
      <CardHeader className="text-center p-0 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-2xl mx-auto mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Criar Conta Segura</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Seus dados e documentos protegidos com criptografia de ponta a ponta (LGPD).
        </CardDescription>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillSampleData}
          className="mt-3 mx-auto text-xs font-semibold h-8"
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
          {/* Seção Foto de Perfil / Documento (Obrigatória) */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center gap-4 ${
              fotoUrl
                ? 'bg-muted/40 border-emerald-500/50'
                : 'bg-muted/30 border-dashed border-border'
            }`}
          >
            <div className="relative group shrink-0">
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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <p className="text-sm font-bold text-foreground">
                  Foto de Identificação e Perfil <span className="text-destructive">*</span>
                </p>
                {fotoUrl ? (
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px] gap-1 py-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Foto Inserida
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold text-[10px] py-0.5">
                    Obrigatório *
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                É obrigatório anexar uma foto de perfil (foto de rosto nítida) para cadastro de membros e certidões.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant={fotoUrl ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-xs gap-1.5 h-9"
                >
                  <Camera className="w-4 h-4" />
                  Tirar Foto com a Câmera
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-9 cursor-pointer"
                >
                  <label>
                    <Upload className="w-4 h-4 text-muted-foreground" />
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
            <Label className="text-xs sm:text-sm font-semibold">
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
                className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Linha: E-mail e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">
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
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Data de Nascimento (Maior de 18 anos) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-amber-700 dark:text-amber-300 border-amber-300 bg-amber-50 dark:bg-amber-950/40"
                >
                  +18 anos obrigatório
                </Badge>
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="date"
                  required
                  max={maxBirthDate}
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm font-sans"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Exigido 18 anos ou mais. Necessária para cruzamento com a certidão.
              </p>
            </div>
          </div>

          {/* Linha: Celular e CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Telefone com máscara brasileira */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  Celular para Contato (BR) <span className="text-destructive">*</span>
                </Label>
                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                  Com DDD
                </Badge>
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
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Obrigatório para contato ministerial (LGPD)
              </p>
            </div>

            {/* CPF com validação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  CPF <span className="text-destructive">*</span>
                </Label>
                {isCpfValid !== null ? (
                  <Badge
                    variant={isCpfValid ? 'default' : 'destructive'}
                    className={`text-xs py-0 px-2 font-bold ${
                      isCpfValid ? 'bg-emerald-600 text-white' : ''
                    }`}
                  >
                    {isCpfValid ? 'CPF Válido' : 'CPF Inválido'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                    Obrigatório
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
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Obrigatório para conferência com a Certidão
              </p>
            </div>
          </div>

          {/* Campo Select: REDE que a pessoa pertence */}
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

          {/* Linha: Senha e Confirmação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">
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
                  className="pl-9 pr-10 h-11 sm:h-10 text-base sm:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">
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
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Checkbox Termo de Consentimento LGPD */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={lgpdConsent}
                onChange={e => setLgpdConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-ring shrink-0"
              />
              <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Concordo com o tratamento dos meus dados pessoais e autorizo a proteção criptográfica dos meus documentos conforme a{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLgpdModalOpen(true)}
                  className="p-0 h-auto font-semibold text-xs sm:text-sm text-primary underline inline"
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
              className="w-full font-semibold text-sm sm:text-base gap-2 h-11 sm:h-10"
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
          <p className="text-xs sm:text-sm text-muted-foreground">
            Já possui cadastro no sistema?{' '}
            <Button
              variant="link"
              onClick={onSwitchToLogin}
              className="p-0 h-auto font-semibold text-xs sm:text-sm text-primary"
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
