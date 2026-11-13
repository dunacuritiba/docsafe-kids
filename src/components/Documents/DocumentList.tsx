import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';
import type { DocumentRecord } from '../../types';
import { DocumentCard } from './DocumentCard';
import { DocumentFormModal } from './DocumentFormModal';
import { DocumentViewModal } from './DocumentViewModal';
import { useAuth } from '../../context/AuthContext';
import { getStoredDocuments, saveDocuments, addLgpdLog } from '../../utils/storage';
import { supabaseGetDocuments, supabaseDeleteDocument } from '../../services/supabase';
import { decryptData } from '../../utils/crypto';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const DocumentList: React.FC = () => {
  const { user, activeKey, updateBirthDate } = useAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'APROVADOS' | 'DIVERGENTES' | 'EXPIRADOS'>('TODOS');
  const [hideSensitive, setHideSensitive] = useState(true);

  // Estado para cadastro/atualização de Data de Nascimento se ausente
  const [birthDateInput, setBirthDateInput] = useState('');
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);
  const [birthDateSavedSuccess, setBirthDateSavedSuccess] = useState(false);

  const handleSaveBirthDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDateInput) return;
    setIsSavingBirthDate(true);
    const success = await updateBirthDate(birthDateInput);
    setIsSavingBirthDate(false);
    if (success) {
      setBirthDateSavedSuccess(true);
      setTimeout(() => setBirthDateSavedSuccess(false), 3000);
      loadDocuments();
    }
  };

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocumentRecord | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Carrega e decifra certidões do usuário
  const loadDocuments = async () => {
    if (!user || !activeKey) return;
    setIsLoading(true);

    try {
      let allDocs = await supabaseGetDocuments(user.id);

      if (allDocs.length === 0) {
        allDocs = getStoredDocuments().filter(d => d.userId === user.id);
      } else {
        saveDocuments(allDocs);
      }

      const decryptedDocs = await Promise.all(
        allDocs.map(async doc => {
          let decryptedNumero = doc.numeroDocumento;
          if (doc.encryptedNumeroDocumento) {
            decryptedNumero = await decryptData(doc.encryptedNumeroDocumento, activeKey);
          }

          let decryptedArquivo = doc.arquivoUrl;
          if (doc.encryptedArquivoUrl) {
            decryptedArquivo = await decryptData(doc.encryptedArquivoUrl, activeKey);
          }

          return {
            ...doc,
            numeroDocumento: decryptedNumero,
            arquivoUrl: decryptedArquivo,
          };
        })
      );

      setDocuments(decryptedDocs);
    } catch (err) {
      console.error('Erro ao decifrar certidões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user, activeKey]);

  // Exclusão com log LGPD e sincronização Supabase
  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    const targetDoc = documents.find(d => d.id === deleteId);

    await supabaseDeleteDocument(deleteId);

    const updated = getStoredDocuments().filter(d => d.id !== deleteId);
    saveDocuments(updated);

    addLgpdLog(
      user.id,
      'EXCLUSAO',
      `Certidão de Antecedentes nº '${targetDoc?.numeroDocumento || deleteId}' apagada do cofre seguro.`
    );

    setDeleteId(null);
    loadDocuments();
  };

  // Filtragem
  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.nomeExtraido && doc.nomeExtraido.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'APROVADOS') return doc.statusValidacao === 'APROVADO';
    if (statusFilter === 'DIVERGENTES') return doc.statusValidacao === 'DIVERGENTE';
    if (statusFilter === 'EXPIRADOS') return doc.diasRestantesValidade < 0;

    return true;
  });

  const totalAprovadas = documents.filter(d => d.statusValidacao === 'APROVADO').length;
  const totalExpiradas = documents.filter(d => d.diasRestantesValidade < 0).length;

  return (
    <div className="space-y-6">
      {/* Alerta se a Data de Nascimento ainda não estiver cadastrada */}
      {(!user?.dataNascimento || user.dataNascimento.trim() === '') && (
        <Card className="bg-amber-50/80 border-amber-300 text-amber-950 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-200/60 text-amber-800 rounded-xl mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Data de Nascimento necessária para validação
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Sua conta ainda não possui data de nascimento cadastrada. Preencha abaixo para salvar no seu cadastro e permitir a validação cruzada com a sua certidão:
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBirthDate} className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                required
                value={birthDateInput}
                onChange={e => setBirthDateInput(e.target.value)}
                className="bg-white border-amber-300 text-xs font-semibold text-slate-800 h-8"
              />
              <Button
                type="submit"
                disabled={isSavingBirthDate || !birthDateInput}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
              >
                {isSavingBirthDate ? (
                  'Salvando...'
                ) : birthDateSavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Salvo!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Salvar Data de Nascimento
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Banner Informativo sobre a Regra de 90 Dias e Validação com shadcn Card */}
      <Card className="p-4 sm:p-7 border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Validade Legal de 90 Dias • Polícia Federal (SINIC)
            </Badge>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              Certidões de Antecedentes Criminais
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              O sistema verifica automaticamente se o <strong>Nome</strong> e a <strong>Data de Nascimento</strong> contidos na certidão coincidem com o seu cadastro de usuário e monitora a expiração de 90 dias a partir da data de expedição do documento.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setDocumentToEdit(null);
                setIsFormOpen(true);
              }}
              size="lg"
              className="w-full sm:w-auto font-bold gap-2 shadow-xs cursor-pointer h-11 sm:h-10 text-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Certidão
            </Button>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-5 border-t border-border/60">
          <div className="p-2.5 sm:p-3 bg-muted/40 rounded-2xl border border-border/60 text-center sm:text-left">
            <span className="text-muted-foreground block text-xs font-medium truncate">Total</span>
            <span className="text-lg sm:text-2xl font-black text-foreground mt-0.5 block">{documents.length}</span>
          </div>

          <div className="p-2.5 sm:p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center sm:text-left dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-xs font-medium truncate">
              Aprovadas
            </span>
            <span className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{totalAprovadas}</span>
          </div>

          <div className="p-2.5 sm:p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-center sm:text-left dark:bg-rose-950/20 dark:border-rose-900/50">
            <span className="text-rose-700 dark:text-rose-400 block text-xs font-medium truncate">
              Vencidas
            </span>
            <span className="text-lg sm:text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">{totalExpiradas}</span>
          </div>
        </div>
      </Card>

      {/* Barra de Filtros e Busca */}
      <Card className="p-3 sm:p-4 border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Busca com shadcn Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por número da certidão ou nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-between">
          {/* Filtro de Status com overflow suave */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-medium border border-border/40 overflow-x-auto max-w-full">
            <Button
              variant={statusFilter === 'TODOS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('TODOS')}
              className="text-xs h-8 px-2.5 sm:px-3 font-semibold"
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === 'APROVADOS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('APROVADOS')}
              className={`text-xs h-8 px-2.5 sm:px-3 font-semibold ${statusFilter === 'APROVADOS' ? 'bg-emerald-600 text-white' : 'text-emerald-700'}`}
            >
              Aprovadas
            </Button>
            <Button
              variant={statusFilter === 'DIVERGENTES' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('DIVERGENTES')}
              className={`text-xs h-8 px-2.5 sm:px-3 font-semibold ${statusFilter === 'DIVERGENTES' ? 'bg-rose-600 text-white' : 'text-rose-700'}`}
            >
              Divergentes
            </Button>
            <Button
              variant={statusFilter === 'EXPIRADOS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('EXPIRADOS')}
              className={`text-xs h-8 px-2.5 sm:px-3 font-semibold ${statusFilter === 'EXPIRADOS' ? 'bg-amber-600 text-white' : 'text-amber-700'}`}
            >
              Expiradas
            </Button>
          </div>

          {/* Toggle de Privacidade */}
          <Button
            variant={hideSensitive ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setHideSensitive(!hideSensitive)}
            className={`text-xs font-semibold gap-1.5 h-10 sm:h-9 px-3 ${
              hideSensitive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : ''
            }`}
          >
            {hideSensitive ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> Ocultando
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Exibindo
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Grid de Certidões */}
      {isLoading ? (
        <Card className="py-20 text-center border-border shadow-xs">
          <div className="w-9 h-9 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-foreground">Decifrando dados e carregando certidões...</p>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed border-2 border-border shadow-none">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/60" />
          <CardTitle className="text-base text-foreground mb-1">Nenhuma certidão registrada</CardTitle>
          <CardDescription className="text-xs mb-4">
            Envie sua Certidão de Antecedentes Criminais (PDF ou Foto) para validar e monitorar os 90 dias de validade.
          </CardDescription>
          <Button
            onClick={() => {
              setDocumentToEdit(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeira Certidão
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={d => setSelectedDocument(d)}
              onEdit={d => {
                setDocumentToEdit(d);
                setIsFormOpen(true);
              }}
              onDelete={id => setDeleteId(id)}
              hideSensitive={hideSensitive}
            />
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <DocumentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setDocumentToEdit(null);
        }}
        onSaved={loadDocuments}
        documentToEdit={documentToEdit}
      />

      {/* Modal de Visualização */}
      <DocumentViewModal
        document={selectedDocument}
        targetUser={user}
        onClose={() => setSelectedDocument(null)}
        onEdit={doc => {
          setSelectedDocument(null);
          setDocumentToEdit(doc);
          setIsFormOpen(true);
        }}
      />

      {/* Confirmação de Exclusão com shadcn Card */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-sm w-full p-6 text-center border-border shadow-xl">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-base mb-1">Excluir Certidão?</CardTitle>
            <CardDescription className="text-xs mb-5">
              O arquivo criptografado e o registro de antecedentes serão apagados definitivamente do cofre seguro.
            </CardDescription>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex-1 font-semibold"
              >
                Sim, Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
