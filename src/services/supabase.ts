import { createClient } from '@supabase/supabase-js';
import type { User, DocumentRecord, LGPDLog, UserRole, RedeType } from '../types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ohzqfjpioggsvsczdadg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oenFmanBpb2dnc3ZzY3pkYWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzUxMDIsImV4cCI6MjEwOTE1MTEwMn0.bVTdcykkYHXuQeIQ4mXB1MSkxfYEN5OUXcomV12qHLs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export const USERS_TABLE = 'usuarios-kids';
export const DOCS_TABLE = 'documentos-kids';
export const LOGS_TABLE = 'lgpd-logs-kids';

// ==========================================
// OPERAÇÕES DE USUÁRIOS (usuarios-kids)
// ==========================================

export async function supabaseSaveUser(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: user.id,
      nome: user.nome,
      email: user.email.toLowerCase(),
      data_nascimento: user.dataNascimento || null,
      role: user.role || 'USUARIO',
      password_hash: user.passwordHash,
      password_salt: user.passwordSalt,
      encrypted_telefone: user.encryptedTelefone,
      encrypted_cpf: user.encryptedCpf,
      rede: user.rede,
      foto_url: user.fotoUrl || null,
      lgpd_consent: user.lgpdConsent,
      lgpd_consent_date: user.lgpdConsentDate || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(USERS_TABLE).upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao salvar no Supabase usuarios-kids:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Falha de conexão Supabase usuarios-kids:', err);
    return { success: false, error: err.message || 'Falha de conexão' };
  }
}

export async function supabaseUpdateUserBirthDate(
  userId: string,
  dataNascimento: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({
        data_nascimento: dataNascimento.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('Erro ao atualizar data de nascimento no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao atualizar nascimento:', err);
    return { success: false, error: err.message };
  }
}

export async function supabaseUpdateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('Erro ao atualizar papel do usuário no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao atualizar role:', err);
    return { success: false, error: err.message };
  }
}

export async function supabaseUpdateUserByDiacono(
  userId: string,
  updates: {
    nome: string;
    dataNascimento: string;
    rede: RedeType;
    fotoUrl?: string;
    role?: UserRole;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: any = {
      nome: updates.nome.trim(),
      data_nascimento: updates.dataNascimento.trim(),
      rede: updates.rede,
      foto_url: updates.fotoUrl || null,
      updated_at: new Date().toISOString(),
    };
    if (updates.role) {
      payload.role = updates.role;
    }

    const { error } = await supabase.from(USERS_TABLE).update(payload).eq('id', userId);
    if (error) {
      console.warn('Erro ao atualizar dados do usuário pelo Diácono no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Falha ao atualizar dados do usuário pelo Diácono:', err);
    return { success: false, error: err.message || 'Erro de conexão com o Supabase' };
  }
}

export async function supabaseGetUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      dataNascimento: data.data_nascimento || '',
      role: (data.role as UserRole) || 'USUARIO',
      passwordHash: data.password_hash,
      passwordSalt: data.password_salt,
      telefone: '', // Descriptografado localmente com a chave
      cpf: '', // Descriptografado localmente com a chave
      encryptedTelefone: data.encrypted_telefone,
      encryptedCpf: data.encrypted_cpf,
      rede: data.rede,
      fotoUrl: data.foto_url || undefined,
      lgpdConsent: data.lgpd_consent,
      lgpdConsentDate: data.lgpd_consent_date,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Erro ao buscar usuário no Supabase:', err);
    return null;
  }
}

export async function supabaseGetAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from(USERS_TABLE).select('*').order('nome');
    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      email: d.email,
      dataNascimento: d.data_nascimento || '',
      role: (d.role as UserRole) || 'USUARIO',
      passwordHash: d.password_hash,
      passwordSalt: d.password_salt,
      telefone: '',
      cpf: '',
      encryptedTelefone: d.encrypted_telefone,
      encryptedCpf: d.encrypted_cpf,
      rede: d.rede,
      fotoUrl: d.foto_url || undefined,
      lgpdConsent: d.lgpd_consent,
      lgpdConsentDate: d.lgpd_consent_date,
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.error('Erro ao listar todos os usuários:', err);
    return [];
  }
}

export async function supabaseDeleteUser(userId: string): Promise<void> {
  try {
    await supabase.from(USERS_TABLE).delete().eq('id', userId);
  } catch (err) {
    console.error('Erro ao excluir usuário no Supabase:', err);
  }
}

// ==========================================
// OPERAÇÕES DE CERTIDÕES (documentos-kids)
// ==========================================

export async function supabaseSaveDocument(doc: DocumentRecord): Promise<void> {
  try {
    const payload = {
      id: doc.id,
      user_id: doc.userId,
      titulo: doc.titulo,
      tipo: doc.tipo,
      numero_documento: doc.numeroDocumento || null,
      encrypted_numero_documento: doc.encryptedNumeroDocumento,
      orgao_emissor: doc.orgaoEmissor || 'Polícia Federal - ePol/SINIC',
      data_emissao: doc.dataEmissao || null,
      data_validade: doc.dataValidade || null,
      observacoes: doc.observacoes || null,
      arquivo_url: doc.arquivoUrl || null,
      encrypted_arquivo_url: doc.encryptedArquivoUrl || null,
      nome_arquivo: doc.nomeArquivo || null,
      tamanho_arquivo: doc.tamanhoArquivo || null,
      tipo_arquivo: doc.tipoArquivo || null,
      is_sensivel: doc.isSensivel ?? true,
      nome_extraido: doc.nomeExtraido || null,
      data_nascimento_extraida: doc.dataNascimentoExtraida || null,
      cpf_extraido: doc.cpfExtraido || null,
      data_expedicao: doc.dataEmissao || null,
      status_validacao: doc.statusValidacao || 'PENDENTE',
      dias_restantes_validade: doc.diasRestantesValidade,
      constata_antecedentes: doc.constataAntecedentes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(DOCS_TABLE).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar documento no Supabase:', error.message);
    }
  } catch (err) {
    console.error('Falha de conexão ao salvar documento:', err);
  }
}

export async function supabaseGetDocuments(userId: string): Promise<DocumentRecord[]> {
  try {
    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      titulo: d.titulo,
      tipo: 'CERTIDAO_ANTECEDENTES',
      numeroDocumento: d.numero_documento || '',
      encryptedNumeroDocumento: d.encrypted_numero_documento,
      orgaoEmissor: d.orgao_emissor || 'Polícia Federal',
      dataEmissao: d.data_emissao || d.data_expedicao || '',
      dataValidade: d.data_validade || '',
      diasRestantesValidade: d.dias_restantes_validade ?? 0,
      observacoes: d.observacoes || undefined,
      arquivoUrl: d.arquivo_url || undefined,
      encryptedArquivoUrl: d.encrypted_arquivo_url || undefined,
      nomeArquivo: d.nome_arquivo || undefined,
      tamanhoArquivo: d.tamanho_arquivo ? Number(d.tamanho_arquivo) : undefined,
      tipoArquivo: d.tipo_arquivo || undefined,
      isSensivel: d.is_sensivel,
      nomeExtraido: d.nome_extraido || undefined,
      dataNascimentoExtraida: d.data_nascimento_extraida || undefined,
      cpfExtraido: d.cpf_extraido || undefined,
      constataAntecedentes: d.constata_antecedentes ?? false,
      statusValidacao: d.status_validacao || 'PENDENTE',
      divergencias: [],
      criadoEm: d.created_at,
      atualizadoEm: d.updated_at,
    }));
  } catch (err) {
    console.error('Erro ao buscar documentos no Supabase:', err);
    return [];
  }
}

// Busca todos os documentos do sistema vinculados aos respectivos usuários para visão do Diácono
export async function supabaseGetAllDocumentsForDiacono(): Promise<DocumentRecord[]> {
  try {
    const [docsRes, usersRes] = await Promise.all([
      supabase.from(DOCS_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(USERS_TABLE).select('id, nome, email, rede, data_nascimento, foto_url'),
    ]);

    if (docsRes.error || !docsRes.data) return [];

    const usersMap = new Map<string, any>();
    if (usersRes.data) {
      usersRes.data.forEach((u: any) => {
        usersMap.set(u.id, u);
      });
    }

    return docsRes.data.map((d: any) => {
      const u = usersMap.get(d.user_id);
      return {
        id: d.id,
        userId: d.user_id,
        titulo: d.titulo || 'Certidão de Antecedentes Criminais',
        tipo: 'CERTIDAO_ANTECEDENTES',
        numeroDocumento: d.numero_documento || '',
        encryptedNumeroDocumento: d.encrypted_numero_documento,
        orgaoEmissor: d.orgao_emissor || 'Polícia Federal - ePol/SINIC',
        dataEmissao: d.data_emissao || d.data_expedicao || '',
        dataValidade: d.data_validade || '',
        diasRestantesValidade: d.dias_restantes_validade ?? 0,
        observacoes: d.observacoes || undefined,
        arquivoUrl: d.arquivo_url || undefined,
        encryptedArquivoUrl: d.encrypted_arquivo_url || undefined,
        nomeArquivo: d.nome_arquivo || undefined,
        tamanhoArquivo: d.tamanho_arquivo ? Number(d.tamanho_arquivo) : undefined,
        tipoArquivo: d.tipo_arquivo || undefined,
        isSensivel: d.is_sensivel,
        nomeExtraido: d.nome_extraido || undefined,
        dataNascimentoExtraida: d.data_nascimento_extraida || undefined,
        cpfExtraido: d.cpf_extraido || undefined,
        constataAntecedentes: d.constata_antecedentes ?? false,
        statusValidacao: d.status_validacao || 'PENDENTE',
        divergencias: [],
        userNome: u ? u.nome : 'Usuário Não Encontrado',
        userEmail: u ? u.email : '',
        userRede: u ? u.rede : undefined,
        userDataNascimento: u ? u.data_nascimento : undefined,
        userFotoUrl: u ? u.foto_url : undefined,
        criadoEm: d.created_at,
        atualizadoEm: d.updated_at,
      };
    });
  } catch (err) {
    console.error('Erro ao buscar todos os documentos para o Diácono:', err);
    return [];
  }
}

export async function supabaseDeleteDocument(docId: string): Promise<void> {
  try {
    await supabase.from(DOCS_TABLE).delete().eq('id', docId);
  } catch (err) {
    console.error('Erro ao deletar documento no Supabase:', err);
  }
}

// ==========================================
// OPERAÇÕES DE LOGS LGPD (lgpd-logs-kids)
// ==========================================

export async function supabaseAddLgpdLog(log: LGPDLog): Promise<void> {
  try {
    await supabase.from(LOGS_TABLE).insert({
      id: log.id,
      user_id: log.userId,
      operacao: log.operacao,
      detalhes: log.detalhes,
      timestamp: log.timestamp,
    });
  } catch (err) {
    console.error('Erro ao registrar log no Supabase:', err);
  }
}
