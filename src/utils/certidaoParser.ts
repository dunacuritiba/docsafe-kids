import type { User, CertidaoParseResult, StatusValidacaoCertidao } from '../types';

// Normaliza texto removendo acentos e espaços extras
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Normaliza formato de data para DD/MM/AAAA
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();

  // Se já for DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // Se for AAAA-MM-DD (input date padrão HTML)
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
  }

  return clean;
}

// Converte DD/MM/AAAA para objeto Date
export function parseDateBR(dateStr: string): Date | null {
  const norm = normalizeDate(dateStr);
  const match = norm.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

// Calcula data de validade de 90 dias a partir da data de expedição
export function calculateValidade90Dias(dataExpedicaoStr: string): {
  dataValidadeStr: string;
  diasRestantes: number;
  isExpirada: boolean;
} {
  const expedicaoDate = parseDateBR(dataExpedicaoStr);
  if (!expedicaoDate) {
    return { dataValidadeStr: '', diasRestantes: 0, isExpirada: false };
  }

  // Adiciona exatamente 90 dias
  const validadeDate = new Date(expedicaoDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  const day = String(validadeDate.getDate()).padStart(2, '0');
  const month = String(validadeDate.getMonth() + 1).padStart(2, '0');
  const year = validadeDate.getFullYear();
  const dataValidadeStr = `${day}/${month}/${year}`;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffTime = validadeDate.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpirada = diasRestantes < 0;

  return { dataValidadeStr, diasRestantes, isExpirada };
}

// Analisador do texto da Certidão de Antecedentes Criminais (Polícia Federal / Estadual)
export function parseCertidaoText(rawText: string, user?: User | null): CertidaoParseResult {
  const text = rawText.replace(/\r?\n/g, ' ');

  // 1. Extração do Número da Certidão
  // Exemplos: "N° 216367922026", "Nº 216367922026", "número da certidão 216367922026"
  let numeroCertidao = '';
  const numMatch =
    text.match(/N[º°o]?\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/número da certidão\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/certid[ãa]o\s+n[º°o]?\s*[:.]?\s*(\d{6,16})/i);
  if (numMatch) {
    numeroCertidao = numMatch[1];
  }

  // 2. Extração do Nome
  // Exemplo: "em nome de LUAN ALVES DA SILVA, país de nacionalidade"
  let nome = '';
  const nomeMatch =
    text.match(/em nome de\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+?)(?:,\s*pa[íi]s|,\s*nacionalidade|,\s*filho|\s*filho|\s*nascido|,\s*nascido|,\s*natural)/i) ||
    text.match(/nome\s*:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+?)(?:,|\s*filho|\s*cpf|\s*data)/i);
  if (nomeMatch) {
    nome = nomeMatch[1].replace(/\s+/g, ' ').trim();
  }

  // 3. Extração da Data de Nascimento
  // Exemplo: "nascido(a) aos 15/06/1992" ou "nascido em 15/06/1992"
  let dataNascimento = '';
  const nascMatch =
    text.match(/nascid[oa](?:\([ao]\))?\s+(?:aos|em)?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/data de nascimento\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/nascimento\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (nascMatch) {
    dataNascimento = nascMatch[1];
  }

  // 4. Extração do CPF
  // Exemplo: "CPF 082.830.099-23"
  let cpf = '';
  const cpfMatch = text.match(/CPF\s*[:.]?\s*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i);
  if (cpfMatch) {
    cpf = cpfMatch[1];
  }

  // 5. Extração da Data de Expedição
  // Exemplo: "Esta certidão foi expedida em 13/11/2026 às 00:19"
  let dataExpedicao = '';
  const expedMatch =
    text.match(/expedida\s+em\s+(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/emitid[ao]\s+em\s+(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/data de expedi[çc][ãa]o\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/expedi[çc][ãa]o\s*[:.]?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (expedMatch) {
    dataExpedicao = expedMatch[1];
  } else {
    // Se não encontrou explicitamente, tenta primeira data válida que não seja nascimento
    const allDates = Array.from(text.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)).map(m => m[1]);
    const otherDates = allDates.filter(d => d !== dataNascimento);
    if (otherDates.length > 0) {
      dataExpedicao = otherDates[0];
    }
  }

  // 6. Constatação de Antecedentes Criminais
  // "NÃO CONSTA condenação com trânsito em julgado"
  const hasNaoConsta = /N[ÃA]O\s+CONSTA/i.test(text);
  const constataAntecedentes = !hasNaoConsta && /CONSTA\s+condena[çc][ãa]o/i.test(text);

  // 7. Cálculo da Validade de 90 Dias
  const { dataValidadeStr, diasRestantes, isExpirada } = calculateValidade90Dias(dataExpedicao);

  // 8. Verificação cruzada com os dados do usuário cadastrado
  const divergencias: string[] = [];

  if (user) {
    // A) Verificação do Nome
    if (nome) {
      const nomeDoc = normalizeString(nome);
      const nomeUser = normalizeString(user.nome);

      const isExactMatch = nomeDoc === nomeUser;
      const docWords = nomeDoc.split(' ');
      const userWords = nomeUser.split(' ');
      const hasFirstAndLastName =
        docWords[0] === userWords[0] &&
        docWords[docWords.length - 1] === userWords[userWords.length - 1];

      if (!isExactMatch && !hasFirstAndLastName) {
        divergencias.push(
          `Nome no documento ("${nome}") diverge do nome cadastrado ("${user.nome}").`
        );
      }
    } else {
      divergencias.push('Não foi possível identificar o nome do titular no documento.');
    }

    // B) Verificação da Data de Nascimento
    if (dataNascimento) {
      const birthDoc = normalizeDate(dataNascimento);
      const birthUser = normalizeDate(user.dataNascimento);

      if (birthUser && birthDoc !== birthUser) {
        divergencias.push(
          `Data de nascimento no documento (${birthDoc}) não confere com a data cadastrada (${birthUser}).`
        );
      }
    } else if (user.dataNascimento) {
      divergencias.push('Data de nascimento não identificada no texto da certidão.');
    }

    // C) Verificação do CPF (se constar no documento)
    if (cpf && user.cpf) {
      const cleanDocCpf = cpf.replace(/\D/g, '');
      const cleanUserCpf = user.cpf.replace(/\D/g, '');
      if (cleanDocCpf !== cleanUserCpf) {
        divergencias.push(
          `CPF no documento (${cpf}) diverge do CPF cadastrado (${user.cpf}).`
        );
      }
    }
  }

  // Verificação da validade de 90 dias
  if (isExpirada) {
    divergencias.push(
      `Certidão expirada! Expedida em ${dataExpedicao}, ultrapassou o limite legal de 90 dias.`
    );
  }

  // Verificação de condenação
  if (constataAntecedentes) {
    divergencias.push('O documento aponta apontamento/condenação penal existente.');
  }

  // Determinação do status final
  let statusValidacao: StatusValidacaoCertidao = 'APROVADO';
  if (constataAntecedentes) {
    statusValidacao = 'COM_ANTECEDENTES';
  } else if (isExpirada) {
    statusValidacao = 'EXPIRADO';
  } else if (divergencias.length > 0) {
    statusValidacao = 'DIVERGENTE';
  }

  return {
    numeroCertidao,
    nome,
    dataNascimento,
    cpf,
    dataExpedicao,
    dataValidade: dataValidadeStr,
    diasRestantes,
    isExpirada,
    constataAntecedentes,
    statusValidacao,
    divergencias,
    rawText,
  };
}

// Extração de texto de PDF no navegador usando pdfjs-dist
export async function extractTextFromPdf(dataUrlOrBuffer: string | ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Configura o worker se necessário
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }

    let loadingTask;
    if (typeof dataUrlOrBuffer === 'string') {
      loadingTask = pdfjs.getDocument({ url: dataUrlOrBuffer });
    } else {
      loadingTask = pdfjs.getDocument({ data: dataUrlOrBuffer });
    }

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (err) {
    console.warn('Falha na extração direta do PDF:', err);
    throw err;
  }
}

// Extração de texto de imagem usando Tesseract OCR
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('por'); // Português
    const ret = await worker.recognize(imageUrl);
    await worker.terminate();
    return ret.data.text;
  } catch (err) {
    console.warn('Falha no OCR Tesseract:', err);
    throw err;
  }
}
