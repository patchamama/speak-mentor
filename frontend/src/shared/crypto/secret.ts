// AES-GCM-256 + PBKDF2-SHA256 secret encryption for API keys at rest.
//
// Threat model:
// - Protects stored API keys against passive disk/localStorage exfiltration when
//   the app is closed (no derived key in memory).
// - Does NOT protect against XSS or malicious extensions running JS in the same
//   origin while the app is unlocked — those threats need a backend proxy.
//
// Format: JSON envelope { v, salt, iv, ct } with all bytes base64-encoded.

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BITS = 256

export interface EncryptedSecret {
  v: 1
  salt: string
  iv: string
  ct: string
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptSecret(plaintext: string, password: string): Promise<EncryptedSecret> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(password, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as BufferSource,
  )
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ct)),
  }
}

export class DecryptError extends Error {
  constructor() {
    super('Failed to decrypt secret — wrong password or corrupted data')
    this.name = 'DecryptError'
  }
}

export async function decryptSecret(envelope: EncryptedSecret, password: string): Promise<string> {
  if (envelope.v !== 1) throw new DecryptError()
  try {
    const salt = fromBase64(envelope.salt)
    const iv = fromBase64(envelope.iv)
    const ct = fromBase64(envelope.ct)
    const key = await deriveKey(password, salt)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ct as BufferSource)
    return new TextDecoder().decode(pt)
  } catch {
    throw new DecryptError()
  }
}

export function isEncryptedSecret(value: unknown): value is EncryptedSecret {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.v === 1 && typeof v.salt === 'string' && typeof v.iv === 'string' && typeof v.ct === 'string'
}
