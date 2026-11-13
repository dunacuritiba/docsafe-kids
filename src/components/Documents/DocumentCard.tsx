import React from 'react';
import {
  FileText,
  Calendar,
  Lock,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Building,
  UserCheck,
  Download,
  Printer,
} from 'lucide-react';
import type { DocumentRecord } from '../../types';
import { downloadDocumentFile, printDocument } from '../../utils/documentExport';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  document: DocumentRecord;
  onView: (doc: DocumentRecord) => void;
  onEdit: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
  hideSensitive: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onEdit,
  onDelete,
  hideSensitive,
}) => {
  const isExpired = document.diasRestantesValidade < 0;
  const isExpiringSoon = !isExpired && document.diasRestantesValidade <= 15;
  const isAprovado = document.statusValidacao === 'APROVADO';

  const displayNumero =
    hideSensitive && document.isSensivel
      ? `${document.numeroDocumento.slice(0, 4)}••••••${document.numeroDocumento.slice(-3)}`
      : document.numeroDocumento;

  return (
    <Card className="hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group py-0 gap-0">
      {/* Top Banner / Preview */}
      <div className="relative h-40 bg-muted/50 flex items-center justify-center overflow-hidden border-b border-border/80">
        {document.arquivoUrl && document.arquivoUrl.startsWith('data:image') ? (
          <img
            src={document.arquivoUrl}
            alt={document.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <div className="p-2.5 bg-background rounded-2xl shadow-xs mb-2 text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Certidão de Antecedentes Criminais
            </span>
            <span className="text-xs text-muted-foreground">PDF / Documento Anexado</span>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <Badge
            variant={isAprovado ? 'default' : 'destructive'}
            className={`text-xs font-bold shadow-xs flex items-center gap-1.5 py-0.5 px-2.5 ${
              isAprovado
                ? 'bg-emerald-600 text-white'
                : document.statusValidacao === 'DIVERGENTE'
                ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {isAprovado ? (
              <>
                <UserCheck className="w-3.5 h-3.5" /> Titular Confirmado
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> {document.statusValidacao}
              </>
            )}
          </Badge>

          <span
            className="p-1.5 rounded-full bg-background/90 text-emerald-600 shadow-xs border border-border"
            title="Protegido com Criptografia LGPD"
          >
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        {/* Alerta de Validade de 90 dias */}
        <div
          className={`absolute bottom-2.5 left-2.5 px-2.5 py-1 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs ${
            isExpired
              ? 'bg-rose-600/90'
              : isExpiringSoon
              ? 'bg-amber-600/90'
              : 'bg-slate-900/85 backdrop-blur-xs'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isExpired
            ? 'Certidão Vencida (> 90 dias)'
            : `Validade: ${document.diasRestantesValidade} dias restantes`}
        </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {document.titulo}
          </h4>

          {/* Número da certidão */}
          <div className="mt-2.5 p-2.5 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-foreground">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold">{displayNumero}</span>
            </div>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              Protegido
            </Badge>
          </div>

          {/* Dados Cruzados */}
          <div className="mt-3.5 space-y-2 text-xs text-muted-foreground">
            {document.nomeExtraido && (
              <p className="flex items-center justify-between">
                <span>Nome Certidão:</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {document.nomeExtraido}
                </span>
              </p>
            )}

            {document.dataNascimentoExtraida && (
              <p className="flex items-center justify-between">
                <span>Nascimento:</span>
                <span className="font-semibold text-foreground">
                  {document.dataNascimentoExtraida}
                </span>
              </p>
            )}

            <p className="flex items-center justify-between pt-1.5 border-t border-border/50">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" /> Expedição:
              </span>
              <span className="font-medium text-foreground">{document.dataEmissao}</span>
            </p>

            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Vence em:
              </span>
              <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                {document.dataValidade}
              </span>
            </p>
          </div>
        </div>

        {/* Footer com botões shadcn */}
        <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(document)}
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <Eye className="w-4 h-4" />
              Visualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDocumentFile(document)}
              className="text-xs font-semibold gap-1.5 h-9 text-primary hover:text-primary"
              title="Baixar arquivo da certidão"
            >
              <Download className="w-4 h-4" />
              Baixar
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => printDocument(document)}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
              title="Imprimir certidão"
            >
              <Printer className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(document)}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
              title="Editar informações"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(document.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
              title="Excluir certidão"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
