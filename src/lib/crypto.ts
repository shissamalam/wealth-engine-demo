import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'wealth_engine_session';
const VALIDATION_STRING = 'WEALTH_ENGINE_VALID';

export function encryptData(data: string, password: string): string {
  return CryptoJS.AES.encrypt(data, password).toString();
}

export function decryptData(encryptedData: string, password: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

export function createSessionToken(password: string): string {
  const token = encryptData(VALIDATION_STRING, password);
  return token;
}

export function validatePassword(password: string, encryptedToken: string): boolean {
  const decrypted = decryptData(encryptedToken, password);
  return decrypted === VALIDATION_STRING;
}

export function storeSession(password: string): void {
  const token = createSessionToken(password);
  sessionStorage.setItem(STORAGE_KEY, token);
  sessionStorage.setItem('wealth_password', password);
}

export function getStoredPassword(): string | null {
  return sessionStorage.getItem('wealth_password');
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('wealth_password');
}

export function hasValidSession(): boolean {
  const token = sessionStorage.getItem(STORAGE_KEY);
  const password = sessionStorage.getItem('wealth_password');
  if (!token || !password) return false;
  return validatePassword(password, token);
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}
