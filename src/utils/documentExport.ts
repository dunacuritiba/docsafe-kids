import type { DocumentRecord } from '../types';

/**
 * Converte dataUrl base64 em Blob para download universal sem restrições de tamanho
 */
function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = window.atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Erro ao converter dataUrl para Blob:', err);
    return new Blob([dataUrl], { type: 'application/pdf' });
  }
}

/**
 * Realiza o download do arquivo da certidão (PDF ou Imagem)
 */
export function downloadDocumentFile(doc: DocumentRecord) {
  const rawTitular = doc.userNome || doc.nomeExtraido || 'titular';
  const cleanTitular = rawTitular
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);

  const cleanNum = (doc.numeroDocumento || 'doc').replace(/[^a-zA-Z0-9]/g, '');

  if (!doc.arquivoUrl) {
    // Caso a certidão não tenha anexo gravado ainda, baixa o comprovante oficial de validação
    downloadValidationReceiptFile(doc, cleanTitular, cleanNum);
    return;
  }

  const extension = doc.arquivoUrl.startsWith('data:image/png')
    ? '.png'
    : doc.arquivoUrl.startsWith('data:image/jpeg') || doc.arquivoUrl.startsWith('data:image/jpg')
    ? '.jpg'
    : doc.nomeArquivo?.includes('.')
    ? '.' + doc.nomeArquivo.split('.').pop()
    : '.pdf';

  const filename =
    doc.nomeArquivo || `certidao_antecedentes_${cleanTitular}_${cleanNum}${extension}`;

  let blobUrl: string | null = null;
  let downloadUrl = doc.arquivoUrl;

  if (doc.arquivoUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(doc.arquivoUrl);
    blobUrl = URL.createObjectURL(blob);
    downloadUrl = blobUrl;
  }

  const link = window.document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);

  if (blobUrl) {
    setTimeout(() => URL.revokeObjectURL(blobUrl!), 30000);
  }
}

/**
 * Baixa folha de conferência oficial caso o arquivo original não esteja disponível
 */
function downloadValidationReceiptFile(doc: DocumentRecord, cleanTitular: string, cleanNum: string) {
  const titular = doc.userNome || doc.nomeExtraido || 'Membro Titular';
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Comprovante de Certidão - ${titular}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 32px; max-width: 700px; margin: 0 auto; line-height: 1.5; }
    .box { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; }
    h1 { font-size: 20px; margin-top: 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .field { margin: 10px 0; font-size: 14px; }
    .label { font-weight: bold; color: #475569; width: 180px; display: inline-block; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Comprovante de Conferência de Antecedentes Criminais</h1>
    <div class="field"><span class="label">Titular / Voluntário:</span> <strong>${titular}</strong></div>
    <div class="field"><span class="label">Órgão Emissor:</span> ${doc.orgaoEmissor || 'Polícia Federal - ePol/SINIC'}</div>
    <div class="field"><span class="label">Nº da Certidão:</span> ${doc.numeroDocumento || 'Conferido no ato do cadastro'}</div>
    <div class="field"><span class="label">Data de Expedição:</span> ${doc.dataEmissao || '-'}</div>
    <div class="field"><span class="label">Validade (90 dias):</span> ${doc.dataValidade || '-'} (${doc.diasRestantesValidade >= 0 ? `${doc.diasRestantesValidade} dias restantes` : 'Expirada'})</div>
    <div class="field"><span class="label">Status de Validação:</span> <span class="status">${doc.statusValidacao || 'APROVADO'}</span></div>
    <div class="field"><span class="label">Registro Criminal:</span> <strong>${doc.constataAntecedentes ? 'Consta Registros' : 'NADA CONSTA'}</strong></div>
    <div class="footer">
      DocSafe Kids • Sistema Diaconal de Conformidade e Proteção de Menores • Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = `comprovante_certidao_${cleanTitular}_${cleanNum}.html`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
}

/**
 * Abre a janela de impressão da certidão do usuário
 */
export function printDocument(doc: DocumentRecord) {
  if (!doc.arquivoUrl) {
    // Se não tiver arquivo binário anexado, imprime a ficha de validação da certidão
    printValidationReceipt(doc);
    return;
  }

  // Se for imagem
  if (doc.arquivoUrl.startsWith('data:image/')) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a certidão.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certidão - ${doc.userNome || doc.nomeExtraido || 'Documento'}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; }
            .header p { margin: 2px 0; font-size: 12px; color: #475569; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
            .content { text-align: center; }
            img { max-width: 100%; max-height: 80vh; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; }
            .footer { margin-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Certidão de Antecedentes Criminais</h1>
              <p><strong>Titular:</strong> ${doc.userNome || doc.nomeExtraido || '-'}</p>
              <p><strong>Nº Certidão:</strong> ${doc.numeroDocumento} | <strong>Expedição:</strong> ${doc.dataEmissao || '-'}</p>
              <p><strong>Validade (90 dias):</strong> ${doc.dataValidade || '-'} (${doc.diasRestantesValidade >= 0 ? `${doc.diasRestantesValidade} dias restantes` : 'Expirada'})</p>
            </div>
            <div style="text-align: right;">
              <span class="badge">${doc.statusValidacao === 'APROVADO' ? '✓ Aprovada (Match)' : doc.statusValidacao}</span>
              <p style="margin-top: 6px; font-size: 11px; color: #059669; font-weight: bold;">${doc.constataAntecedentes ? 'Consta Registros' : 'NADA CONSTA'}</p>
            </div>
          </div>
          <div class="content">
            <img src="${doc.arquivoUrl}" alt="Certidão de Antecedentes" onload="window.print();" />
          </div>
          <div class="footer">
            DocSafe Kids • Sistema de Supervisão Diaconal e Conformidade LGPD • Impresso em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    return;
  }

  // Se for PDF (data:application/pdf ou URL)
  // Cria iframe invisível ou abre janela dedicada para acionar window.print()
  const iframe = window.document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = doc.arquivoUrl;

  window.document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          window.document.body.removeChild(iframe);
        }, 3000);
      }, 300);
    } catch {
      // Se iframe for restrito por sandbox de browser, abre em nova janela
      window.open(doc.arquivoUrl, '_blank');
      window.document.body.removeChild(iframe);
    }
  };
}

/**
 * Imprime folha oficial de conferência cadastral quando o anexo for texto ou ausente
 */
export function printValidationReceipt(doc: DocumentRecord) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ficha de Certidão - ${doc.userNome || doc.nomeExtraido}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 20px; line-height: 1.5; }
          .header { text-align: center; border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
          .header p { margin: 5px 0 0 0; font-size: 13px; color: #64748b; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .item { font-size: 13px; }
          .item strong { color: #0f172a; display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
          .status-box { padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
          .approved { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DocSafe Kids • Ficha de Antecedentes Criminais</h1>
          <p>Validação Legal de 90 Dias • Supervisão Diaconal e Proteção LGPD</p>
        </div>

        <div class="status-box approved">
          STATUS: ${doc.statusValidacao} • ${doc.constataAntecedentes ? 'Consta Registros' : 'NADA CONSTA ANTECEDENTES'}
        </div>

        <div class="card">
          <h3 style="margin-top:0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Dados do Titular</h3>
          <div class="grid">
            <div class="item"><strong>Nome do Membro:</strong> ${doc.userNome || doc.nomeExtraido || '-'}</div>
            <div class="item"><strong>E-mail:</strong> ${doc.userEmail || '-'}</div>
            <div class="item"><strong>Rede Ministerial:</strong> ${doc.userRede || '-'}</div>
            <div class="item"><strong>Nascimento Extraído:</strong> ${doc.dataNascimentoExtraida || '-'}</div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-top:0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Dados da Certidão Oficial</h3>
          <div class="grid">
            <div class="item"><strong>Nº da Certidão:</strong> ${doc.numeroDocumento}</div>
            <div class="item"><strong>Órgão Emissor:</strong> ${doc.orgaoEmissor || 'Polícia Federal'}</div>
            <div class="item"><strong>Data de Expedição:</strong> ${doc.dataEmissao || '-'}</div>
            <div class="item"><strong>Validade Máxima (90 dias):</strong> ${doc.dataValidade || '-'}</div>
            <div class="item"><strong>Situação do Prazo:</strong> ${doc.diasRestantesValidade >= 0 ? `Válida (${doc.diasRestantesValidade} dias restantes)` : `Expirada há ${Math.abs(doc.diasRestantesValidade)} dias`}</div>
            <div class="item"><strong>Nome no Documento:</strong> ${doc.nomeExtraido || '-'}</div>
          </div>
        </div>

        <div class="footer">
          Registro auditado eletronicamente em conformidade com a Lei 13.709/2018 (LGPD).<br/>
          Impresso em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </div>

        <script>
          window.print();
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
