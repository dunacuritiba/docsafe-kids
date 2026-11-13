import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RedeType, UserRole } from '../types';
import { isUserAdmin } from '../types';
import {
  generateSalt,
  hashPassword,
  deriveEncryptionKey,
  encryptData,
  decryptData,
  exportKeyRaw,
  importKeyRaw,
} from '../utils/crypto';
import {
  getStoredUsers,
  saveUsers,
  getStoredSessionUser,
  saveSessionUser,
  getStoredSessionKey,
  saveSessionKey,
  addLgpdLog,
  getStoredDocuments,
  saveDocuments,
} from '../utils/storage';
import {
  supabaseSaveUser,
  supabaseGetUserByEmail,
  supabaseDeleteUser,
  supabaseUpdateUserBirthDate,
  supabaseUpdateUserRole,
} from '../services/supabase';

interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  role?: UserRole; // 'USUARIO' por padrão
  rede: RedeType;
  fotoUrl?: string;
  lgpdConsent: boolean;
}

interface AuthContextType {
  user: User | null;
  activeKey: CryptoKey | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfileFoto: (fotoUrl: string) => Promise<void>;
  updateBirthDate: (dataNascimento: string) => Promise<boolean>;
  toggleRole: (newRole: UserRole) => Promise<boolean>;
  changeUserRole: (targetUserId: string, newRole: UserRole) => Promise<boolean>;
  exportUserData: () => Promise<string>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão ativa sincronizando com o Supabase
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = getStoredSessionUser();
        const storedRawKey = getStoredSessionKey();

        if (storedUser && storedRawKey) {
          const key = await importKeyRaw(storedRawKey);

          // Busca dados mais recentes no Supabase (incluindo data_nascimento e role)
          let remoteUser = await supabaseGetUserByEmail(storedUser.email);
          const baseUser = remoteUser || storedUser;

          // Decripta os dados sensíveis do usuário
          const decryptedCpf = await decryptData(baseUser.encryptedCpf, key);
          const decryptedPhone = await decryptData(baseUser.encryptedTelefone, key);

          const fullUser: User = {
            ...baseUser,
            role: baseUser.role || 'USUARIO',
            dataNascimento: baseUser.dataNascimento || storedUser.dataNascimento || '',
            cpf: decryptedCpf,
            telefone: decryptedPhone,
          };

          setUser(fullUser);
          saveSessionUser(fullUser);
          setActiveKey(key);
        }
      } catch (e) {
        console.error('Falha ao restaurar sessão:', e);
        saveSessionUser(null);
        saveSessionKey(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Tenta carregar do Supabase (collection usuarios-kids)
      let targetUser: User | null = await supabaseGetUserByEmail(normalizedEmail);

      // 2. Fallback no armazenamento local se não encontrado no Supabase
      if (!targetUser) {
        const users = getStoredUsers();
        targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
      }

      if (!targetUser) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      // Valida hash da senha
      const testHash = await hashPassword(password, targetUser.passwordSalt);
      if (testHash !== targetUser.passwordHash) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      // Deriva a chave AES a partir da senha e salt
      const encryptionKey = await deriveEncryptionKey(password, targetUser.passwordSalt);

      // Decripta dados sensíveis para uso seguro em memória
      const decryptedCpf = await decryptData(targetUser.encryptedCpf, encryptionKey);
      const decryptedPhone = await decryptData(targetUser.encryptedTelefone, encryptionKey);

      const authenticatedUser: User = {
        ...targetUser,
        role: targetUser.role || 'USUARIO',
        dataNascimento: targetUser.dataNascimento || '',
        cpf: decryptedCpf,
        telefone: decryptedPhone,
      };

      const rawKey = await exportKeyRaw(encryptionKey);
      saveSessionKey(rawKey);
      saveSessionUser(authenticatedUser);

      // Mantém cache local sincronizado
      const localUsers = getStoredUsers().filter(u => u.id !== authenticatedUser.id);
      saveUsers([authenticatedUser, ...localUsers]);

      setUser(authenticatedUser);
      setActiveKey(encryptionKey);

      addLgpdLog(
        targetUser.id,
        'LOGIN',
        `Acesso autenticado ao sistema como [${authenticatedUser.role}]. Conexão com Supabase usuarios-kids.`
      );

      return { success: true };
    } catch (e: any) {
      console.error('Erro no login:', e);
      return { success: false, error: 'Ocorreu um erro ao processar o login com criptografia.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();

      // Verifica duplicidade no Supabase e localmente
      const existingRemote = await supabaseGetUserByEmail(normalizedEmail);
      const localUsers = getStoredUsers();
      const existingLocal = localUsers.some(u => u.email.toLowerCase() === normalizedEmail);

      if (existingRemote || existingLocal) {
        return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
      }

      // Gera Salt e Hash seguro da senha
      const salt = generateSalt();
      const passwordHash = await hashPassword(data.senha, salt);

      // Deriva chave de criptografia AES-GCM
      const encryptionKey = await deriveEncryptionKey(data.senha, salt);

      // Criptografa CPF e Telefone (Diretriz de Dados Sensíveis da LGPD)
      const encryptedCpf = await encryptData(data.cpf, encryptionKey);
      const encryptedTelefone = await encryptData(data.telefone, encryptionKey);

      const newUser: User = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        nome: data.nome.trim(),
        email: normalizedEmail,
        dataNascimento: data.dataNascimento.trim(),
        role: data.role || 'USUARIO', // 'USUARIO' por padrão ou 'DIACONO'
        passwordHash,
        passwordSalt: salt,
        telefone: data.telefone,
        cpf: data.cpf,
        encryptedTelefone,
        encryptedCpf,
        rede: data.rede,
        fotoUrl: data.fotoUrl,
        lgpdConsent: data.lgpdConsent,
        lgpdConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // 1. Grava na collection 'usuarios-kids' no Supabase com role
      const remoteRes = await supabaseSaveUser(newUser);
      if (!remoteRes.success) {
        console.warn('Alerta Supabase:', remoteRes.error);
      }

      // 2. Grava no cache local
      saveUsers([...localUsers, newUser]);

      // 3. Salva sessão
      const rawKey = await exportKeyRaw(encryptionKey);
      saveSessionKey(rawKey);
      saveSessionUser(newUser);

      setUser(newUser);
      setActiveKey(encryptionKey);

      addLgpdLog(
        newUser.id,
        'CADASTRO',
        `Usuário cadastrado com papel [${newUser.role}] na collection 'usuarios-kids' (Supabase).`
      );

      return { success: true };
    } catch (e: any) {
      console.error('Erro no cadastro:', e);
      return { success: false, error: 'Falha ao criptografar e salvar dados no Supabase.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Permite salvar/atualizar a data de nascimento do usuário no Supabase e na sessão
  const updateBirthDate = async (dataNascimento: string): Promise<boolean> => {
    if (!user) return false;
    const cleanDate = dataNascimento.trim();

    try {
      const updatedUser: User = {
        ...user,
        dataNascimento: cleanDate,
      };

      await supabaseUpdateUserBirthDate(user.id, cleanDate);

      const users = getStoredUsers();
      const updatedUsers = users.map(u => (u.id === user.id ? updatedUser : u));
      saveUsers(updatedUsers);
      saveSessionUser(updatedUser);
      setUser(updatedUser);

      addLgpdLog(
        user.id,
        'ACESSO_DADOS',
        `Data de nascimento (${cleanDate}) atualizada no Supabase.`
      );

      return true;
    } catch (err) {
      console.error('Erro ao atualizar data de nascimento:', err);
      return false;
    }
  };

  // Permite alternar papel do próprio usuário (RESTRITO AO ADMINISTRADOR luan@secid.pr.gov.br)
  const toggleRole = async (newRole: UserRole): Promise<boolean> => {
    if (!user) return false;
    if (!isUserAdmin(user.email)) {
      console.warn('Apenas o administrador luan@secid.pr.gov.br pode alterar papéis.');
      return false;
    }
    try {
      const updatedUser: User = {
        ...user,
        role: newRole,
      };

      await supabaseUpdateUserRole(user.id, newRole);

      const users = getStoredUsers();
      const updatedUsers = users.map(u => (u.id === user.id ? updatedUser : u));
      saveUsers(updatedUsers);
      saveSessionUser(updatedUser);
      setUser(updatedUser);

      addLgpdLog(
        user.id,
        'ACESSO_DADOS',
        `Administrador alterou seu papel para [${newRole}] na tabela usuarios-kids.`
      );

      return true;
    } catch (err) {
      console.error('Erro ao alterar papel:', err);
      return false;
    }
  };

  // Permite ao Administrador (luan@secid.pr.gov.br) alterar o papel de qualquer usuário
  const changeUserRole = async (targetUserId: string, newRole: UserRole): Promise<boolean> => {
    if (!user || !isUserAdmin(user.email)) {
      console.warn('Ação negada: apenas o administrador luan@secid.pr.gov.br pode alterar papéis.');
      return false;
    }

    try {
      const res = await supabaseUpdateUserRole(targetUserId, newRole);
      if (!res.success) return false;

      // Atualiza cache local de usuários se presente
      const users = getStoredUsers();
      const updatedUsers = users.map(u => (u.id === targetUserId ? { ...u, role: newRole } : u));
      saveUsers(updatedUsers);

      // Se o usuário afetado for o próprio administrador logado
      if (user.id === targetUserId) {
        const updatedSelf = { ...user, role: newRole };
        setUser(updatedSelf);
        saveSessionUser(updatedSelf);
      }

      addLgpdLog(
        user.id,
        'ACESSO_DADOS',
        `Administrador alterou papel do usuário ID ${targetUserId} para [${newRole}] no Supabase.`
      );

      return true;
    } catch (err) {
      console.error('Erro ao alterar papel do usuário:', err);
      return false;
    }
  };

  const logout = () => {
    if (user) {
      addLgpdLog(user.id, 'ACESSO_DADOS', `Sessão encerrada. Chaves de criptografia limpas da memória.`);
    }
    setUser(null);
    setActiveKey(null);
    saveSessionUser(null);
    saveSessionKey(null);
  };

  const updateProfileFoto = async (fotoUrl: string) => {
    if (!user) return;
    const updatedUser = { ...user, fotoUrl };

    const users = getStoredUsers();
    const updatedUsers = users.map(u => (u.id === user.id ? updatedUser : u));
    saveUsers(updatedUsers);
    saveSessionUser(updatedUser);
    setUser(updatedUser);

    await supabaseSaveUser(updatedUser);
  };

  // LGPD Art. 18, V - Portabilidade de Dados (Exportação)
  const exportUserData = async (): Promise<string> => {
    if (!user) return '';
    const docs = getStoredDocuments().filter(d => d.userId === user.id);

    const exportPayload = {
      termo: 'Exportação de Dados Pessoais - LGPD (Lei nº 13.709/2018)',
      origem: 'Supabase Collection: usuarios-kids',
      dataExportacao: new Date().toISOString(),
      titular: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        dataNascimento: user.dataNascimento,
        telefone: user.telefone,
        cpf: user.cpf,
        rede: user.rede,
        lgpdConsentDate: user.lgpdConsentDate,
        createdAt: user.createdAt,
      },
      certidoesRegistradas: docs.map(d => ({
        titulo: d.titulo,
        numeroCertidao: d.numeroDocumento,
        orgaoEmissor: d.orgaoEmissor,
        dataExpedicao: d.dataEmissao,
        dataValidade: d.dataValidade,
        diasRestantesValidade: d.diasRestantesValidade,
        nomeExtraido: d.nomeExtraido,
        dataNascimentoExtraida: d.dataNascimentoExtraida,
        cpfExtraido: d.cpfExtraido,
        statusValidacao: d.statusValidacao,
        criadoEm: d.criadoEm,
      })),
    };

    addLgpdLog(user.id, 'EXPORTACAO', 'Titular solicitou exportação integral dos seus dados (Portabilidade LGPD).');
    return JSON.stringify(exportPayload, null, 2);
  };

  // LGPD Art. 18, VI - Direito à Eliminação dos Dados
  const deleteUserAccount = async () => {
    if (!user) return;
    const userId = user.id;

    await supabaseDeleteUser(userId);

    const users = getStoredUsers().filter(u => u.id !== userId);
    saveUsers(users);

    const docs = getStoredDocuments().filter(d => d.userId !== userId);
    saveDocuments(docs);

    addLgpdLog(userId, 'EXCLUSAO', 'Titular exerceu direito de exclusão total da collection usuarios-kids.');
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeKey,
        isLoading,
        login,
        register,
        logout,
        updateProfileFoto,
        updateBirthDate,
        toggleRole,
        changeUserRole,
        exportUserData,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
