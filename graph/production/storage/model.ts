export type StorageTier = 'transient'|'intermediate'|'deliverable'|'save'|'library';
export type StorageStatus = 'local'|'pending-upload'|'both'|'remote-only'|'mismatch';
export interface StorageEntry {
  path:string; tier:StorageTier; sizeBytes:number; md5:string;
  driveFileId?:string; driveFolderId?:string; remoteMd5?:string; uploadedAt?:string; prunedAt?:string;
  status:StorageStatus; error?:string;
}
export interface StorageCandidate { path:string; tier:StorageTier; category:string }
export interface DriveManifestItem { localPath:string; remoteSubpath:string; md5:string; sizeBytes:number; driveFileId?:string }
export interface DriveResultItem { localPath:string; driveFileId?:string; driveFolderId?:string; remoteMd5?:string; status:'uploaded'|'already'|'mismatch'|'error'; error?:string }
export interface DriveResult { items:DriveResultItem[] }
