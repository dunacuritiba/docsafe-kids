export type RedeType =
  | 'AMARELA'
  | 'AZUL'
  | 'VERDE'
  | 'VERMELHA'
  | 'BRANCA'
  | 'MARROM'
  | 'ARAUCÁRIA'
  | 'SJP'
  | 'MONTE MOR'
  | 'CAMPINAS'
  | 'ITAPECERICA DA SERRA'
  | 'LONDRINA';

export const REDES_DISPONIVEIS: { id: RedeType; label: string; color: string; bg: string; border: string }[] = [
  { id: 'AMARELA', label: 'Rede Amarela', color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-300' },
  { id: 'AZUL', label: 'Rede Azul', color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-300' },
  { id: 'VERDE', label: 'Rede Verde', color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  { id: 'VERMELHA', label: 'Rede Vermelha', color: 'text-rose-800', bg: 'bg-rose-100', border: 'border-rose-300' },
  { id: 'BRANCA', label: 'Rede Branca', color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' },
  { id: 'MARROM', label: 'Rede Marrom', color: 'text-amber-950', bg: 'bg-amber-200/60', border: 'border-amber-700/40' },
  { id: 'ARAUCÁRIA', label: 'Rede Araucária', color: 'text-teal-800', bg: 'bg-teal-100', border: 'border-teal-300' },
  { id: 'SJP', label: 'Rede SJP (São José dos Pinhais)', color: 'text-indigo-800', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  { id: 'MONTE MOR', label: 'Rede Monte Mor', color: 'text-purple-800', bg: 'bg-purple-100', border: 'border-purple-300' },
  { id: 'CAMPINAS', label: 'Rede Campinas', color: 'text-sky-800', bg: 'bg-sky-100', border: 'border-sky-300' },
  { id: 'ITAPECERICA DA SERRA', label: 'Rede Itapecerica da Serra', color: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: 'LONDRINA', label: 'Rede Londrina', color: 'text-cyan-800', bg: 'bg-cyan-100', border: 'border-cyan-300' },
];

export type UserRole = 'USUARIO' | 'DIACONO';

export const ADMIN_EMAIL = 'luan@secid.pr.gov.br';

export function isUserAdmin(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export interface User {
  id: string;
  nome: string;
  email: string;
  dataNascimento: string; // Ex: DD/MM/AAAA ou AAAA-MM-DD
  role: UserRole; // 'USUARIO' (padrão) ou 'DIACONO'
  passwordHash: string;
  passwordSalt: string;
  telefone: string; // Descriptografado em memória durante a sessão
  cpf: string; // Descriptografado em memória durante a sessão
  encryptedTelefone: string; // Gravado no banco / storage
  encryptedCpf: string; // Gravado no banco / storage
  rede: RedeType;
  fotoUrl?: string; // Data URL ou blob
  lgpdConsent: boolean;
  lgpdConsentDate: string;
  createdAt: string;
}

export type StatusValidacaoCertidao =
  | 'APROVADO'
  | 'DIVERGENTE'
  | 'EXPIRADO'
  | 'COM_ANTECEDENTES'
  | 'PENDENTE';

export interface DocumentRecord {
  id: string;
  userId: string;
  titulo: string; // Certidão de Antecedentes Criminais
  tipo: 'CERTIDAO_ANTECEDENTES';
  numeroDocumento: string; // Número da Certidão (descriptografado)
  encryptedNumeroDocumento: string; // Persistido AES-GCM
  orgaoEmissor: string; // Ex: Polícia Federal (ePol - SINIC) ou Polícia Civil
  dataEmissao: string; // Data de expedição contida no documento (DD/MM/AAAA ou ISO)
  dataValidade: string; // Exatamente 90 dias após data de expedição
  diasRestantesValidade: number; // Contagem regressiva de dias
  observacoes?: string;
  arquivoUrl?: string; // Data URL do PDF ou imagem
  encryptedArquivoUrl?: string; // Criptografado com AES-GCM
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  tipoArquivo?: string;
  isSensivel: boolean;

  // Campos de extração e validação do documento
  nomeExtraido?: string;
  dataNascimentoExtraida?: string;
  cpfExtraido?: string;
  constataAntecedentes: boolean; // false se "NÃO CONSTA"
  statusValidacao: StatusValidacaoCertidao;
  divergencias: string[]; // Lista de discrepâncias encontradas

  // Metadados do usuário (enriquecidos para visão do Diácono)
  userNome?: string;
  userEmail?: string;
  userRede?: RedeType;
  userDataNascimento?: string;
  userFotoUrl?: string;

  criadoEm: string;
  atualizadoEm: string;
}

export interface CertidaoParseResult {
  numeroCertidao: string;
  nome: string;
  dataNascimento: string;
  cpf: string;
  dataExpedicao: string;
  dataValidade: string;
  diasRestantes: number;
  isExpirada: boolean;
  constataAntecedentes: boolean;
  statusValidacao: StatusValidacaoCertidao;
  divergencias: string[];
  rawText: string;
}

export interface LGPDLog {
  id: string;
  userId: string;
  operacao: 'CADASTRO' | 'LOGIN' | 'CRIPTOGRAFIA' | 'ACESSO_DADOS' | 'EXPORTACAO' | 'EXCLUSAO' | 'VALIDACAO_CERTIDAO';
  detalhes: string;
  timestamp: string;
}
