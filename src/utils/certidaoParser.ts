import type { User, CertidaoParseResult, StatusValidacaoCertidao } from '../types';

// Dicionário de meses em português para conversão de datas por extenso
const MESES_BR: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  'março': '03',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};

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
  let clean = dateStr.trim();

  // Substitui pontos e traços por barras (ex: 15.06.1992 ou 15-06-1992)
  if (/^\d{2}[\.\-]\d{2}[\.\-]\d{4}$/.test(clean)) {
    clean = clean.replace(/[\.\-]/g, '/');
  }

  // Se já for DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // Se for 8 dígitos contínuos (ex: 13112026 digitado ou lido pelo OCR)
  if (/^\d{8}$/.test(clean)) {
    const d = clean.substring(0, 2);
    const m = clean.substring(2, 4);
    const y = clean.substring(4, 8);
    const dNum = parseInt(d, 10);
    const mNum = parseInt(m, 10);
    if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
      return `${d}/${m}/${y}`;
    }
  }

  // Se for AAAA-MM-DD (input date padrão HTML)
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
  }

  // Data por extenso (ex: 13 de novembro de 2026)
  const extensoMatch = clean.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
  if (extensoMatch) {
    const day = extensoMatch[1].padStart(2, '0');
    const month = MESES_BR[extensoMatch[2].toLowerCase()];
    const year = extensoMatch[3];
    if (month) {
      return `${day}/${month}/${year}`;
    }
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

// Analisador do texto da Certidão de Antecedentes Criminais (Polícia Federal / Estadual / Prints)
export function parseCertidaoText(rawText: string, user?: User | null): CertidaoParseResult {
  // Pré-higienização do texto para simplificar regex em printscreens e OCR
  const text = rawText
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Extração do Número da Certidão
  // Suporta variações comuns de OCR (ex: Nº, N°, N2, NO, N? ou no rodapé "digitando o número da certidão...")
  let numeroCertidao = '';
  const numMatch =
    text.match(/digitando o n[úu]mero da certid[ãa]o\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/n[úu]mero da certid[ãa]o\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/N[º°o02\*\.]?\s*[:.]?\s*(\d{8,16})/i) ||
    text.match(/certid[ãa]o\s*(?:n[º°o02\*\.]?)?\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/CAC\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/protocolo\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/registro\s*[:.]?\s*(\d{6,16})/i) ||
    text.match(/\b(21\d{8}20\d{2})\b/); // Padrão Federal (começa com 21 e termina com ano 20XX)

  if (numMatch) {
    numeroCertidao = numMatch[1];
  }

  // 2. Extração do Nome
  // Padrão Federal: "em nome de LUAN ALVES DA SILVA, país de nacionalidade"
  // Padrão Estadual: "Nome: LUAN ALVES DA SILVA"
  let nome = '';
  const nomeMatch =
    text.match(/em nome de\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+?)(?:,\s*pa[íi]s|,\s*nacionalidade|,\s*filho|\s*filho|\s*nascido|,\s*nascido|,\s*natural|,\s*ci\b|,\s*rg\b|,\s*cpf\b)/i) ||
    text.match(/\b(?:nome|titular|interessad[oa]|requerente)\s*[:.]?\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]{3,60}?)(?:,|\n|\r|\s*filho|\s*cpf|\s*rg|\s*ci\b|\s*data|\s*nascido|\s*natural)/i);

  if (nomeMatch) {
    nome = nomeMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Se o regex não pegou mas temos o usuário no contexto, verificamos se o nome do usuário está no texto do OCR
  if (!nome && user && user.nome) {
    const userNorm = normalizeString(user.nome);
    const textNorm = normalizeString(text);
    if (textNorm.includes(userNorm)) {
      nome = user.nome;
    } else {
      // Se primeiro e último nome constarem
      const words = userNorm.split(' ').filter(w => w.length > 2);
      if (words.length >= 2 && textNorm.includes(words[0]) && textNorm.includes(words[words.length - 1])) {
        nome = user.nome;
      }
    }
  }

  // 3. Extração da Data de Nascimento
  let dataNascimento = '';
  const nascMatch =
    text.match(/nascid[oa](?:\([ao]\))?\s+(?:aos|em)?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i) ||
    text.match(/(?:data\s+de\s+)?nascimento\s*[:.]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i) ||
    text.match(/\bnasc\.?\s*[:.]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i) ||
    text.match(/\bd\.?n\.?\s*[:.]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i);

  if (nascMatch) {
    dataNascimento = normalizeDate(nascMatch[1]);
  } else if (user && user.dataNascimento) {
    // Verifica se a data de nascimento do usuário cadastrado está no texto
    const userBirthNorm = normalizeDate(user.dataNascimento);
    if (userBirthNorm && text.includes(userBirthNorm)) {
      dataNascimento = userBirthNorm;
    }
  }

  // 4. Extração do CPF
  let cpf = '';
  const cpfMatch =
    text.match(/CPF\s*[:.]?\s*(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})/i) ||
    text.match(/\b(\d{3}\.\d{3}\.\d{3}-\d{2})\b/);

  if (cpfMatch) {
    // Normaliza máscara do CPF
    const digits = cpfMatch[1].replace(/\D/g, '');
    if (digits.length === 11) {
      cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
  } else if (user && user.cpf) {
    const cleanUserCpf = user.cpf.replace(/\D/g, '');
    const cleanText = text.replace(/\D/g, '');
    if (cleanUserCpf.length === 11 && cleanText.includes(cleanUserCpf)) {
      cpf = user.cpf;
    }
  }

  // 5. Extração da Data de Expedição
  let dataExpedicao = '';
  const expedMatch =
    text.match(/expedida\s+(?:em|aos)\s+(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i) ||
    text.match(/emitid[ao]\s+(?:em|aos)\s+(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i) ||
    text.match(/data\s+(?:de\s+)?(?:expedi[çc][ãa]o|emiss[ãa]o)\s*[:.]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/i);

  if (expedMatch) {
    dataExpedicao = normalizeDate(expedMatch[1]);
  } else {
    // Tenta data por extenso (ex: Curitiba, 13 de novembro de 2026)
    const extensoMatch = text.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[çc]o|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
    if (extensoMatch) {
      dataExpedicao = normalizeDate(extensoMatch[0]);
    } else {
      // Se não encontrou explicitamente, procura por todas as datas e pega a primeira que não seja a de nascimento
      const allDates = Array.from(text.matchAll(/\b(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\b/g))
        .map(m => normalizeDate(m[1]));
      const otherDates = allDates.filter(d => d !== dataNascimento);
      if (otherDates.length > 0) {
        dataExpedicao = otherDates[0];
      }
    }
  }

  // 6. Constatação de Antecedentes Criminais
  const hasNaoConsta =
    /N[ÃA]O\s+CONSTA/i.test(text) ||
    /NADA\s+CONSTA/i.test(text) ||
    /SEM\s+REGISTRO/i.test(text) ||
    /N[ÃA]O\s+H[ÁA]\s+REGISTRO/i.test(text) ||
    /CERTID[ÃA]O\s+NEGATIVA/i.test(text) ||
    /INEXIST[ÊE]NCIA\s+DE\s+REGISTRO/i.test(text);

  const constataAntecedentes = !hasNaoConsta && (
    /CONSTA\s+condena[çc][ãa]o/i.test(text) ||
    /CONSTA\s+registro/i.test(text) ||
    /CERTID[ÃA]O\s+POSITIVA/i.test(text)
  );

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

// Pré-processa imagens de printscreens e fotos de documentos via Canvas HTML5 para maximizar a acurácia do OCR
export async function preprocessImageForOcr(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(imageUrl);
          return;
        }

        // Resolução ideal para OCR: textos nítidos sem esgotar memória no mobile
        const maxDimension = 2000;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Ajuste de contraste para destacar texto preto sobre fundos/marcas d'água
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Filtro de contraste:
            // Fundos claros (> 205) viram branco puro (elimina ruído de tela e marcas d'água)
            // Textos escuros (< 120) viram preto puro (aumenta contraste de leitura)
            if (gray > 205) {
              gray = 255;
            } else if (gray < 120) {
              gray = 0;
            } else {
              gray = ((gray - 120) / (205 - 120)) * 255;
            }

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          ctx.putImageData(imageData, 0, 0);
        } catch (filterErr) {
          console.warn('Filtro de contraste canvas ignorado:', filterErr);
        }

        // Exporta como PNG limpo e perfeito (resolve erros de JPEGs corrompidos ou incompletos de celulares)
        const pngUrl = canvas.toDataURL('image/png');
        resolve(pngUrl);
      } catch (err) {
        console.warn('Erro ao pré-processar imagem para OCR:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = (err) => {
      console.warn('Erro ao carregar imagem para pré-processamento:', err);
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

// Extração de texto de PDF no navegador usando pdfjs-dist (com suporte a fallback para OCR caso seja PDF escaneado/imagem)
export async function extractTextFromPdf(dataUrlOrBuffer: string | ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
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

    // Se o PDF não tiver camada de texto embutida (PDF escaneado / foto salva como PDF)
    if (!fullText.trim() && pdf.numPages > 0) {
      console.log('PDF sem camada de texto nativa. Renderizando página 1 para OCR...');
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport } as any).promise;
        const pageImgUrl = canvas.toDataURL('image/png');
        fullText = await extractTextFromImage(pageImgUrl);
      }
    }

    return fullText;
  } catch (err) {
    console.warn('Falha na extração direta do PDF:', err);
    throw err;
  }
}

// Extração de texto de imagem usando Tesseract OCR otimizado para fotos e printscreens
export async function extractTextFromImage(
  imageUrl: string,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    if (onProgress) onProgress('Otimizando nitidez do printscreen via Canvas...');

    // Pré-processamento via canvas para normalizar resolução, contraste e cabeçalho de imagem
    const cleanImage = await preprocessImageForOcr(imageUrl);

    if (onProgress) onProgress('Iniciando motor de OCR (Tesseract)...');

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('por', 1, {
      logger: m => {
        if (onProgress && m) {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress(`Lendo texto da certidão (OCR): ${pct}%`);
          } else if (m.status === 'loading language traineddata') {
            onProgress('Carregando base da língua portuguesa...');
          } else if (m.status === 'initializing api') {
            onProgress('Preparando inteligência óptica...');
          }
        }
      },
    });

    const ret = await worker.recognize(cleanImage);
    await worker.terminate();
    return ret.data.text;
  } catch (err) {
    console.warn('Falha no OCR Tesseract:', err);
    throw err;
  }
}
