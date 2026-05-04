export type PrivatePayloadEnvelope = {
  version: 1
  ciphertext: string
  iv: string
  salt: string
}

const ENVELOPE_VERSION = 1
const AES_GCM_IV_BYTES = 12
const PBKDF2_SALT_BYTES = 16
const PBKDF2_ITERATIONS = 250_000

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const getWebCrypto = () => {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto is required to encrypt private payloads')
  }

  return globalThis.crypto
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  if (typeof btoa !== 'function') {
    throw new Error('Base64 encoding is unavailable in this environment')
  }

  return btoa(binary)
}

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  if (typeof atob !== 'function') {
    throw new Error('Base64 decoding is unavailable in this environment')
  }

  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

const deriveKey = async (passphrase: string, salt: Uint8Array<ArrayBuffer>) => {
  const webCrypto = getWebCrypto()
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export const encryptPrivatePayload = async (
  payload: unknown,
  passphrase: string,
): Promise<PrivatePayloadEnvelope> => {
  const webCrypto = getWebCrypto()
  const iv = webCrypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES))
  const salt = webCrypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES))
  const key = await deriveKey(passphrase, salt)
  const plaintext = textEncoder.encode(JSON.stringify(payload))
  const ciphertext = await webCrypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, key, plaintext)

  return {
    version: ENVELOPE_VERSION,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  }
}

export const decryptPrivatePayload = async <T>(
  envelope: PrivatePayloadEnvelope,
  passphrase: string,
): Promise<T> => {
  if (envelope.version !== ENVELOPE_VERSION) {
    throw new Error(`Unsupported private payload version: ${envelope.version}`)
  }

  const webCrypto = getWebCrypto()
  const iv = base64ToBytes(envelope.iv)
  const salt = base64ToBytes(envelope.salt)
  const ciphertext = base64ToBytes(envelope.ciphertext)
  const key = await deriveKey(passphrase, salt)
  const plaintext = await webCrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer },
    key,
    ciphertext.buffer,
  )

  return JSON.parse(textDecoder.decode(plaintext)) as T
}
