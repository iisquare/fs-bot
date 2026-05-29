import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export function deriveKey(userId: string, dbSecret: string, purpose = ''): Buffer {
  return createHash('sha256')
    .update(userId + ':' + dbSecret + ':' + purpose)
    .digest()
}

export function encryptValue(plaintext: string, key: Buffer): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decryptValue(stored: string, key: Buffer): string {
  const colonIndex = stored.indexOf(':')
  if (colonIndex === -1) {
    throw new Error('Invalid encrypted value format')
  }
  const ivHex = stored.substring(0, colonIndex)
  const ciphertext = stored.substring(colonIndex + 1)
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
