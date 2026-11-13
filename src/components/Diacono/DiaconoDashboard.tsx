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
} from 'lucide-react';
import type { DocumentRecord, User, UserRole } from '../../types';
import { REDES_DISPONIVEIS, isUserAdmin } from '../../types';
import { supabaseGetAllDocumentsForDiacono, supabaseGetAllUsers } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
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

export const DiaconoDashboard: React.FC = () => {
  const { user: currentUser, changeUserRole } = useAuth();
  const isAdmin = isUserAdmin(currentUser?.email);

  // Abas do Painel: Documentos vs Gestão de Usuários (se Admin)
  const [activeSubTab, setActiveSubTab] = useState<'DOCUMENTS' | 'USERS'>('DOCUMENTS');

  // Modo de visualização para os documentos: Tabela ou Cards
  const [viewMode, setViewMode] = useState<'AUTO' | 'TABLE' | 'CARDS'>('AUTO');

  // Documentos
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Usuários (Gestão do Administrador)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUserAdmin, setSearchUserAdmin] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);

  // Filtros de Documentos
  const [searchDocUser, setSearchDocUser] = useState('');
  const [selectedRede, setSelectedRede] = useState<string>('TODAS');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedValidity, setSelectedValidity] = useState<string>('TODOS');

  // Modal de Visualização
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

  // Carrega lista de usuários (para Admin)
  const fetchAllUsers = async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const users = await supabaseGetAllUsers();
      setUsersList(users);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAllDocs();
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

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

  // Filtragem de Usuários no painel de administração
  const filteredUsers = useMemo(() => {
    if (!searchUserAdmin.trim()) return usersList;
    const term = searchUserAdmin.toLowerCase();
    return usersList.filter(
      u =>
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.rede && u.rede.toLowerCase().includes(term))
    );
  }, [usersList, searchUserAdmin]);

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60 text-xs">
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
            <span className="text-muted-foreground block text-[11px] font-medium">Total Registradas</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-0.5 block">{total}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Aprovadas (Match)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{aprovadas}</span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50">
            <span className="text-rose-700 dark:text-rose-400 block text-[11px] font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Divergentes
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">{divergentes}</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50">
            <span className="text-amber-700 dark:text-amber-400 block text-[11px] font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Vencidas (&gt;90d)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">{expiradas}</span>
          </div>
        </div>
      </Card>

      {/* SE FOR ADMIN (luan@secid.pr.gov.br): Seletor de Sub-abas */}
      {isAdmin && (
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl w-fit border border-border/50">
          <Button
            variant={activeSubTab === 'DOCUMENTS' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSubTab('DOCUMENTS')}
            className="text-xs font-bold gap-2"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            Documentos & Certidões ({filteredDocs.length})
          </Button>
          <Button
            variant={activeSubTab === 'USERS' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSubTab('USERS')}
            className="text-xs font-bold gap-2"
          >
            <Users className="w-4 h-4 text-amber-600" />
            Gestão de Papéis de Usuários (Admin)
            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 font-bold ml-1">
              {totalUsuarios}
            </Badge>
          </Button>
        </div>
      )}

      {/* SUB-ABA 1: DOCUMENTOS & CERTIDÕES */}
      {activeSubTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          {/* Barra de Filtros Multifatoriais */}
          <Card className="p-4 sm:p-5 border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                Filtros Avançados de Documentos
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
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
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Buscar Usuário / Titular
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Nome, e-mail, certidão..."
                    value={searchDocUser}
                    onChange={e => setSearchDocUser(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
              </div>

              {/* 2. Filtro por Rede */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Filtrar por Rede
                </label>
                <select
                  value={selectedRede}
                  onChange={e => setSelectedRede(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-8"
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
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Filtrar por Mês
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-8"
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
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Validação dos Dados
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-8"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="APROVADO">Aprovadas (Match 100%)</option>
                  <option value="DIVERGENTE">Divergentes (Nome/Nasc)</option>
                  <option value="COM_ANTECEDENTES">Com Antecedentes</option>
                </select>
              </div>

              {/* 5. Filtro por Validade de 90 dias */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Prazo de 90 Dias
                </label>
                <select
                  value={selectedValidity}
                  onChange={e => setSelectedValidity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer h-8"
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
                      className="p-4 shadow-xs space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Avatar size="sm" className="border border-border">
                            {doc.userFotoUrl && <AvatarImage src={doc.userFotoUrl} alt={doc.userNome} />}
                            <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                              {(doc.userNome || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <p className="font-bold text-foreground text-xs truncate">
                              {doc.userNome || doc.nomeExtraido || 'Sem Nome'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{doc.userEmail || '-'}</p>
                          </div>
                        </div>

                        {redeMeta && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                          >
                            {redeMeta.label}
                          </span>
                        )}
                      </div>

                      <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-muted-foreground">Nº Certidão</span>
                          <span className="font-mono font-bold text-foreground text-[11px]">
                            {doc.numeroDocumento || '••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Expedição</span>
                          <span className="text-[11px] font-medium text-foreground">{doc.dataEmissao || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Validade (90d)</span>
                          <span className={`text-[11px] font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {doc.dataValidade} ({isExpired ? 'Vencida' : `${doc.diasRestantesValidade}d`})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Badge
                          variant={isAprovado ? 'default' : 'destructive'}
                          className={`text-[10px] font-bold ${
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

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingDoc(doc)}
                          className="text-xs font-semibold gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* SUB-ABA 2: GESTÃO DE USUÁRIOS E PAPÉIS (EXCLUSIVO PARA luan@secid.pr.gov.br) */}
      {isAdmin && activeSubTab === 'USERS' && (
        <Card className="p-5 sm:p-6 border-border shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Painel Administrativo: Gestão de Papéis
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Apenas o administrador <strong className="text-foreground">luan@secid.pr.gov.br</strong> possui permissão para alternar o papel dos membros entre <strong>USUÁRIO</strong> e <strong>DIÁCONO</strong>.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="px-3 py-1 font-bold">
                {totalDiaconos} Diáconos
              </Badge>
              <Badge variant="outline" className="px-3 py-1 font-bold">
                {totalUsuarios - totalDiaconos} Usuários Comuns
              </Badge>
            </div>
          </div>

          {/* Campo de Busca de Usuário */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar usuário por nome, e-mail ou rede..."
                value={searchUserAdmin}
                onChange={e => setSearchUserAdmin(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Tabela de Usuários com shadcn Table */}
          {isLoadingUsers ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-semibold text-muted-foreground">Carregando usuários cadastrados...</p>
            </div>
          ) : (
            <Card className="overflow-hidden border-border shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Membro / Usuário</TableHead>
                    <TableHead className="font-bold">Rede</TableHead>
                    <TableHead className="font-bold">Data Nascimento</TableHead>
                    <TableHead className="font-bold">Papel Atual</TableHead>
                    <TableHead className="font-bold text-right">Alterar Papel (Admin)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => {
                    const redeMeta = REDES_DISPONIVEIS.find(r => r.id === u.rede);
                    const isSelfAdmin = isUserAdmin(u.email);
                    const isUpdating = updatingUserId === u.id;

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
                                <span className="font-bold text-foreground">{u.nome}</span>
                                {isSelfAdmin && (
                                  <Badge variant="outline" className="text-[9px] font-bold bg-amber-50 text-amber-800 border-amber-300 py-0 px-1.5">
                                    Admin Principal
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground block">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {redeMeta ? (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${redeMeta.bg} ${redeMeta.color} ${redeMeta.border}`}
                            >
                              {redeMeta.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-foreground">
                          {u.dataNascimento || <span className="text-amber-500 font-sans">Não cadastrada</span>}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={u.role === 'DIACONO' ? 'secondary' : 'outline'}
                            className="text-[10px] font-bold gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            {u.role === 'DIACONO' ? 'DIÁCONO' : 'USUÁRIO'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant={u.role === 'DIACONO' ? 'outline' : 'default'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleToggleUserRole(u)}
                            className={`text-xs font-semibold gap-1.5 h-8 ${
                              u.role === 'DIACONO'
                                ? ''
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                            title={
                              u.role === 'DIACONO'
                                ? 'Rebaixar para Usuário Comum'
                                : 'Promover este membro para Diácono'
                            }
                          >
                            <ArrowRightLeft className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                            {isUpdating
                              ? 'Salvando...'
                              : u.role === 'DIACONO'
                              ? 'Tornar Usuário'
                              : 'Promover a Diácono'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </Card>
      )}

      {/* Modal de Detalhes da Certidão */}
      <DocumentViewModal
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onEdit={() => {}}
      />
    </div>
  );
};
