import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, HardDrive } from 'lucide-react';

interface DocItem {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  s3Key: string;
  uploadedAt: string;
}

const API_BASE = 'http://localhost:5000/api/documents';

// Default mock data to mirror the screenshot layout
const initialDocs: DocItem[] = [
  {
    id: '1',
    fileName: 'Project Specs.docx',
    contentType: 'application/vnd.openxml...',
    fileSizeBytes: 1289748, // 1.23 MB
    s3Key: 'uploads/specs-abcd...',
    uploadedAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: '2',
    fileName: 'Marketing Logo.png',
    contentType: 'image/png',
    fileSizeBytes: 262144, // 256 KB
    s3Key: 'uploads/logo-efgh...',
    uploadedAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: '3',
    fileName: 'Quarterly Report.pdf',
    contentType: 'application/pdf',
    fileSizeBytes: 3617587, // 3.45 MB
    s3Key: 'uploads/report-ijkl...',
    uploadedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: '4',
    fileName: 'Database Backup.zip',
    contentType: 'application/zip',
    fileSizeBytes: 16462592, // 15.7 MB
    s3Key: 'uploads/backup-mnop...',
    uploadedAt: '2026-01-28T00:00:00.000Z',
  },
];

export const DocumentUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocItem[]>(initialDocs);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setDocuments(data);
      }
    } catch (err) {
      console.log('Using default dataset (Backend API offline)');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const presignedRes = await fetch(`${API_BASE}/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const { uploadUrl, s3Key } = await presignedRes.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSizeBytes: file.size,
          s3Key: s3Key,
        }),
      });

      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Ensure backend API is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        {/* Top Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Cloud Vault</h1>
            <p style={styles.subtitle}>
              Secure S3 Direct Upload & PostgreSQL Management System
            </p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.iconContainer}>
              <HardDrive size={24} color="#ffffff" />
            </div>
            <div>
              <div style={styles.statLabel}>Total Stored</div>
              <div style={styles.statVal}>1.23 GB</div>
            </div>
          </div>
        </header>

        {/* Upload Box */}
        <div
          style={{
            ...styles.dropzone,
            borderColor: dragActive ? '#3b82f6' : '#cbd5e1',
            backgroundColor: dragActive ? '#f0f9ff' : '#f8fafc',
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadCloud size={48} color="#94a3b8" />
          <h3 style={styles.dropText}>Drag and drop your file here, or browse</h3>
          <p style={styles.dropSub}>Drag and drop your file here, or browse</p>

          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <label htmlFor="fileInput" style={styles.browseBtn}>
            Select File
          </label>

          {/* Selected File Bar matching screenshot */}
          <div style={styles.fileSelectedBar}>
            <div style={styles.fileIconBox}>
              <FileText size={20} color="#ffffff" />
            </div>
            <div style={styles.fileDetails}>
              <span style={styles.fileName}>
                {file ? file.name : 'test-document.pdf'}
              </span>
              <span style={styles.fileSize}>
                {file ? formatSize(file.size) : '1.23 MB'}
              </span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={styles.uploadBtn}
            >
              {uploading ? 'Uploading...' : 'Start Upload'}
            </button>
          </div>
        </div>

        {/* Table Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Document Vault ({documents.length})
            </h2>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.th, width: '25%' }}>NAME</th>
                <th style={{ ...styles.th, width: '25%' }}>TYPE</th>
                <th style={{ ...styles.th, width: '15%' }}>SIZE</th>
                <th style={{ ...styles.th, width: '20%' }}>S3 OBJECT KEY</th>
                <th style={{ ...styles.th, width: '15%' }}>UPLOADED DATE</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={styles.tr}>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>
                    {doc.fileName}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{doc.contentType}</span>
                  </td>
                  <td style={styles.td}>{formatSize(doc.fileSizeBytes)}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', color: '#475569' }}>
                    {doc.s3Key}
                  </td>
                  <td style={styles.td}>
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageBackground: {
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    width: '100%',
    padding: '40px 0',
  },
  container: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '0 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: '#475569',
    margin: 0,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  iconContainer: {
    backgroundColor: '#2563eb',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '2px',
  },
  statVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '36px 20px 20px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    marginBottom: '32px',
  },
  dropText: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '16px 0 4px 0',
    color: '#0f172a',
  },
  dropSub: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 20px 0',
  },
  browseBtn: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '10px 22px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    border: 'none',
  },
  fileSelectedBar: {
    marginTop: '28px',
    width: '100%',
    maxWidth: '720px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  fileIconBox: {
    backgroundColor: '#3b82f6',
    padding: '8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexGrow: 1,
    marginLeft: '14px',
  },
  fileName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#0f172a',
  },
  fileSize: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '2px',
  },
  uploadBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  sectionHeader: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    color: '#0f172a',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#334155',
  },
  badge: {
    backgroundColor: '#e2e8f0',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#334155',
    display: 'inline-block',
  },
};

// import React, { useState } from 'react';

// const API_BASE = 'http://localhost:5000/api/documents';

// export const DocumentUploader: React.FC = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);

//   const handleUpload = async () => {
//     if (!file) return;
//     setUploading(true);

//     try {
//       // 1. Get Presigned URL from .NET API
//       const presignedRes = await fetch(`${API_BASE}/presigned-url`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fileName: file.name, contentType: file.type }),
//       });

//       if (!presignedRes.ok) throw new Error('Failed to fetch presigned URL');
//       const { uploadUrl, s3Key } = await presignedRes.json();

//       // 2. Upload file binary directly to AWS S3
//       const s3UploadRes = await fetch(uploadUrl, {
//         method: 'PUT',
//         headers: { 'Content-Type': file.type },
//         body: file,
//       });

//       if (!s3UploadRes.ok) throw new Error('Failed to upload binary to AWS S3');

//       // 3. Save Document metadata in PostgreSQL database
//       await fetch(API_BASE, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           fileName: file.name,
//           contentType: file.type,
//           fileSizeBytes: file.size,
//           s3Key: s3Key,
//         }),
//       });

//       alert('File successfully uploaded to AWS S3!');
//       setFile(null);
//     } catch (err) {
//       console.error('Upload Error:', err);
//       alert('Upload failed. Check console for details.');
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '24px', maxWidth: '500px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
//       <h2>Cloud Document Management</h2>
//       <div style={{ margin: '20px 0' }}>
//         <input 
//           type="file" 
//           onChange={(e) => setFile(e.target.files?.[0] || null)} 
//         />
//       </div>
//       <button 
//         onClick={handleUpload} 
//         disabled={!file || uploading} 
//         style={{ padding: '10px 20px', cursor: file && !uploading ? 'pointer' : 'not-allowed' }}
//       >
//         {uploading ? 'Uploading to AWS S3...' : 'Upload Document'}
//       </button>
//     </div>
//   );
// };