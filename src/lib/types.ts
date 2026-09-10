export type Role = 'ADMIN' | 'TEAM_MEMBER';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface GallerySession {
  galleryId: string;
  slug: string;
}

export interface PhotoMetadata {
  id: string;
  eventId: string;
  uploadedById: string;
  uploadedByName?: string;
  filename: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
  mimeType: string;
  isSelected: boolean;
  createdAt: string;
}
