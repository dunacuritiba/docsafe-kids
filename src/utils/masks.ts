/**
 * Máscaras e Validadores para Padrões Brasileiros
 */

// Aplica máscara de telefone celular/fixo brasileiro
export function maskPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Fixo ou celular 8 dígitos
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular 9 dígitos: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Aplica máscara de CPF: 000.000.000-00
export function maskCPF(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// Validador matemático de CPF oficial
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;

  // Rejeita padrões com dígitos todos iguais (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
}

// Mascara CPF para exibição segura (Ex: 123.***.***-00)
export function maskSensitiveCPF(cpf: string): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length < 11) return cpf;
  return `${clean.slice(0, 3)}.***.***-${clean.slice(9, 11)}`;
}

// Mascara Telefone para exibição segura (Ex: (11) 9****-1234)
export function maskSensitivePhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return phone;
  const ddd = clean.slice(0, 2);
  const end = clean.slice(-4);
  return `(${ddd}) *****-${end}`;
}

// Formata tamanho de arquivo em bytes
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
