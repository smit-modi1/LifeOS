export type DriveLinkKind = 'file' | 'folder'

export interface NormalizedDriveLink {
  id: string
  kind: DriveLinkKind
  url: string
}

export type DriveAttachmentOwner =
  | { type: 'task'; id: string }
  | { type: 'project'; id: string }
  | { type: 'shared' }

export interface DriveAttachment {
  id: string
  createdAt: string
  updatedAt: string
  driveId: string
  kind: DriveLinkKind
  label: string
  owner: DriveAttachmentOwner
  url: string
}

export interface CreateDriveAttachmentInput {
  label?: string
  owner: DriveAttachmentOwner
  url: string
}
