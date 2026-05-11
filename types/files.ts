export type FileType = 'file' | 'folder';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  createdAt: string;
  modifiedAt: string;
  owner: string;
  description?: string;
  versions?: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  createdAt: string;
  modifiedAt: string;
  owner: string;
  description?: string;
  versions?: number;
}
