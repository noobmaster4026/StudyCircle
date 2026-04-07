import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function SharedDocPage() {
  const { token }             = useParams();
  const [doc, setDoc]         = useState(null);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/documents/share/${token}`)
      .then(res => setDoc(res.data))
      .catch(() => setError('This document is not available or sharing has been disabled.'));
  }, [token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.extractedText);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([doc.extractedText], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = doc.originalName.replace(/\.[^/.]+$/, '') + '_extracted.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return (
    <div className="shared-error">
      <span>🔒</span>
      <h3>Document Unavailable</h3>
      <p>{error}</p>
    </div>
  );

  if (!doc) return <div className="shared-loading">Loading document...</div>;

  return (
    <div className="shared-page">
      <div className="shared-header">
        <div>
          <h2>{doc.fileType === 'pdf' ? '📕' : '🖼️'} {doc.originalName}</h2>
          <div className="shared-meta">
            <span>📃 {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''}</span>
            <span className="file-type-badge">{doc.fileType?.toUpperCase()}</span>
            <span>📅 {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="shared-actions">
          <button className="btn-secondary" onClick={handleCopy}>{copyMsg || '📋 Copy Text'}</button>
          <button className="btn-primary"   onClick={handleDownload}>⬇️ Download .txt</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="viewer-tabs" style={{ marginBottom: '1rem' }}>
        <button className={activeTab === 'preview' ? 'vtab active' : 'vtab'} onClick={() => setActiveTab('preview')}>
          👁️ Preview
        </button>
        <button className={activeTab === 'text' ? 'vtab active' : 'vtab'} onClick={() => setActiveTab('text')}>
          📝 Extracted Text
        </button>
      </div>

      <div className="shared-body">
        {activeTab === 'preview' && (
          doc.fileType === 'pdf'
            ? <iframe src={doc.fileUrl} title={doc.originalName} className="pdf-iframe" />
            : <img src={doc.fileUrl} alt={doc.originalName} className="img-full-preview" />
        )}
        {activeTab === 'text' && (
          <pre className="shared-text">{doc.extractedText}</pre>
        )}
      </div>
    </div>
  );
}