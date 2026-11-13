import type { User, DocumentRecord, LGPDLog } from '../types';
import { supabaseAddLgpdLog } from '../services/supabase';

const USERS_KEY = 'docsafe_users_v1';
const CURRENT_USER_KEY = 'docsafe_session_user_v1';
const SESSION_KEY_RAW = 'docsafe_session_cryptokey_v1';
const DOCS_KEY = 'docsafe_documents_v1';
const LOGS_KEY = 'docsafe_lgpd_logs_v1';

// Salva e recupera usuários
export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao ler usuários:', e);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Salva e recupera documentos
export function getStoredDocuments(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao ler documentos:', e);
    return [];
  }
}

export function saveDocuments(docs: DocumentRecord[]): void {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

// Salva e recupera sessão
export function getStoredSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveSessionUser(user: User | null): void {
  if (user) {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Chave AES armazenada na sessionStorage volátil para a sessão ativa
export function getStoredSessionKey(): string | null {
  return sessionStorage.getItem(SESSION_KEY_RAW);
}

export function saveSessionKey(rawBase64Key: string | null): void {
  if (rawBase64Key) {
    sessionStorage.setItem(SESSION_KEY_RAW, rawBase64Key);
  } else {
    sessionStorage.removeItem(SESSION_KEY_RAW);
  }
}

// Logs de conformidade LGPD
export function getStoredLgpdLogs(): LGPDLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addLgpdLog(userId: string, operacao: LGPDLog['operacao'], detalhes: string): void {
  const logs = getStoredLgpdLogs();
  const newLog: LGPDLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId,
    operacao,
    detalhes,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(LOGS_KEY, JSON.stringify([newLog, ...logs.slice(0, 199)]));

  // Envia em segundo plano para o Supabase
  supabaseAddLgpdLog(newLog).catch(() => {});
}
