import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SharedDocPage() {
  const { token }                 = useParams();
  const navigate                  = useNavigate();
  const [doc, setDoc]             = useState(null);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copyMsg, setCopyMsg]     = useState('');

  useEffect(() => {
    axios.get(`http://localhost:3001/api/documents/share/${token}`)
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

  /* ─── Styles ────────────────────────────────────────────────── */
  const s = {
    wrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #0a0a1a 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#fff',
    },

    /* Navbar */
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 64,
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    navBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
    },
    navLogo: {
      fontSize: 20,
      fontWeight: 800,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
    },
    navTag: {
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.4)',
      background: 'rgba(255,255,255,0.05)',
      padding: '3px 10px',
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.1)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },

    /* Hero */
    hero: {
      padding: '48px 32px 32px',
      maxWidth: 900,
      margin: '0 auto',
    },
    breadcrumb: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.3)',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 'clamp(22px, 4vw, 34px)',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
      marginBottom: 12,
      wordBreak: 'break-word',
    },
    metaRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
      marginBottom: 24,
    },
    badge: {
      fontSize: 11,
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: 20,
      background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
      border: '1px solid rgba(139,92,246,0.4)',
      color: '#a78bfa',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    metaText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
    },

    /* Action buttons */
    actions: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      marginBottom: 28,
    },
    btnPrimary: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: 'none',
      borderRadius: 10,
      color: '#fff',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'opacity 0.2s',
    },
    btnSecondary: {
      padding: '10px 20px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'background 0.2s',
    },

    /* Card */
    card: {
      maxWidth: 900,
      margin: '0 auto 48px',
      padding: '0 32px',
    },
    cardInner: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
    },

    /* Tabs */
    tabRow: {
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0 4px',
    },
    tab: (active) => ({
      padding: '14px 20px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
      borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
      marginBottom: -1,
      transition: 'color 0.2s',
    }),

    /* Content areas */
    previewArea: {
      padding: 24,
      display: 'flex',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.2)',
    },
    imgPreview: {
      maxWidth: '100%',
      maxHeight: 600,
      borderRadius: 12,
      objectFit: 'contain',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    textArea: {
      padding: 28,
      fontSize: 14,
      lineHeight: 1.8,
      color: 'rgba(255,255,255,0.75)',
      whiteSpace: 'pre-wrap',
      fontFamily: "'Fira Code', 'Courier New', monospace",
      minHeight: 300,
    },

    /* Error / Loading */
    centered: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      gap: 14,
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
      padding: 32,
    },
    errorIcon: {
      fontSize: 52,
      marginBottom: 8,
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: 700,
      color: '#fff',
    },
    errorMsg: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.4)',
      maxWidth: 340,
    },
    spinner: {
      width: 40,
      height: 40,
      border: '3px solid rgba(139,92,246,0.2)',
      borderTop: '3px solid #8b5cf6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },

    /* Divider */
    divider: {
      height: 1,
      background: 'rgba(255,255,255,0.06)',
      margin: '0 24px',
    },
  };

  /* ─── Error state ───────────────────────────────────────────── */
  if (error) return (
    <div style={s.wrapper}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <span style={s.navLogo}>StudyCircle</span>
        </div>
        <span style={s.navTag}>Shared Document</span>
      </nav>
      <div style={s.centered}>
        <div style={s.errorIcon}>🔒</div>
        <div style={s.errorTitle}>Document Unavailable</div>
        <p style={s.errorMsg}>{error}</p>
        <button style={s.btnPrimary} onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );

  /* ─── Loading state ─────────────────────────────────────────── */
  if (!doc) return (
    <div style={s.wrapper}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navLogo}>StudyCircle</span>
        </div>
        <span style={s.navTag}>Shared Document</span>
      </nav>
      <div style={s.centered}>
        <div style={s.spinner} />
        <p>Loading document...</p>
      </div>
    </div>
  );

  /* ─── Main render ───────────────────────────────────────────── */
  return (
    <div style={s.wrapper}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand} onClick={() => navigate('/')}>
          <span style={s.navLogo}>StudyCircle</span>
        </div>
        <span style={s.navTag}>📄 Shared Document</span>
      </nav>

      {/* Hero / Header */}
      <div style={s.hero}>
        <div style={s.breadcrumb}>
          <span>StudyCircle</span>
          <span>›</span>
          <span>Shared</span>
          <span>›</span>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{doc.originalName}</span>
        </div>

        <h1 style={s.title}>
          {doc.fileType === 'pdf' ? '📕' : '🖼️'} {doc.originalName}
        </h1>

        <div style={s.metaRow}>
          <span style={s.badge}>{doc.fileType?.toUpperCase() || 'IMAGE'}</span>
          <span style={s.metaText}>📃 {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''}</span>
          <span style={s.metaText}>
            📅 {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div style={s.actions}>
          <button style={s.btnPrimary} onClick={handleDownload}>
            ⬇️ Download .txt
          </button>
          <button style={s.btnSecondary} onClick={handleCopy}>
            {copyMsg ? '✅ ' + copyMsg : '📋 Copy Text'}
          </button>
        </div>
      </div>

      {/* Document Card */}
      <div style={s.card}>
        <div style={s.cardInner}>

          {/* Tabs */}
          <div style={s.tabRow}>
            <button style={s.tab(activeTab === 'preview')} onClick={() => setActiveTab('preview')}>
              👁️ Preview
            </button>
            <button style={s.tab(activeTab === 'text')} onClick={() => setActiveTab('text')}>
              📝 Extracted Text
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'preview' && (
            <div style={s.previewArea}>
              {doc.fileType === 'pdf'
                ? <iframe src={doc.fileUrl} title={doc.originalName} style={{ width: '100%', height: 600, border: 'none', borderRadius: 8 }} />
                : <img src={doc.fileUrl} alt={doc.originalName} style={s.imgPreview} />
              }
            </div>
          )}

          {activeTab === 'text' && (
            <div style={s.textArea}>
              {doc.extractedText}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
