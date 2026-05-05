import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import ParticleBackground from '../components/ParticleBackground';
import './ScannerPage.css';

const API = 'http://localhost:3001/api/documents';

export default function ScannerPage() {
  const [documents, setDocuments]   = useState([]);
  const [scanning, setScanning]     = useState(false);
  const [progress, setProgress]     = useState(0);
  const [selected, setSelected]     = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyMsg, setCopyMsg]       = useState('');
  const [shareMsg, setShareMsg]     = useState('');

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(API);
      setDocuments(res.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setScanning(true);
    setProgress(0);
    setSelected(null);

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      setProgress(p => p < 85 ? p + 2 : p);
    }, 500);

    try {
      const res = await axios.post(`${API}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setScanning(false);
        setProgress(0);
        setSelected(res.data);
        fetchDocuments();
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setScanning(false);
      setProgress(0);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    disabled: scanning
  });

  const handleToggleShare = async (doc) => {
    try {
      const res     = await axios.patch(`${API}/${doc._id}/share`);
      const updated = res.data;
      if (updated.isShared) {
        const shareUrl = `${window.location.origin}/share/${updated.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        setShareMsg('🔗 Share link copied!');
      } else {
        setShareMsg('🔒 Sharing disabled');
      }
      setTimeout(() => setShareMsg(''), 3000);
      setDocuments(prev => prev.map(d => d._id === updated._id ? updated : d));
      if (selected?._id === updated._id) setSelected(updated);
    } catch (err) {
      alert('Share toggle failed');
    }
  };

  const handleCopyLink = (doc) => {
    const shareUrl = `${window.location.origin}/share/${doc.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setShareMsg('🔗 Link copied!');
    setTimeout(() => setShareMsg(''), 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(selected.extractedText);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selected.extractedText], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = selected.originalName.replace(/\.[^/.]+$/, '') + '_extracted.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await axios.delete(`${API}/${id}`);
    if (selected?._id === id) setSelected(null);
    fetchDocuments();
  };

  const filtered = documents.filter(d =>
    d.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.extractedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = b => b < 1024 * 1024
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / (1024 * 1024)).toFixed(1) + ' MB';

  const formatDate = d => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="scanner-shell">
      <ParticleBackground />

      <main className="page scanner-page">
        <div className="page-header scanner-header">
          <div>
            <span className="scanner-kicker">OCR workspace</span>
            <h2>Document Scanner</h2>
            <p>Upload an image, extract readable text, and share or download the result.</p>
          </div>
        </div>

        {shareMsg && <div className="share-toast">{shareMsg}</div>}

        <div className="scanner-layout">

          {/* ── LEFT PANEL ── */}
          <div className="scanner-left">

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${scanning ? 'disabled' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <span className="dropzone-icon">IMG</span>
                <p>{isDragActive ? 'Drop the image here' : 'Drag and drop an image, or click to select'}</p>
                <span className="dropzone-hint">JPG, PNG, WEBP - max 20MB</span>
              </div>
            </div>

            {/* Progress bar */}
            {scanning && (
              <div className="scan-progress">
                <div className="progress-header">
                  <span>Running OCR... this may take 10-20 seconds</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Result — image + OCR text below */}
            {selected && !scanning && (
              <div className="result-panel">

                {/* File info */}
                <div className="result-header">
                  <div>
                    <h4>{selected.originalName}</h4>
                    <div className="result-meta">
                      <span className="file-type-badge">IMAGE</span>
                      <span>{formatSize(selected.fileSize)}</span>
                      <span>{formatDate(selected.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Original image */}
                <div className="file-preview-area">
                  <img
                    src={selected.fileUrl}
                    alt={selected.originalName}
                    className="img-full-preview"
                  />
                </div>

                {/* OCR extracted text shown directly below */}
                <div className="ocr-text-section">
                  <div className="ocr-text-header">
                    <h5>Extracted Text</h5>
                    <div className="result-buttons">
                      <button className="btn-secondary" onClick={handleCopyText}>
                        {copyMsg || 'Copy'}
                      </button>
                      <button className="btn-secondary" onClick={handleDownload}>
                        Download .txt
                      </button>
                      <button
                        className={selected.isShared ? 'btn-shared' : 'btn-primary'}
                        onClick={() => handleToggleShare(selected)}
                      >
                        {selected.isShared ? 'Disable Sharing' : 'Share'}
                      </button>
                      {selected.isShared && (
                        <button className="btn-secondary" onClick={() => handleCopyLink(selected)}>
                          Copy Link
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="ocr-text-box">
                    {selected.extractedText}
                  </div>

                  {/* Share link */}
                  {selected.isShared && (
                    <div className="share-link-box">
                      <span>Anyone with this link can view:</span>
                      <code>{window.location.origin}/share/{selected.shareToken}</code>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Empty state */}
            {!selected && !scanning && (
              <div className="scanner-empty">
                <span>OCR</span>
                <p>Upload an image to scan and extract text</p>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL — History ── */}
          <div className="scanner-right">
            <h4>Document History</h4>
            <input
              className="search-input"
              placeholder="Search scans..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            {filtered.length === 0 ? (
              <p className="empty-msg">
                No scans yet. Upload an image to get started.
              </p>
            ) : (
              <div className="doc-list">
                {filtered.map(doc => (
                  <div
                    key={doc._id}
                    className={`doc-item ${selected?._id === doc._id ? 'active' : ''}`}
                    onClick={() => setSelected(doc)}
                  >
                    {/* Image thumbnail */}
                    <div className="doc-thumb">
                      <img
                        src={doc.fileUrl}
                        alt={doc.originalName}
                        className="thumb-img"
                      />
                    </div>

                    {/* Info */}
                    <div className="doc-item-info">
                      <span className="doc-name">{doc.originalName}</span>
                      <div className="doc-item-badges">
                        <span className="file-type-badge sm">IMAGE</span>
                        {doc.isShared && <span className="shared-badge">Shared</span>}
                      </div>
                      <span className="doc-date">{formatDate(doc.createdAt)}</span>
                      <span className="doc-preview-text">
                        {doc.extractedText.substring(0, 50)}...
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      className="btn-icon danger"
                      onClick={e => { e.stopPropagation(); handleDelete(doc._id); }}
                    >Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
