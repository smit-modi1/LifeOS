import { createDriveAttachment, normalizeDriveLink } from './drive-links'

test('normalizes Google Drive file URLs', () => {
  const link = normalizeDriveLink('https://drive.google.com/file/d/abc-123_DEF/view?usp=sharing')

  expect(link).toEqual({
    id: 'abc-123_DEF',
    kind: 'file',
    url: 'https://drive.google.com/file/d/abc-123_DEF/view',
  })
})

test('normalizes Google Drive folder URLs', () => {
  const link = normalizeDriveLink('https://drive.google.com/drive/folders/folder_456?usp=drive_link')

  expect(link).toEqual({
    id: 'folder_456',
    kind: 'folder',
    url: 'https://drive.google.com/drive/folders/folder_456',
  })
})

test('rejects malformed and non-Drive URLs', () => {
  expect(() => normalizeDriveLink('not a url')).toThrow('Enter a valid Google Drive file or folder URL.')
  expect(() => normalizeDriveLink('https://example.com/file/d/abc/view')).toThrow(
    'Enter a valid Google Drive file or folder URL.',
  )
  expect(() => normalizeDriveLink('https://drive.google.com/open?id=abc')).toThrow(
    'Enter a valid Google Drive file or folder URL.',
  )
})

test('creates Drive attachment records for task, project, and shared owners', () => {
  const taskAttachment = createDriveAttachment({
    label: 'Launch brief',
    owner: { type: 'task', id: 'task-1' },
    url: 'https://drive.google.com/file/d/file-1/view?usp=sharing',
  })
  const projectAttachment = createDriveAttachment({
    owner: { type: 'project', id: 'project-1' },
    url: 'https://drive.google.com/drive/folders/folder-1?usp=drive_link',
  })
  const sharedAttachment = createDriveAttachment({
    owner: { type: 'shared' },
    url: 'https://docs.google.com/document/d/doc-1/edit',
  })

  expect(taskAttachment).toMatchObject({
    driveId: 'file-1',
    kind: 'file',
    label: 'Launch brief',
    owner: { type: 'task', id: 'task-1' },
    url: 'https://drive.google.com/file/d/file-1/view',
  })
  expect(projectAttachment).toMatchObject({
    driveId: 'folder-1',
    kind: 'folder',
    label: 'folder-1',
    owner: { type: 'project', id: 'project-1' },
    url: 'https://drive.google.com/drive/folders/folder-1',
  })
  expect(sharedAttachment).toMatchObject({
    driveId: 'doc-1',
    kind: 'file',
    owner: { type: 'shared' },
    url: 'https://drive.google.com/file/d/doc-1/view',
  })
  expect(taskAttachment.id).toBeTruthy()
  expect(taskAttachment.createdAt).toBeTruthy()
  expect(taskAttachment.updatedAt).toBe(taskAttachment.createdAt)
})
