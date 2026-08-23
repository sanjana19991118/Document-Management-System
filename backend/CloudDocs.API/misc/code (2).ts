// src/types/document.ts
public interface DocumentModel {
  id?: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  s3Key: string;
  uploadedAt?: string;
}