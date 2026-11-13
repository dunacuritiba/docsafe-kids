import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
  ShieldAlert,
  Users,
  LayoutGrid,
  Table as TableIcon,
  Crown,
  UserCheck,
  ShieldCheck,
  ArrowRightLeft,
  Edit2,
} from 'lucide-react';
import type { DocumentRecord, User, UserRole } from '../../types';
import { REDES_DISPONIVEIS, isUserAdmin } from '../../types';
import { supabaseGetAllDocumentsForDiacono, supabaseGetAllUsers } from '../../services/supabase';
import { getStoredUsers } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { DocumentViewModal } from '../Documents/DocumentViewModal';
import { UserEditByDiaconoModal } from './UserEditByDiaconoModal';
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

export const DiaconoDashboard: React.FC = () => {
  const { user: currentUser, changeUserRole } = useAuth();
  const isAdmin = isUserAdmin(currentUser?.email);

  // Abas do Painel: Documentos vs Gestão de Usuários
  const [activeSubTab, setActiveSubTab] = useState<'DOCUMENTS' | 'USERS'>('DOCUMENTS');

  // Modo de visualização para os documentos: Tabela ou Cards
  const [viewMode, setViewMode] = useState<'AUTO' | 'TABLE' | 'CARDS'>('AUTO');

  // Documentos
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Usuários (Gestão para Diáconos e Admin)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUserAdmin, setSearchUserAdmin] = useState('');
  const [userFilterRede, setUserFilterRede] = useState<string>('TODAS');
  const [userFilterRole, setUserFilterRole] = useState<string>('TODOS');
  const [userFilterCert, setUserFilterCert] = useState<string>('TODOS');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);

  // Modal de Edição de Usuário pelo Diácono
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtros de Documentos
  const [searchDocUser, setSearchDocUser] = useState('');
  const [selectedRede, setSelectedRede] = useState<string>('TODAS');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedValidity, setSelectedValidity] = useState<string>('TODOS');

  // Modal de Visualização de Documento
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);

  // Carrega todos os documentos de todos os usuários
  const fetchAllDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const all = await supabaseGetAllDocumentsForDiacono();
      setDocuments(all);
    } catch (err) {
      console.error('Erro ao carregar documentos para o Diácono:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Carrega lista de usuários para visualização e edição pelos Diáconos
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      let users = await supabaseGetAllUsers();
      if (users.length === 0) {
        users = getStoredUsers();
      }
      setUsersList(users);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setUsersList(getStoredUsers());
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAllDocs();
    fetchAllUsers();
  }, []);

  // Ação de alterar papel de usuário pelo Admin
  const handleToggleUserRole = async (targetUser: User) => {
    if (!isAdmin || updatingUserId) return;
    const newRole: UserRole = targetUser.role === 'DIACONO' ? 'USUARIO' : 'DIACONO';

    setUpdatingUserId(targetUser.id);
    const success = await changeUserRole(targetUser.id, newRole);
    setUpdatingUserId(null);

    if (success) {
      setRoleUpdateSuccess(`Papel de ${targetUser.nome} alterado para ${newRole}!`);
      setTimeout(() => setRoleUpdateSuccess(null), 3500);
      fetchAllUsers();
      fetchAllDocs();
    }
  };

  // Lista dinâmica de meses disponíveis a partir das certidões
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    documents.forEach(doc => {
      const dateStr = doc.dataEmissao || doc.criadoEm;
      if (dateStr) {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/');
          monthSet.add(`${parts[1]}/${parts[2]}`);
        } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          const parts = dateStr.split('-');
          monthSet.add(`${parts[1]}/${parts[0]}`);
        }
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [documents]);

  const formatMonthLabel = (m: string) => {
    const [mes, ano] = m.split('/');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const idx = parseInt(mes, 10) - 1;
    return `${meses[idx] || mes} de ${ano}`;
  };

  // Filtragem dos documentos
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (searchDocUser.trim()) {
        const term = searchDocUser.toLowerCase();
        const matchesName = (doc.userNome || '').toLowerCase().includes(term);
        const matchesDocName = (doc.nomeExtraido || '').toLowerCase().includes(term);
        const matchesEmail = (doc.userEmail || '').toLowerCase().includes(term);
        const matchesNum = (doc.numeroDocumento || '').toLowerCase().includes(term);
        const matchesCpf = (doc.cpfExtraido || '').toLowerCase().includes(term);

        if (!matchesName && !matchesDocName && !matchesEmail && !matchesNum && !matchesCpf) {
          return false;
        }
      }

      if (selectedRede !== 'TODAS') {
        if (doc.userRede !== selectedRede) return false;
      }

      if (selectedMonth !== 'TODOS') {
        const dateStr = doc.dataEmissao || doc.criadoEm || '';
        let docMonth = '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split('/');
          docMonth = `${parts[1]}/${parts[2]}`;
        } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          const parts = dateStr.split('-');
          docMonth = `${parts[1]}/${parts[0]}`;
        }

        if (docMonth !== selectedMonth) return false;
      }

      if (selectedStatus !== 'TODOS') {
        if (doc.statusValidacao !== selectedStatus) return false;
      }

      if (selectedValidity !== 'TODOS') {
        const isExp = doc.diasRestantesValidade < 0;
        const isSoon = !isExp && doc.diasRestantesValidade <= 15;

        if (selectedValidity === 'VALIDOS' && isExp) return false;
        if (selectedValidity === 'VENCENDO' && !isSoon) return false;
        if (selectedValidity === 'EXPIRADOS' && !isExp) return false;
      }

      return true;
    });
  }, [documents, searchDocUser, selectedRede, selectedMonth, selectedStatus, selectedValidity]);

  // Filtragem de Usuários no painel dos Diáconos
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (searchUserAdmin.trim()) {
        const term = searchUserAdmin.toLowerCase();
        const matchesName = (u.nome || '').toLowerCase().includes(term);
        const matchesEmail = (u.email || '').toLowerCase().includes(term);
        const matchesRede = (u.rede || '').toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesRede) return false;
      }

      if (userFilterRede !== 'TODAS' && u.rede !== userFilterRede) {
        return false;
      }

      if (userFilterRole !== 'TODOS' && u.role !== userFilterRole) {
        return false;
      }

      if (userFilterCert !== 'TODOS') {
        const userDocs = documents.filter(d => d.userId === u.id);
        const hasDocs = userDocs.length > 0;
        const hasValid = userDocs.some(
          d => d.statusValidacao === 'APROVADO' && d.diasRestantesValidade >= 0
        );

        if (userFilterCert === 'SEM_CERTIDAO' && hasDocs) return false;
        if (userFilterCert === 'COM_CERTIDAO_VALIDA' && !hasValid) return false;
        if (userFilterCert === 'COM_CERTIDAO_EXPIRADA' && (!hasDocs || hasValid)) return false;
      }

      return true;
    });
  }, [usersList, searchUserAdmin, userFilterRede, userFilterRole, userFilterCert, documents]);

  const total = documents.length;
  const aprovadas = documents.filter(d => d.statusValidacao === 'APROVADO').length;
  const divergentes = documents.filter(d => d.statusValidacao === 'DIVERGENTE').length;
  const expiradas = documents.filter(d => d.diasRestantesValidade < 0).length;

  const totalUsuarios = usersList.length;
  const totalDiaconos = usersList.filter(u => u.role === 'DIACONO').length;

  // Exportação CSV dos Documentos
  const handleExportCSV = () => {
    if (filteredDocs.length === 0) return;

    const headers = [
      'Nome Titular',
      'E-mail',
      'Rede',
      'Numero Certidao',
      'Orgao Emissor',
      'Data Expedicao',
      'Data Validade',
      'Dias Restantes',
      'Status Validacao',
      'Nome Extraido Doc',
      'Data Nasc Extraida',
      'Constata Antecedentes',
    ];

    const rows = filteredDocs.map(d => [
      `"${(d.userNome || d.nomeExtraido || '').replace(/"/g, '""')}"`,
      `"${(d.userEmail || '').replace(/"/g, '""')}"`,
      `"${d.userRede || ''}"`,
      `"${(d.numeroDocumento || '').replace(/"/g, '""')}"`,
      `"${(d.orgaoEmissor || '').replace(/"/g, '""')}"`,
      `"${d.dataEmissao || ''}"`,
      `"${d.dataValidade || ''}"`,
      d.diasRestantesValidade,
      `"${d.statusValidacao}"`,
      `"${(d.nomeExtraido || '').replace(/"/g, '""')}"`,
      `"${d.dataNascimentoExtraida || ''}"`,
      d.constataAntecedentes ? 'SIM' : 'NAO',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certidoes_diacono_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Feedback de sucesso na alteração de papel */}
      {roleUpdateSuccess && (
        <Card className="p-3.5 bg-emerald-50/80 border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{roleUpdateSuccess}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setRoleUpdateSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </Button>
        </Card>
      )}

      {/* Banner Principal com shadcn Card */}
      <Card className="p-5 sm:p-7 border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                Painel de Supervisão Diaconal
              </Badge>
              {isAdmin && (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                  <Crown className="w-3 h-3 text-amber-600" /> Administrador Geral
                </Badge>
              )}
            </div>

            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Supervisão de Certidões & Redes Regionais
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Visualização consolidada de todos os documentos inseridos pelos usuários em todas as redes regionais, com auditoria de validade de 90 dias e checagem de dados.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAllDocs();
                if (isAdmin) fetchAllUsers();
              }}
              disabled={isLoadingDocs || isLoadingUsers}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingDocs || isLoadingUsers) ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Resumo Estatístico Claro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-border/60">
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
            <span className="text-muted-foreground block text-xs font-medium">Total Registradas</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-0.5 block">{total}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Aprovadas
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{aprovadas}</span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50">
            <span className="text-rose-700 dark:text-rose-400 block text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Divergentes
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">{divergentes}</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50">
            <span className="text-amber-700 dark:text-amber-400 block text-xs font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Vencidas (&gt;90d)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">{expiradas}</span>
          </div>
        </div>
      </Card>

      {/* Seletor de Sub-abas (Disponível para todos os Diáconos e Admin) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-muted/60 rounded-2xl w-full sm:w-fit border border-border/50">
        <Button
          variant={activeSubTab === 'DOCUMENTS' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('DOCUMENTS')}
          className="text-xs sm:text-sm font-bold gap-2 h-10 sm:h-9 justify-center"
        >
          <FileText className="w-4 h-4 text-purple-600" />
          Certidões & Documentos ({filteredDocs.length})
        </Button>
        <Button
          variant={activeSubTab === 'USERS' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSubTab('USERS')}
          className="text-xs sm:text-sm font-bold gap-2 h-10 sm:h-9 justify-center"
        >
          <Users className="w-4 h-4 text-emerald-600" />
          Gestão de Usuários & Membros
          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold ml-1">
            {filteredUsers.length}
          </Badge>
        </Button>
      </div>

      {/* SUB-ABA 1: DOCUMENTOS & CERTIDÕES */}
      {activeSubTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          {/* Barra de Filtros Multifatoriais */}
          <Card className="p-4 sm:p-5 border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                Filtros Avançados de Documentos
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Exibindo <strong>{filteredDocs.length}</strong> de {total}
                </span>

                {/* Alternância de Visualização Table / Cards no Desktop */}
                <div className="hidden sm:flex items-center bg-muted/70 p-0.5 rounded-xl border border-border/60">
                  <Button
                    variant={viewMode === 'TABLE' || viewMode === 'AUTO' ? 'secondary' : 'ghost'}
                    size="icon-xs"
                    onClick={() => setViewMode('TABLE')}
                    title="Exibir como Tabela"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'CARDS' ? 'secondary' : 'ghost'}
                    size="icon-xs"
                    onClick={() => setViewMode('CARDS')}
                    title="Exibir como Cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. Busca por Usuário / Titular */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Buscar Usuário / Titular
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Nome, e-mail, certidão..."
                    value={searchDocUser}
                    onChange={e => setSearchDocUser(e.target.value)}
                    className="pl-9 h-11 sm:h-9 text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* 2. Filtro por Rede */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Filtrar por Rede
                </label>
                <select
                  value={selectedRede}
                  onChange={e => setSelectedRede(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-11 sm:h-9"
                >
                  <option value="TODAS">Todas as Redes</option>
                  {REDES_DISPONIVEIS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filtro por Mês */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Filtrar por Mês
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-background border border-input rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-11 sm:h-9"
                  >
                    <option value="TODOS">Todos os Meses</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Filtro por Validação Cruzada */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Validação dos Dados
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-11 sm:h-9"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="APROVADO">Aprovadas (Match 100%)</option>
                  <option value="DIVERGENTE">Divergentes (Nome/Nasc)</option>
                  <option value="COM_ANTECEDENTES">Com Antecedentes</option>
                </select>
              </div>

              {/* 5. Filtro por Validade de 90 dias */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Prazo de 90 Dias
                </label>
                <select
                  value={selectedValidity}
                  onChange={e => setSelectedValidity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-11 sm:h-9"
                >
                  <option value="TODOS">Todos os Prazos</option>
                  <option value="VALIDOS">Dentro da Validade</option>
                  <option value="VENCENDO">Vencendo em breve (≤ 15d)</option>
                  <option value="EXPIRADOS">Vencidas (&gt; 90d)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* LISTAGEM DE DOCUMENTOS */}
          {isLoadingDocs ? (
            <Card className="py-16 text-center border-border shadow-xs">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Carregando certidões de todas as redes...
              </p>
            </Card>
          ) : filteredDocs.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-border shadow-xs">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <CardTitle className="text-sm font-semibold text-foreground">Nenhum documento encontrado</CardTitle>
              <CardDescription className="text-xs mt-1">Tente ajustar os filtros acima.</CardDescription>
            </Card>
          ) : (
            <>
              {/* VISÃO EM CARDS: Excelente no Mobile */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
                  viewMode === 'TABLE' ? 'hidden' : viewMode === 'CARDS' ? 'block' : 'block md:hidden'
                }`}
              >
                {filteredDocs.map(doc => {
                  const redeMeta = REDES_DISPONIVEIS.find(r => r.id === doc.userRede);
                  const isExpired = doc.diasRestantesValidade < 0;
                  const isAprovado = doc.statusValidacao === 'APROVADO';

                  return (
                    <Card
                      key={doc.id}
                      className="p-4 sm:p-5 shadow-xs space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar size="default" className="border border-border">
                            {doc.userFotoUrl && <AvatarImage src={doc.userFotoUrl} alt={doc.userNome} />}
                            <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                              {(doc.userNome || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <p className="font-bold text-foreground text-sm truncate">
                              {doc.userNome || doc.nomeExtraido || 'Sem Nome'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{doc.userEmail || '-'}</p>
                          </div>
                        </div>

                        {redeMeta && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                          >
                            {redeMeta.label}
                          </span>
                        )}
                      </div>

                      <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Nº Certidão</span>
                          <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
                            {doc.numeroDocumento || '••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Expedição</span>
                          <span className="text-xs font-medium text-foreground">{doc.dataEmissao || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Validade (90d)</span>
                          <span className={`text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {doc.dataValidade} ({isExpired ? 'Vencida' : `${doc.diasRestantesValidade}d`})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2">
                        <Badge
                          variant={isAprovado ? 'default' : 'destructive'}
                          className={`text-xs font-bold py-1 px-2.5 ${
                            isAprovado
                              ? 'bg-emerald-600 text-white'
                              : doc.statusValidacao === 'DIVERGENTE'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isAprovado ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white mr-1" /> Aprovado (Match)
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-white mr-1" /> {doc.statusValidacao}
                            </>
                          )}
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingDoc(doc)}
                          className="text-xs font-semibold gap-1.5 h-9"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Certidão
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* VISÃO EM TABELA: shadcn Table */}
              <Card
                className={`overflow-hidden border-border shadow-xs ${
                  viewMode === 'CARDS' ? 'hidden' : viewMode === 'TABLE' ? 'block' : 'hidden md:block'
                }`}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Titular / Usuário</TableHead>
                      <TableHead className="font-bold">Rede</TableHead>
                      <TableHead className="font-bold">Certidão / Nº</TableHead>
                      <TableHead className="font-bold">Cruzamento de Dados</TableHead>
                      <TableHead className="font-bold">Expedição & 90 Dias</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map(doc => {
                      const redeMeta = REDES_DISPONIVEIS.find(r => r.id === doc.userRede);
                      const isExpired = doc.diasRestantesValidade < 0;
                      const isAprovado = doc.statusValidacao === 'APROVADO';

                      return (
                        <TableRow key={doc.id} className="hover:bg-muted/40 transition-colors">
                          {/* Titular */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm" className="border border-border">
                                {doc.userFotoUrl && <AvatarImage src={doc.userFotoUrl} alt={doc.userNome} />}
                                <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                                  {(doc.userNome || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-foreground text-xs">
                                  {doc.userNome || doc.nomeExtraido || 'Sem Nome'}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{doc.userEmail || '-'}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Rede */}
                          <TableCell>
                            {redeMeta ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                              >
                                {redeMeta.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </TableCell>

                          {/* Certidão / Número */}
                          <TableCell className="font-mono">
                            <span className="font-semibold text-foreground block">
                              {doc.numeroDocumento || '••••••••'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-sans">{doc.orgaoEmissor}</span>
                          </TableCell>

                          {/* Cruzamento de Dados */}
                          <TableCell>
                            <div className="space-y-0.5 text-[11px]">
                              <p className="text-muted-foreground">
                                Nome Doc: <strong className="text-foreground">{doc.nomeExtraido || '-'}</strong>
                              </p>
                              <p className="text-muted-foreground">
                                Nascimento: <strong className="text-foreground">{doc.dataNascimentoExtraida || '-'}</strong>
                              </p>
                            </div>
                          </TableCell>

                          {/* Expedição & Validade de 90 Dias */}
                          <TableCell>
                            <div>
                              <span className="text-muted-foreground block text-[11px]">
                                Expedida: <strong className="text-foreground">{doc.dataEmissao || '-'}</strong>
                              </span>
                              <span
                                className={`text-[11px] font-bold block ${
                                  isExpired ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {isExpired
                                  ? 'Expirada (>90 dias)'
                                  : `Válida até ${doc.dataValidade} (${doc.diasRestantesValidade}d)`}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant={isAprovado ? 'default' : 'destructive'}
                              className={`text-[10px] font-bold gap-1 ${
                                isAprovado
                                  ? 'bg-emerald-600 text-white'
                                  : doc.statusValidacao === 'DIVERGENTE'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-600 text-white'
                              }`}
                            >
                              {isAprovado ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-white" /> Aprovado (Match)
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-white" /> {doc.statusValidacao}
                                </>
                              )}
                            </Badge>
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDoc(doc)}
                              className="text-xs font-semibold gap-1 h-7"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SUB-ABA 2: GESTÃO DE USUÁRIOS E MEMBROS (Disponível para todos os Diáconos e Admin) */}
      {activeSubTab === 'USERS' && (
        <Card className="p-4 sm:p-6 border-border shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Gestão e Verificação de Usuários & Membros
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Visualize os dados cadastrais de cada membro, verifique a conformidade da Certidão de Antecedentes Criminais (validade de 90 dias) e edite informações quando necessário.
              </CardDescription>
              {!isAdmin && (
                <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Nota: Alteração de papéis (Diácono / Usuário) é restrita ao administrador geral (luan@secid.pr.gov.br).
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary" className="px-2.5 py-1 font-bold">
                Total: {filteredUsers.length} de {usersList.length}
              </Badge>
              <Badge variant="outline" className="px-2.5 py-1 font-bold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                {totalDiaconos} Diáconos
              </Badge>
              <Badge variant="outline" className="px-2.5 py-1 font-bold">
                {totalUsuarios - totalDiaconos} Usuários
              </Badge>
            </div>
          </div>

          {/* Barra de Filtros de Usuários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
            {/* Busca textual */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por nome, e-mail..."
                value={searchUserAdmin}
                onChange={e => setSearchUserAdmin(e.target.value)}
                className="pl-9 h-11 sm:h-10 text-xs sm:text-sm bg-background"
              />
            </div>

            {/* Filtro por Rede */}
            <div>
              <select
                aria-label="Filtrar por rede ministerial"
                value={userFilterRede}
                onChange={e => setUserFilterRede(e.target.value)}
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
                value={userFilterRole}
                onChange={e => setUserFilterRole(e.target.value)}
                className="w-full h-11 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="TODOS">Todos os Papéis</option>
                <option value="USUARIO">Apenas Usuários</option>
                <option value="DIACONO">Apenas Diáconos</option>
              </select>
            </div>

            {/* Filtro por Status da Certidão */}
            <div>
              <select
                aria-label="Filtrar por situação da certidão"
                value={userFilterCert}
                onChange={e => setUserFilterCert(e.target.value)}
                className="w-full h-11 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="TODOS">Status da Certidão: Todos</option>
                <option value="COM_CERTIDAO_VALIDA">✅ Com Certidão Válida (≤90d)</option>
                <option value="COM_CERTIDAO_EXPIRADA">⚠️ Com Certidão Vencida / Divergente</option>
                <option value="SEM_CERTIDAO">❌ Sem Certidão Cadastrada</option>
              </select>
            </div>
          </div>

          {/* Feedback de alteração de papel */}
          {roleUpdateSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {roleUpdateSuccess}
            </div>
          )}

          {/* Lista de Usuários */}
          {isLoadingUsers ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Carregando usuários cadastrados...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/80">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold text-foreground">Nenhum membro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros de busca, rede ou situação da certidão.
              </p>
            </div>
          ) : (
            <>
              {/* VISÃO EM CARDS PARA MOBILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 block md:hidden">
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
                          <Avatar size="default" className="border border-border">
                            {u.fotoUrl && <AvatarImage src={u.fotoUrl} alt={u.nome} />}
                            <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                              {(u.nome || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
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
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                          >
                            {redeMeta.label}
                          </span>
                        )}
                      </div>

                      {/* Informações detalhadas do Membro */}
                      <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Data Nascimento</span>
                          <span className="font-mono font-semibold text-foreground">
                            {u.dataNascimento || <span className="text-amber-500 font-sans">Não cadastrada</span>}
                          </span>
                        </div>
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
                          <span className="text-muted-foreground">Certidão (90 dias)</span>
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
                            Editar
                          </Button>

                          {userDocs.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchDocUser(u.nome || u.email);
                                setActiveSubTab('DOCUMENTS');
                              }}
                              className="w-full text-xs font-semibold gap-1.5 h-10"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Certidões ({userDocs.length})
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

                        {/* Ação de Alterar Papel (Admin apenas) */}
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

              {/* TABELA DE USUÁRIOS PARA DESKTOP */}
              <Card className="overflow-hidden border-border shadow-xs hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Membro / Usuário</TableHead>
                      <TableHead className="font-bold">Rede</TableHead>
                      <TableHead className="font-bold">Data Nascimento</TableHead>
                      <TableHead className="font-bold">Certidão (90 dias)</TableHead>
                      <TableHead className="font-bold">Papel Atual</TableHead>
                      <TableHead className="font-bold text-right">Ações Diácono</TableHead>
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
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm" className="border border-border">
                                {u.fotoUrl && <AvatarImage src={u.fotoUrl} alt={u.nome} />}
                                <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                                  {(u.nome || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
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
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {redeMeta ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                              >
                                {redeMeta.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>

                          <TableCell className="font-mono text-foreground text-xs">
                            {u.dataNascimento || <span className="text-amber-500 font-sans">Não cadastrada</span>}
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
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(u);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-xs font-semibold gap-1.5 h-8"
                                title="Editar dados cadastrais e foto deste membro"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-primary" />
                                Editar
                              </Button>

                              {userDocs.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSearchDocUser(u.nome || u.email);
                                    setActiveSubTab('DOCUMENTS');
                                  }}
                                  className="text-xs font-semibold gap-1 h-8 text-muted-foreground hover:text-foreground"
                                  title="Filtrar certidões deste usuário"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Certidões
                                </Button>
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
        </Card>
      )}

      {/* Modal de Detalhes da Certidão */}
      <DocumentViewModal
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onEdit={() => {}}
      />

      {/* Modal de Edição de Usuário pelo Diácono */}
      <UserEditByDiaconoModal
        userToEdit={editingUser}
        userDocuments={documents}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSaved={() => {
          fetchAllUsers();
          fetchAllDocs();
        }}
      />
    </div>
  );
};
