import { PrivateVaultRepository } from './private-vault-repository'
import { SharedSpaceRepository } from './shared-space-repository'
import { createEmptyLifeOsData } from './lifeos'

type WriteRecord = {
  path: string
  value: unknown
}

const createRecorder = () => {
  const writes: WriteRecord[] = []

  return {
    writes,
    writer: async (path: string, value: unknown) => {
      writes.push({ path, value })
    },
  }
}

test('saves private module data under a user private path', async () => {
  const { writes, writer } = createRecorder()
  const repository = new PrivateVaultRepository(writer)

  await repository.saveModule('user-1', 'notes', createEmptyLifeOsData().notes)

  expect(writes[0].path).toBe('users/user-1/private/notes')
})

test('saves shared module data under a space module path', async () => {
  const { writes, writer } = createRecorder()
  const repository = new SharedSpaceRepository(writer)

  await repository.saveModule('space-1', 'work', createEmptyLifeOsData().work)

  expect(writes[0].path).toBe('spaces/space-1/modules/work')
})

test('rejects private vault modules in shared spaces', async () => {
  const { writer } = createRecorder()
  const repository = new SharedSpaceRepository(writer)

  await expect(repository.saveModule('space-1', 'notes', createEmptyLifeOsData().notes)).rejects.toThrow(
    'notes cannot be saved to a shared space.',
  )
})
