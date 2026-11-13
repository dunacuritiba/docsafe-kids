import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !senha) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    const res = await login(email, senha);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <Card className="p-6 sm:p-8 w-full max-w-md mx-auto border-border shadow-xl">
      {/* Cabeçalho */}
      <CardHeader className="text-center p-0 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-2xl mx-auto mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Acesso ao Cofre</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Entre para gerenciar seus documentos com proteção criptográfica LGPD.
        </CardDescription>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            setEmail('luan@secid.pr.gov.br');
            setSenha('segredo123');
          }}
          className="mt-2.5 mx-auto text-[11px] font-medium"
        >
          🔑 Preencher Credenciais de Teste
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
          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">E-mail Cadastrado</Label>
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

          {/* Senha */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Senha</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Sua senha secreta"
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

          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Sua senha deriva a chave AES-256 para decifrar seus documentos com segurança.
          </div>

          {/* Botão de Login */}
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full font-semibold text-sm gap-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Autenticando e Decifrando...
              </span>
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Alternar para Cadastro */}
        <div className="mt-6 pt-5 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Ainda não tem cadastro?{' '}
            <Button
              variant="link"
              onClick={onSwitchToRegister}
              className="p-0 h-auto font-semibold text-xs text-primary"
            >
              Criar conta e registrar rede
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
