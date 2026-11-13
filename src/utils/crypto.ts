/**
 * Utilitários de Criptografia em conformidade com a LGPD
 * Utiliza Web Crypto API nativa do navegador (AES-GCM 256 bits e PBKDF2)
 */

// Gera um salt criptográfico aleatório
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Converte ArrayBuffer para Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Converte Base64 para Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Hash SHA-256 para senha
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

// Deriva uma chave AES-GCM de 256 bits a partir de uma senha e salt usando PBKDF2
export async function deriveEncryptionKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBuffer = new TextEncoder().encode(salt);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Criptografa texto puro usando AES-GCM 256 bits
export async function encryptData(plainText: string, key: CryptoKey): Promise<string> {
  if (!plainText) return '';
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV para AES-GCM

  const encodedData = encoder.encode(plainText);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedData
  );

  const ivBase64 = bufferToBase64(iv.buffer as ArrayBuffer);
  const cipherBase64 = bufferToBase64(cipherBuffer);

  // Retorna no formato iv:ciphertext
  return `${ivBase64}:${cipherBase64}`;
}

// Descriptografa texto cifrado usando AES-GCM 256 bits
export async function decryptData(encryptedPayload: string, key: CryptoKey): Promise<string> {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return '';
  try {
    const [ivBase64, cipherBase64] = encryptedPayload.split(':');
    const iv = base64ToBuffer(ivBase64);
    const cipherData = base64ToBuffer(cipherBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      cipherData as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Falha na descriptografia:', err);
    return '[ERRO NA DESCRIPTOGRAFIA - CHAVE INVÁLIDA]';
  }
}

// Exporta chave para armazenamento na sessão volátil
export async function exportKeyRaw(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Importa chave da sessão volátil
export async function importKeyRaw(base64Key: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(base64Key);
  return window.crypto.subtle.importKey(
    'raw',
    buffer as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
