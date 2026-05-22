import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret, isEncryptedSecret, DecryptError } from '../secret'

describe('secret encryption', () => {
  it('round-trips plaintext with correct password', async () => {
    const env = await encryptSecret('sk-test-1234567890', 'master-pw')
    const out = await decryptSecret(env, 'master-pw')
    expect(out).toBe('sk-test-1234567890')
  })

  it('produces distinct ciphertext for same plaintext (random salt + iv)', async () => {
    const a = await encryptSecret('hello', 'pw')
    const b = await encryptSecret('hello', 'pw')
    expect(a.ct).not.toBe(b.ct)
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
  })

  it('rejects wrong password', async () => {
    const env = await encryptSecret('secret', 'right')
    await expect(decryptSecret(env, 'wrong')).rejects.toBeInstanceOf(DecryptError)
  })

  it('rejects tampered ciphertext', async () => {
    const env = await encryptSecret('secret', 'pw')
    const tampered = { ...env, ct: env.ct.replace(/.$/, 'A') }
    await expect(decryptSecret(tampered, 'pw')).rejects.toBeInstanceOf(DecryptError)
  })

  it('isEncryptedSecret validates envelope shape', () => {
    expect(isEncryptedSecret({ v: 1, salt: 'a', iv: 'b', ct: 'c' })).toBe(true)
    expect(isEncryptedSecret({ v: 2, salt: 'a', iv: 'b', ct: 'c' })).toBe(false)
    expect(isEncryptedSecret(null)).toBe(false)
    expect(isEncryptedSecret('string')).toBe(false)
    expect(isEncryptedSecret({ v: 1, salt: 'a' })).toBe(false)
  })

  it('handles empty plaintext', async () => {
    const env = await encryptSecret('', 'pw')
    expect(await decryptSecret(env, 'pw')).toBe('')
  })

  it('handles unicode in plaintext and password', async () => {
    const env = await encryptSecret('clave-ñ-中文-🔑', 'pässwört-€')
    expect(await decryptSecret(env, 'pässwört-€')).toBe('clave-ñ-中文-🔑')
  })
})
