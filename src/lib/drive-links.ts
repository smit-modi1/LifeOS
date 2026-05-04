import type {
  CreateDriveAttachmentInput,
  DriveAttachment,
  DriveLinkKind,
  NormalizedDriveLink,
} from '../types/drive-links'

const DRIVE_LINK_ERROR = 'Enter a valid Google Drive file or folder URL.'

const DRIVE_HOST = 'drive.google.com'
const DOCS_HOST = 'docs.google.com'

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 12)
}

const nowIso = () => new Date().toISOString()

const isValidDriveId = (value: string | undefined): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value)

const getDriveLinkParts = (url: URL): { id: string; kind: DriveLinkKind } | null => {
  const segments = url.pathname.split('/').filter(Boolean)

  if (url.hostname === DRIVE_HOST) {
    const fileIndex = segments.indexOf('file')
    const folderIndex = segments.indexOf('folders')

    if (fileIndex !== -1 && segments[fileIndex + 1] === 'd') {
      const id = segments[fileIndex + 2]
      return isValidDriveId(id) ? { id, kind: 'file' } : null
    }

    if (folderIndex !== -1) {
      const id = segments[folderIndex + 1]
      return isValidDriveId(id) ? { id, kind: 'folder' } : null
    }
  }

  if (url.hostname === DOCS_HOST && segments[1] === 'd') {
    const id = segments[2]
    return isValidDriveId(id) ? { id, kind: 'file' } : null
  }

  return null
}

const canonicalDriveUrl = ({ id, kind }: { id: string; kind: DriveLinkKind }) =>
  kind === 'folder'
    ? `https://${DRIVE_HOST}/drive/folders/${id}`
    : `https://${DRIVE_HOST}/file/d/${id}/view`

export const normalizeDriveLink = (url: string): NormalizedDriveLink => {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(url.trim())
  } catch {
    throw new Error(DRIVE_LINK_ERROR)
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error(DRIVE_LINK_ERROR)
  }

  const parts = getDriveLinkParts(parsedUrl)

  if (!parts) {
    throw new Error(DRIVE_LINK_ERROR)
  }

  return {
    ...parts,
    url: canonicalDriveUrl(parts),
  }
}

export const createDriveAttachment = (input: CreateDriveAttachmentInput): DriveAttachment => {
  const link = normalizeDriveLink(input.url)
  const createdAt = nowIso()

  return {
    id: createId(),
    createdAt,
    updatedAt: createdAt,
    driveId: link.id,
    kind: link.kind,
    label: input.label?.trim() || link.id,
    owner: input.owner,
    url: link.url,
  }
}
