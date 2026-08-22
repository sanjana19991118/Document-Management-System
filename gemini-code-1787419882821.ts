// src/components/DocumentUploader.tsx
import React, { useState } from 'react';

const API_BASE = 'http://localhost:5000/api/documents';

export const DocumentUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // 1. Get Presigned URL from .NET API
      const presignedRes = await fetch(`${API_BASE}/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const { uploadUrl, s3Key } = await presignedRes.json();

      // 2. Upload file directly from browser to AWS S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // 3. Save file metadata into PostgreSQL via .NET API
      const metadataPayload = {
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        s3Key: s3Key,
      };

      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadataPayload),
      });

      alert('Upload successful!');
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', border: '1px solid #ccc' }}>
      <h3>Upload Document</h3>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ marginTop: '10px', width: '100%' }}
      >
        {uploading ? 'Uploading...' : 'Submit'}
      </button>
    </div>
  );
};