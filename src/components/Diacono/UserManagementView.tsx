import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Eye,
  Camera,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowRightLeft,
  Download,
  Printer,
} from 'lucide-react';
import type { User, DocumentRecord, UserRole } from '../../types';
import { REDES_DISPONIVEIS, isUserAdmin } from '../../types';
import { supabaseGetAllUsers, supabaseGetAllDocumentsForDiacono } from '../../services/supabase';
import { getStoredUsers } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { downloadDocumentFile, printDocument } from '../../utils/documentExport';
import { UserEditByDiaconoModal } from './UserEditByDiaconoModal';
import { DocumentViewModal } from '../Documents/DocumentViewModal';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalizeDate } from '../../utils/certidaoParser';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, changeUserRole } = useAuth();
  const isAdmin = isUserAdmin(currentUser?.email);
  const isAuthorized = currentUser?.role === 'DIACONO' || isAdmin;

  // Estados de dados
  const [usersList, setUsersList] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRede, setFilterRede] = useState<string>('TODAS');
  const [filterRole, setFilterRole] = useState<string>('TODOS');
  const [filterCert, setFilterCert] = useState<string>('TODOS');

  // Modais de ação
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const [viewingDocUser, setViewingDocUser] = useState<User | null>(null);

  // Estados de atualização de papel pelo Admin
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);

  // Carrega todos os membros e todas as certidões
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [remoteUsers, allDocs] = await Promise.all([
        supabaseGetAllUsers(),
        supabaseGetAllDocumentsForDiacono(),
      ]);

      const stored = getStoredUsers();
      // Mescla priorizando remotos
      const mergedMap = new Map<string, User>();
      stored.forEach(u => mergedMap.set(u.id, u));
      remoteUsers.forEach(u => mergedMap.set(u.id, u));

      setUsersList(Array.from(mergedMap.values()));
      setDocuments(allDocs);
    } catch (err) {
      console.error('Erro ao carregar dados para Gestão de Usuários:', err);
      setUsersList(getStoredUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  // Ação de alternar papel (Admin apenas)
  const handleToggleUserRole = async (targetUser: User) => {
    if (!isAdmin || updatingUserId) return;
    const newRole: UserRole = targetUser.role === 'DIACONO' ? 'USUARIO' : 'DIACONO';

    setUpdatingUserId(targetUser.id);
    const success = await changeUserRole(targetUser.id, newRole);
    setUpdatingUserId(null);

    if (success) {
      setRoleUpdateSuccess(`Papel de ${targetUser.nome} alterado para ${newRole}!`);
      setTimeout(() => setRoleUpdateSuccess(null), 3500);
      loadData();
    }
  };

  // Filtragem multifatorial
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (u.nome || '').toLowerCase().includes(term);
        const matchesEmail = (u.email || '').toLowerCase().includes(term);
        const matchesRede = (u.rede || '').toLowerCase().includes(term);
        const matchesPhone = (u.telefone || '').includes(term);
        if (!matchesName && !matchesEmail && !matchesRede && !matchesPhone) return false;
      }

      if (filterRede !== 'TODAS' && u.rede !== filterRede) {
        return false;
      }

      if (filterRole !== 'TODOS' && u.role !== filterRole) {
        return false;
      }

      if (filterCert !== 'TODOS') {
        const userDocs = documents.filter(d => d.userId === u.id);
        const hasDocs = userDocs.length > 0;
        const hasValid = userDocs.some(
          d => d.statusValidacao === 'APROVADO' && d.diasRestantesValidade >= 0
        );

        if (filterCert === 'COM_CERTIDAO_VALIDA' && !hasValid) return false;
        if (filterCert === 'COM_CERTIDAO_EXPIRADA' && (!hasDocs || hasValid)) return false;
        if (filterCert === 'SEM_CERTIDAO' && hasDocs) return false;
      }

      return true;
    });
  }, [usersList, documents, searchTerm, filterRede, filterRole, filterCert]);

  // Contadores
  const totalUsuarios = usersList.length;
  const totalDiaconos = usersList.filter(u => u.role === 'DIACONO').length;
  const totalComFoto = usersList.filter(u => Boolean(u.fotoUrl)).length;

  // Se o usuário não for Diácono nem Admin, bloqueia o acesso com aviso explícito
  if (!isAuthorized) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto my-12 border-border shadow-md space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">
          Acesso Restrito aos Diáconos
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          A <strong>Gestão de Usuários</strong> é permitida exclusivamente para <strong>Diáconos</strong> e <strong>Administradores</strong> da igreja.
        </CardDescription>
        <p className="text-xs text-muted-foreground bg-muted p-3.5 rounded-xl border border-border">
          Caso necessite de permissão, solicite ao administrador geral:<br />
          <strong className="text-foreground">luan@secid.pr.gov.br</strong>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <Card className="p-5 sm:p-7 border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Painel Exclusivo para Diáconos & Liderança
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              Gestão de Usuários & Membros
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Consulte todos os voluntários e membros cadastrados. Como diácono, você pode verificar a regularidade da certidão criminal (90 dias) e <strong>alterar os dados pessoais e a foto de perfil</strong> de qualquer usuário quando necessário.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="gap-1.5 h-10 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Lista
            </Button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60 text-xs">
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
            <span className="text-muted-foreground block text-[11px] font-medium">Total de Membros</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-0.5 block">
              {totalUsuarios}
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/50">
            <span className="text-purple-700 dark:text-purple-400 block text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Diáconos Ativos
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5 block">
              {totalDiaconos}
            </span>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
            <span className="text-blue-700 dark:text-blue-400 block text-[11px] font-medium flex items-center gap-1">
              <Camera className="w-3 h-3" /> Membros com Foto
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5 block">
              {totalComFoto}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Usuários Filtrados
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {filteredUsers.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Feedback de alteração de papel */}
      {roleUpdateSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {roleUpdateSuccess}
        </div>
      )}

      {/* Barra de Filtros */}
      <Card className="p-4 sm:p-5 border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filtros de Membros & Usuários
          </span>
          <span className="text-xs text-muted-foreground">
            Exibindo <strong>{filteredUsers.length}</strong> de {totalUsuarios} cadastrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca por texto */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por nome, e-mail, celular..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-11 sm:h-10 text-xs sm:text-sm bg-background"
            />
          </div>

          {/* Filtro por Rede */}
          <div>
            <select
              aria-label="Filtrar por rede"
              value={filterRede}
              onChange={e => setFilterRede(e.target.value)}
              className="w-full h-11 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="TODAS">Todas as Redes</option>
              {REDES_DISPONIVEIS.map(r => (
                <option key={r.id} value={r.id}>
                  Rede {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Papel */}
          <div>
            <select
              aria-label="Filtrar por papel"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="w-full h-11 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="TODOS">Todos os Papéis</option>
              <option value="USUARIO">Apenas Usuários</option>
              <option value="DIACONO">Apenas Diáconos</option>
            </select>
          </div>

          {/* Filtro por Certidão */}
          <div>
            <select
              aria-label="Filtrar por certidão"
              value={filterCert}
              onChange={e => setFilterCert(e.target.value)}
              className="w-full h-11 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="TODOS">Status Certidão: Todos</option>
              <option value="COM_CERTIDAO_VALIDA">✅ Com Certidão Válida (≤90d)</option>
              <option value="COM_CERTIDAO_EXPIRADA">⚠️ Com Certidão Vencida / Divergente</option>
              <option value="SEM_CERTIDAO">❌ Sem Certidão Cadastrada</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Membros */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Carregando usuários cadastrados...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-border/80 p-6">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-base font-bold text-foreground">Nenhum membro encontrado</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Não encontramos nenhum usuário com os filtros selecionados. Tente alterar ou limpar os campos de busca.
          </p>
        </div>
      ) : (
        <>
          {/* VISÃO EM CARDS PARA MOBILE (md:hidden) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 block md:hidden">
            {filteredUsers.map(u => {
              const redeMeta = REDES_DISPONIVEIS.find(r => r.id === u.rede);
              const isSelfAdmin = isUserAdmin(u.email);
              const isUpdating = updatingUserId === u.id;
              const userDocs = documents.filter(d => d.userId === u.id);
              const hasValid = userDocs.some(
                d => d.statusValidacao === 'APROVADO' && d.diasRestantesValidade >= 0
              );
              const hasDivergent = userDocs.some(d => d.statusValidacao === 'DIVERGENTE');
              const hasExpired = userDocs.some(d => d.diasRestantesValidade < 0);

              return (
                <Card key={u.id} className="p-4 shadow-xs space-y-3.5 border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative shrink-0">
                        <Avatar className="size-14 rounded-2xl border-2 border-border shadow-xs">
                          {u.fotoUrl && <AvatarImage src={u.fotoUrl} alt={u.nome} className="object-cover" />}
                          <AvatarFallback className="text-sm font-black bg-primary/10 text-primary rounded-2xl">
                            {(u.nome || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {u.fotoUrl && (
                          <span
                            className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-white shadow-xs"
                            title="Foto cadastrada"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground text-sm truncate">{u.nome}</span>
                          {isSelfAdmin && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-300 py-0 px-1 shrink-0">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block truncate">{u.email}</span>
                      </div>
                    </div>

                    {redeMeta && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                      >
                        {redeMeta.label}
                      </span>
                    )}
                  </div>

                  {/* Informações detalhadas */}
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Nascimento</span>
                      <span className="font-mono font-semibold text-foreground">
                        {u.dataNascimento ? normalizeDate(u.dataNascimento) : <span className="text-amber-500 font-sans">Não cadastrada</span>}
                      </span>
                    </div>

                    {u.telefone && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Celular</span>
                        <span className="font-mono text-foreground">{u.telefone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Papel</span>
                      <Badge
                        variant={u.role === 'DIACONO' ? 'secondary' : 'outline'}
                        className="text-xs font-bold gap-1 py-0.5"
                      >
                        <UserCheck className="w-3 h-3" />
                        {u.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-muted-foreground">Certidão (90d)</span>
                      {hasValid ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-1 py-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Válida (≤90d)
                        </Badge>
                      ) : hasDivergent ? (
                        <Badge className="bg-rose-600 text-white text-[11px] font-bold gap-1 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> Divergente
                        </Badge>
                      ) : hasExpired ? (
                        <Badge className="bg-amber-600 text-white text-[11px] font-bold gap-1 py-0.5">
                          <Calendar className="w-3 h-3" /> Vencida (&gt;90d)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px] gap-1 py-0.5">
                          <FileText className="w-3 h-3" /> Sem certidão
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Ações do Diácono */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setEditingUser(u);
                          setIsEditModalOpen(true);
                        }}
                        className="w-full text-xs font-bold gap-1.5 h-10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar Dados & Foto
                      </Button>

                      {userDocs.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingDoc(userDocs[0]);
                            setViewingDocUser(u);
                          }}
                          className="w-full text-xs font-semibold gap-1.5 h-10 text-primary"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Certidão ({userDocs.length})
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="w-full text-xs text-muted-foreground h-10"
                        >
                          Sem certidão
                        </Button>
                      )}
                    </div>

                    {userDocs.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocumentFile(userDocs[0])}
                          disabled={!userDocs[0].arquivoUrl}
                          className="w-full text-xs font-semibold gap-1.5 h-9"
                          title="Baixar arquivo da certidão deste membro"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar Certidão
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printDocument(userDocs[0])}
                          className="w-full text-xs font-semibold gap-1.5 h-9 text-primary"
                          title="Imprimir certidão deste membro"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Certidão
                        </Button>
                      </div>
                    )}

                    {/* Alternar papel (Admin apenas) */}
                    {isAdmin && (
                      <Button
                        variant={u.role === 'DIACONO' ? 'outline' : 'secondary'}
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleToggleUserRole(u)}
                        className={`w-full text-xs font-semibold gap-1.5 h-9 ${
                          u.role === 'DIACONO'
                            ? ''
                            : 'bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200'
                        }`}
                      >
                        <ArrowRightLeft className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                        {isUpdating
                          ? 'Salvando...'
                          : u.role === 'DIACONO'
                          ? 'Rebaixar para Usuário Comum'
                          : 'Promover a Diácono'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* TABELA PARA DESKTOP (hidden md:block) */}
          <Card className="overflow-hidden border-border shadow-xs hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Membro / Usuário</TableHead>
                  <TableHead className="font-bold">Rede</TableHead>
                  <TableHead className="font-bold">Data Nascimento</TableHead>
                  <TableHead className="font-bold">Certidão (90 dias)</TableHead>
                  <TableHead className="font-bold">Papel</TableHead>
                  <TableHead className="font-bold text-right">Ações do Diácono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => {
                  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === u.rede);
                  const isSelfAdmin = isUserAdmin(u.email);
                  const isUpdating = updatingUserId === u.id;
                  const userDocs = documents.filter(d => d.userId === u.id);
                  const hasValid = userDocs.some(
                    d => d.statusValidacao === 'APROVADO' && d.diasRestantesValidade >= 0
                  );
                  const hasDivergent = userDocs.some(d => d.statusValidacao === 'DIVERGENTE');
                  const hasExpired = userDocs.some(d => d.diasRestantesValidade < 0);

                  return (
                    <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar size="default" className="border border-border">
                              {u.fotoUrl && <AvatarImage src={u.fotoUrl} alt={u.nome} className="object-cover" />}
                              <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                                {(u.nome || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {u.fotoUrl && (
                              <span
                                className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-white shadow-xs"
                                title="Foto cadastrada"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-sm">{u.nome}</span>
                              {isSelfAdmin && (
                                <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-300 py-0 px-1.5">
                                  Admin Geral
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground block">{u.email}</span>
                            {u.telefone && (
                              <span className="text-[11px] text-muted-foreground/80 font-mono block">
                                {u.telefone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {redeMeta ? (
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                          >
                            {redeMeta.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-foreground text-xs">
                        {u.dataNascimento ? normalizeDate(u.dataNascimento) : <span className="text-amber-500 font-sans">Não cadastrada</span>}
                      </TableCell>

                      <TableCell>
                        {hasValid ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-1 py-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Válida (≤90d)
                          </Badge>
                        ) : hasDivergent ? (
                          <Badge className="bg-rose-600 text-white text-[11px] font-bold gap-1 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> Divergente
                          </Badge>
                        ) : hasExpired ? (
                          <Badge className="bg-amber-600 text-white text-[11px] font-bold gap-1 py-0.5">
                            <Calendar className="w-3 h-3" /> Vencida (&gt;90d)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[11px] gap-1 py-0.5">
                            <FileText className="w-3 h-3" /> Sem certidão
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={u.role === 'DIACONO' ? 'secondary' : 'outline'}
                          className="text-xs font-bold gap-1 py-0.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {u.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setIsEditModalOpen(true);
                            }}
                            className="text-xs font-bold gap-1.5 h-8"
                            title="Editar dados e trocar foto de perfil deste membro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar Dados & Foto
                          </Button>

                          {userDocs.length > 0 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setViewingDoc(userDocs[0]);
                                  setViewingDocUser(u);
                                }}
                                className="text-xs font-semibold gap-1 h-8 text-primary"
                                title="Visualizar certidão deste membro com cruzamento de dados"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadDocumentFile(userDocs[0])}
                                disabled={!userDocs[0].arquivoUrl}
                                className="text-xs font-semibold gap-1 h-8 px-2"
                                title={
                                  userDocs[0].arquivoUrl
                                    ? 'Baixar arquivo da certidão deste membro'
                                    : 'Sem anexo'
                                }
                              >
                                <Download className="w-3.5 h-3.5" />
                                Baixar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => printDocument(userDocs[0])}
                                className="text-xs font-semibold gap-1 h-8 px-2 text-primary"
                                title="Imprimir certidão deste membro"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Imprimir
                              </Button>
                            </>
                          )}

                          {isAdmin && (
                            <Button
                              variant={u.role === 'DIACONO' ? 'outline' : 'secondary'}
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleToggleUserRole(u)}
                              className={`text-xs font-semibold gap-1 h-8 ${
                                u.role === 'DIACONO'
                                  ? ''
                                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200'
                              }`}
                              title={
                                u.role === 'DIACONO'
                                  ? 'Rebaixar para Usuário Comum'
                                  : 'Promover este membro para Diácono'
                              }
                            >
                              <ArrowRightLeft className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                              {isUpdating
                                ? '...'
                                : u.role === 'DIACONO'
                                ? 'Rebaixar'
                                : 'Promover'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Modal de Edição de Usuário pelo Diácono */}
      <UserEditByDiaconoModal
        userToEdit={editingUser}
        userDocuments={documents}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSaved={loadData}
      />

      {/* Modal de Detalhes da Certidão */}
      <DocumentViewModal
        document={viewingDoc}
        targetUser={viewingDocUser}
        onClose={() => {
          setViewingDoc(null);
          setViewingDocUser(null);
        }}
        onEdit={() => {}}
      />
    </div>
  );
};