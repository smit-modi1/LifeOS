import { decryptPrivatePayload, encryptPrivatePayload } from './crypto'

test('profile payload round-trips through an encrypted envelope', async () => {
  const profile = {
    fullName: 'Maya Patel',
    headline: 'Founder',
    links: [{ label: 'Portfolio', url: 'https://example.com' }],
  }

  const envelope = await encryptPrivatePayload(profile, 'vault-passphrase')
  const decrypted = await decryptPrivatePayload<typeof profile>(envelope, 'vault-passphrase')

  expect(decrypted).toEqual(profile)
  expect(envelope.version).toBe(1)
  expect(envelope.ciphertext).toEqual(expect.any(String))
  expect(envelope.iv).toEqual(expect.any(String))
  expect(envelope.salt).toEqual(expect.any(String))
})

test('notes ciphertext does not contain note title or content', async () => {
  const notes = {
    items: [
      {
        id: 'note-1',
        title: 'Private launch plan',
        content: 'Discuss runway and hiring timeline',
        label: 'Strategy',
      },
    ],
  }

  const envelope = await encryptPrivatePayload(notes, 'vault-passphrase')
  const serializedEnvelope = JSON.stringify(envelope)

  expect(serializedEnvelope).not.toContain('Private launch plan')
  expect(serializedEnvelope).not.toContain('Discuss runway and hiring timeline')
  expect(await decryptPrivatePayload<typeof notes>(envelope, 'vault-passphrase')).toEqual(notes)
})
