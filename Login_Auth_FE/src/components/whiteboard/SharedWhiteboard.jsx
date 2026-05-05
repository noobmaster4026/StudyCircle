import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// ── Config ───────────────────────────────────────────────────────────────────
const MEETING_SERVER = import.meta.env.VITE_MEETING_SERVER_URL || 'http://localhost:5000';

function uid() { return Math.random().toString(36).slice(2, 10); }
function relTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'pen',    label: 'Pen',       icon: '✏️', key: 'P', desc: 'Freehand drawing' },
  { id: 'eraser', label: 'Eraser',    icon: '◻',  key: 'E', desc: 'Erase marks' },
  { id: 'line',   label: 'Line',      icon: '╱',  key: 'L', desc: 'Draw a straight line' },
  { id: 'rect',   label: 'Rectangle', icon: '▭',  key: 'R', desc: 'Draw a rectangle' },
  { id: 'circle', label: 'Circle',    icon: '○',  key: 'C', desc: 'Draw a circle' },
  { id: 'text',   label: 'Text',      icon: 'T',  key: 'X', desc: 'Add a text label' },
  { id: 'sticky', label: 'Sticky',    icon: '📌', key: 'N', desc: 'Add a sticky note' },
];

const COLORS = [
  { hex: '#1C1C2E', name: 'Midnight' },
  { hex: '#E63946', name: 'Crimson'  },
  { hex: '#2196F3', name: 'Blue'     },
  { hex: '#4CAF50', name: 'Green'    },
  { hex: '#FF9800', name: 'Orange'   },
  { hex: '#9C27B0', name: 'Purple'   },
  { hex: '#00BCD4', name: 'Cyan'     },
  { hex: '#F06292', name: 'Pink'     },
  { hex: '#795548', name: 'Brown'    },
  { hex: '#FFFFFF', name: 'White'    },
];

const SIZES = [
  { value: 2,  label: 'XS' },
  { value: 4,  label: 'S'  },
  { value: 8,  label: 'M'  },
  { value: 14, label: 'L'  },
  { value: 22, label: 'XL' },
];

const HISTORY_ICONS = {
  draw:   '✏️', erase: '◻', shape: '▭',
  text:   'T',  sticky: '📌', undo: '↩', clear: '🗑',
};

// ── Socket hook ───────────────────────────────────────────────────────────────
function useWhiteboardSocket(roomId, userName) {
  const socketRef  = useRef(null);
  const [connected, setConnected]       = useState(false);
  const [peers, setPeers]               = useState({});   // { socketId: {name,color} }
  const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: {x,y,color,name} }
  const [history, setHistory]           = useState([]);
  const myColor = useRef('#E63946');

  useEffect(() => {
    if (!roomId) return;
    const socket = io(`${MEETING_SERVER}/whiteboard`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('wb:join', { roomId, userName });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('wb:init', ({ cursors, history: h, myColor: mc }) => {
      if (mc) myColor.current = mc;
      setRemoteCursors(cursors || {});
      setHistory(h || []);
    });

    socket.on('wb:user-joined', ({ socketId, name, color }) => {
      setPeers((p) => ({ ...p, [socketId]: { name, color } }));
      setRemoteCursors((c) => ({ ...c, [socketId]: { x: -100, y: -100, color, name } }));
    });

    socket.on('wb:user-left', ({ socketId }) => {
      setPeers((p) => { const n = { ...p }; delete n[socketId]; return n; });
      setRemoteCursors((c) => { const n = { ...c }; delete n[socketId]; return n; });
    });

    socket.on('wb:cursor', ({ socketId, x, y }) => {
      setRemoteCursors((c) => ({
        ...c,
        [socketId]: { ...(c[socketId] || {}), x, y },
      }));
    });

    socket.on('wb:history-add', (entry) => {
      setHistory((h) => [...h.slice(-199), entry]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, userName]);

  return { socketRef, connected, peers, remoteCursors, history, myColor };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SharedWhiteboard() {
  const { roomId = 'shared-board' } = useParams();
  const userName   = localStorage.getItem('userName') || 'Student';
  const navigate   = useNavigate();

  // Canvas refs
  const canvasRef   = useRef(null);
  const ctxRef      = useRef(null);

  // Tool state
  const [tool,      setTool]      = useState('pen');
  const [color,     setColor]     = useState('#1C1C2E');
  const [size,      setSize]      = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // UI panels
  const [showHistory, setShowHistory]   = useState(false);
  const [showHelp,    setShowHelp]      = useState(false);
  const [stickyNotes, setStickyNotes]   = useState([]);
  const [textInput,   setTextInput]     = useState({ active: false, x: 0, y: 0, value: '' });

  const startPt      = useRef({ x: 0, y: 0 });
  const strokeIdRef  = useRef(null);
  const activeRemote = useRef({});  // remote in-progress strokes

  const { socketRef, connected, peers, remoteCursors, history, myColor }
    = useWhiteboardSocket(roomId, userName);

  const historyEndRef = useRef(null);

  // ── Canvas init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const saved = ctxRef.current
        ? ctxRef.current.getImageData(0, 0, canvas.width, canvas.height)
        : null;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
      if (saved) ctx.putImageData(saved, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── Replay a single saved stroke/shape onto the canvas ────────────────────
  const replay = useCallback((ctx, s) => {
    if (!ctx || s.type === 'sticky') return;
    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = s.tool === 'eraser' ? '#F5F0E8' : (s.color || '#000');
    ctx.lineWidth   = s.lineWidth || 2;

    if (s.tool === 'pen' || s.tool === 'eraser') {
      ctx.beginPath();
      (s.points || []).forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (s.tool === 'line') {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
    } else if (s.tool === 'rect') {
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    } else if (s.tool === 'circle') {
      ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2); ctx.stroke();
    } else if (s.tool === 'text') {
      ctx.fillStyle = s.color;
      ctx.font      = `${s.fontSize || 16}px 'DM Mono', monospace`;
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.restore();
  }, []);

  // ── Remote drawing listeners ───────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('wb:init', ({ strokes }) => {
      const ctx    = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      (strokes || []).forEach((s) => replay(ctx, s));
    });

    socket.on('wb:stroke-start', ({ strokeId, tool, color, lineWidth, x, y }) => {
      activeRemote.current[strokeId] = { tool, color, lineWidth, points: [{ x, y }] };
    });

    socket.on('wb:stroke-move', ({ strokeId, x, y }) => {
      const stroke = activeRemote.current[strokeId];
      if (!stroke) return;
      stroke.points.push({ x, y });
      const ctx = ctxRef.current;
      if (!ctx) return;
      const pts = stroke.points;
      const len = pts.length;
      if (len >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#F5F0E8' : stroke.color;
        ctx.lineWidth   = stroke.lineWidth;
        ctx.lineCap     = 'round';
        ctx.moveTo(pts[len - 2].x, pts[len - 2].y);
        ctx.lineTo(pts[len - 1].x, pts[len - 1].y);
        ctx.stroke();
      }
    });

    socket.on('wb:stroke-end', ({ strokeId }) => { delete activeRemote.current[strokeId]; });

    socket.on('wb:add-shape', (s) => replay(ctxRef.current, s));

    socket.on('wb:undo', () => {
      // Full redraw from server init is the safest approach for undo.
      // Server emits wb:init after undo to all clients.
    });

    socket.on('wb:clear', () => {
      const ctx    = ctxRef.current;
      const canvas = canvasRef.current;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStickyNotes([]);
    });

    socket.on('wb:sticky-add',  (n) => setStickyNotes((ns) => [...ns, n]));
    socket.on('wb:sticky-move', ({ id, x, y }) => setStickyNotes((ns) => ns.map((s) => s.id === id ? { ...s, x, y } : s)));
    socket.on('wb:sticky-edit', ({ id, text }) => setStickyNotes((ns) => ns.map((s) => s.id === id ? { ...s, text } : s)));

    const events = ['wb:init','wb:stroke-start','wb:stroke-move','wb:stroke-end',
                    'wb:add-shape','wb:undo','wb:clear','wb:sticky-add','wb:sticky-move','wb:sticky-edit'];
    return () => events.forEach((e) => socket.off(e));
  }, [socketRef.current, replay]);

  // Auto-scroll history to bottom
  useEffect(() => {
    if (showHistory) historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, showHistory]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toUpperCase();
      const found = TOOLS.find((t) => t.key === key);
      if (found) { setTool(found.id); return; }
      if ((e.ctrlKey || e.metaKey) && key === 'Z') { e.preventDefault(); socketRef.current?.emit('wb:undo'); }
      if (key === 'H') setShowHistory((v) => !v);
      if (key === '?') setShowHelp((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const getPos = (e) => {
    const rect  = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handlePointerDown = useCallback((e) => {
    const pos = getPos(e);

    if (tool === 'sticky') {
      const note = {
        id: uid(), type: 'sticky', x: pos.x, y: pos.y,
        text: 'New note — tap ✎ to edit',
        color: color, authorName: userName,
      };
      setStickyNotes((ns) => [...ns, note]);
      socketRef.current?.emit('wb:sticky-add', note);
      return;
    }

    if (tool === 'text') {
      setTextInput({ active: true, x: pos.x, y: pos.y, value: '' });
      return;
    }

    setIsDrawing(true);
    startPt.current    = pos;
    const strokeId     = uid();
    strokeIdRef.current = strokeId;

    const ctx = ctxRef.current;
    const ew  = tool === 'eraser' ? size * 5 : size;
    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#F5F0E8' : color;
    ctx.lineWidth   = ew;
    ctx.moveTo(pos.x, pos.y);

    socketRef.current?.emit('wb:stroke-start', {
      strokeId, tool, color, lineWidth: ew, x: pos.x, y: pos.y,
    });
  }, [tool, color, size, userName]);

  const handlePointerMove = useCallback((e) => {
    const pos = getPos(e);
    socketRef.current?.emit('wb:cursor', pos);
    if (!isDrawing) return;

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = ctxRef.current;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      socketRef.current?.emit('wb:stroke-move', { strokeId: strokeIdRef.current, x: pos.x, y: pos.y });
    }
  }, [isDrawing, tool]);

  const handlePointerUp = useCallback((e) => {
    if (!isDrawing) return;
    const pos   = getPos(e);
    const ctx   = ctxRef.current;
    const start = startPt.current;

    if (tool === 'line') {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.moveTo(start.x, start.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
      socketRef.current?.emit('wb:add-shape', {
        shapeId: uid(), tool: 'line', color, lineWidth: size,
        x1: start.x, y1: start.y, x2: pos.x, y2: pos.y,
      });
    } else if (tool === 'rect') {
      ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      socketRef.current?.emit('wb:add-shape', {
        shapeId: uid(), tool: 'rect', color, lineWidth: size,
        x: start.x, y: start.y, w: pos.x - start.x, h: pos.y - start.y,
      });
    } else if (tool === 'circle') {
      const r = Math.hypot(pos.x - start.x, pos.y - start.y);
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = size;
      ctx.arc(start.x, start.y, r, 0, Math.PI * 2); ctx.stroke();
      socketRef.current?.emit('wb:add-shape', {
        shapeId: uid(), tool: 'circle', color, lineWidth: size,
        cx: start.x, cy: start.y, r,
      });
    }

    socketRef.current?.emit('wb:stroke-end', { strokeId: strokeIdRef.current });
    setIsDrawing(false);
    ctx.beginPath();
  }, [isDrawing, tool, color, size]);

  const commitText = () => {
    if (!textInput.value.trim()) { setTextInput({ active: false, x: 0, y: 0, value: '' }); return; }
    const ctx      = ctxRef.current;
    const fontSize = size * 5 + 10;
    ctx.fillStyle  = color;
    ctx.font       = `${fontSize}px 'DM Mono', monospace`;
    ctx.fillText(textInput.value, textInput.x, textInput.y);
    socketRef.current?.emit('wb:add-shape', {
      shapeId: uid(), tool: 'text', color, fontSize,
      text: textInput.value, x: textInput.x, y: textInput.y,
    });
    setTextInput({ active: false, x: 0, y: 0, value: '' });
  };

  const handleClear = () => {
    if (!window.confirm('Clear the entire board? This affects everyone.')) return;
    ctxRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setStickyNotes([]);
    socketRef.current?.emit('wb:clear');
  };

  const handleUndo = () => socketRef.current?.emit('wb:undo');

  // ── Peer count label ──────────────────────────────────────────────────────
  const peerCount = Object.keys(peers).length;

  // ── Board title from roomId ───────────────────────────────────────────────
  const boardTitle = useMemo(() => {
    if (roomId === 'shared-board') return 'Class Shared Board';
    return roomId.startsWith('wb-')
      ? roomId.replace('wb-', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : `Board: ${roomId}`;
  }, [roomId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={css.root} role="main" aria-label="Shared Whiteboard">

        {/* ── Top Bar ───────────────────────────────────────────────────── */}
        <header style={css.topBar} role="banner">
          <div style={css.topLeft}>
            <button onClick={() => navigate(-1)} style={css.backBtn} aria-label="Go back">
              ← Back
            </button>
            <div style={css.boardInfo}>
              <span style={css.boardTitle}>{boardTitle}</span>
              <span style={css.boardSub}>
                {peerCount > 0
                  ? `${peerCount + 1} student${peerCount + 1 > 1 ? 's' : ''} online`
                  : 'Just you'}
              </span>
            </div>
          </div>

          <div style={css.topRight}>
            {/* Online avatars */}
            <div style={css.avatarRow} aria-label="Online students" role="list">
              {[{ name: userName, color: myColor.current }, ...Object.values(peers)].slice(0, 6).map((p, i) => (
                <div key={i} role="listitem"
                  style={{ ...css.avatar, background: p.color, zIndex: 10 - i }}
                  title={`${p.name}${i === 0 ? ' (you)' : ''}`}
                  aria-label={p.name}>
                  {p.name[0]?.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Status pill */}
            <div role="status" aria-live="polite"
              style={{ ...css.statusPill, background: connected ? '#D4EDDA' : '#F8D7DA',
                       color: connected ? '#155724' : '#721c24' }}>
              <span style={{ ...css.dot, background: connected ? '#28a745' : '#dc3545' }} />
              {connected ? 'Live' : 'Offline'}
            </div>

            {/* History button */}
            <button onClick={() => setShowHistory((v) => !v)} style={css.topBtn}
              aria-pressed={showHistory} aria-label="Toggle change history (H)">
              📋 History {history.length > 0 && <span style={css.badge}>{history.length}</span>}
            </button>

            {/* Help */}
            <button onClick={() => setShowHelp((v) => !v)} style={css.topBtn}
              aria-label="Keyboard shortcuts help (?)">
              ⌨️
            </button>
          </div>
        </header>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={css.body}>

          {/* ── Left Toolbar ──────────────────────────────────────────── */}
          <aside style={css.toolbar} role="toolbar" aria-label="Drawing tools" aria-orientation="vertical">

            {/* Tools */}
            <fieldset style={css.toolSection} aria-label="Tools">
              <legend style={css.sectionLabel}>TOOLS</legend>
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => setTool(t.id)}
                  aria-pressed={tool === t.id}
                  aria-label={`${t.label} tool (keyboard: ${t.key})`}
                  title={`${t.label} — ${t.desc} [${t.key}]`}
                  style={{ ...css.toolBtn, ...(tool === t.id ? css.toolActive : {}) }}>
                  <span style={css.toolIcon} aria-hidden="true">{t.icon}</span>
                  <span style={css.toolLabel}>{t.label}</span>
                  <span style={css.toolKey} aria-hidden="true">{t.key}</span>
                </button>
              ))}
            </fieldset>

            <div style={css.divider} role="separator" />

            {/* Colours */}
            <fieldset style={css.toolSection} aria-label="Colours">
              <legend style={css.sectionLabel}>COLOR</legend>
              <div style={css.colorGrid} role="radiogroup" aria-label="Choose drawing color">
                {COLORS.map((c) => (
                  <button key={c.hex} onClick={() => setColor(c.hex)}
                    role="radio" aria-checked={color === c.hex}
                    aria-label={c.name}
                    title={c.name}
                    style={{
                      ...css.colorBtn,
                      background: c.hex,
                      outline: color === c.hex ? `3px solid #E63946` : '2px solid rgba(0,0,0,0.12)',
                      transform: color === c.hex ? 'scale(1.25)' : 'scale(1)',
                    }} />
                ))}
              </div>
              {/* Current colour preview */}
              <div style={css.colorPreview}>
                <div style={{ ...css.colorDot, background: color }} aria-hidden="true" />
                <span style={css.colorName} aria-live="polite">
                  {COLORS.find((c) => c.hex === color)?.name || 'Custom'}
                </span>
              </div>
            </fieldset>

            <div style={css.divider} role="separator" />

            {/* Stroke size */}
            <fieldset style={css.toolSection} aria-label="Stroke size">
              <legend style={css.sectionLabel}>SIZE</legend>
              {SIZES.map((s) => (
                <button key={s.value} onClick={() => setSize(s.value)}
                  aria-pressed={size === s.value}
                  aria-label={`Size ${s.label}`}
                  style={{ ...css.sizeBtn, ...(size === s.value ? css.sizeActive : {}) }}>
                  <div style={{ width: s.value * 2.2, height: s.value * 2.2,
                                borderRadius: '50%', background: color, margin: 'auto',
                                minWidth: 4, minHeight: 4 }}
                       aria-hidden="true" />
                  <span style={css.sizeLabel}>{s.label}</span>
                </button>
              ))}
            </fieldset>

            <div style={{ flex: 1 }} />

            {/* Actions */}
            <fieldset style={css.toolSection} aria-label="Actions">
              <legend style={css.sectionLabel}>ACTIONS</legend>
              <button onClick={handleUndo}
                style={{ ...css.actionBtn, color: '#1C1C2E' }}
                aria-label="Undo last action (Ctrl+Z)"
                title="Undo (Ctrl+Z)">
                <span aria-hidden="true">↩</span> Undo
              </button>
              <button onClick={handleClear}
                style={{ ...css.actionBtn, color: '#E63946' }}
                aria-label="Clear entire board"
                title="Clear board — affects all students">
                <span aria-hidden="true">🗑</span> Clear
              </button>
            </fieldset>
          </aside>

          {/* ── Canvas ──────────────────────────────────────────────────── */}
          <div style={css.canvasWrap}>
            <canvas ref={canvasRef} style={css.canvas}
              aria-label="Drawing canvas — use toolbar tools to draw"
              role="img"
              tabIndex={0}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={(e) => { e.preventDefault(); handlePointerDown(e); }}
              onTouchMove={(e)  => { e.preventDefault(); handlePointerMove(e); }}
              onTouchEnd={(e)   => { e.preventDefault(); handlePointerUp(e);   }}
            />

            {/* Tool indicator */}
            <div style={css.toolIndicator} aria-hidden="true">
              <span>{TOOLS.find((t) => t.id === tool)?.icon}</span>
              {' '}
              {TOOLS.find((t) => t.id === tool)?.label}
            </div>

            {/* Remote cursors */}
            {Object.entries(remoteCursors).map(([sid, c]) => (
              <div key={sid} aria-hidden="true"
                style={{ ...css.cursor, left: c.x, top: c.y }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M0 0L0 13L4.5 8.5L7.5 15.5L9.5 14.5L6.5 7.5L13 7.5Z"
                        fill={c.color} stroke="#fff" strokeWidth="0.8" />
                </svg>
                <span style={{ ...css.cursorLabel, background: c.color }}>{c.name}</span>
              </div>
            ))}

            {/* Sticky notes */}
            {stickyNotes.map((note) => (
              <StickyNote key={note.id} note={note} socketRef={socketRef}
                onEdit={(text) => setStickyNotes((ns) => ns.map((s) => s.id === note.id ? { ...s, text } : s))}
                onMove={(x, y) => setStickyNotes((ns) => ns.map((s) => s.id === note.id ? { ...s, x, y } : s))} />
            ))}

            {/* Text input overlay */}
            {textInput.active && (
              <input autoFocus value={textInput.value}
                onChange={(e) => setTextInput((t) => ({ ...t, value: e.target.value }))}
                onBlur={commitText}
                onKeyDown={(e) => e.key === 'Enter' && commitText()}
                aria-label="Type text to add to canvas, press Enter to confirm"
                style={{
                  ...css.textOverlay,
                  left: textInput.x, top: textInput.y,
                  color, fontSize: size * 5 + 10,
                }} />
            )}
          </div>

          {/* ── History Panel ──────────────────────────────────────────── */}
          {showHistory && (
            <aside style={css.historyPanel} role="complementary" aria-label="Change history">
              <div style={css.historyHead}>
                <span style={css.historyTitle}>📋 Change History</span>
                <button onClick={() => setShowHistory(false)} style={css.closeBtn}
                  aria-label="Close history panel">✕</button>
              </div>

              {history.length === 0 ? (
                <div style={css.historyEmpty}>
                  <span style={{ fontSize: 32 }}>🖊</span>
                  <p>No changes yet.<br />Start drawing!</p>
                </div>
              ) : (
                <ol style={css.historyList} aria-label="List of changes">
                  {history.map((entry) => (
                    <li key={entry.id} style={css.historyItem}>
                      {/* Author avatar */}
                      <div style={{ ...css.histAvatar, background: entry.authorColor }}
                           aria-hidden="true">
                        {entry.authorName[0]?.toUpperCase()}
                      </div>
                      {/* Entry text */}
                      <div style={css.histBody}>
                        <div style={css.histTop}>
                          <span style={css.histAuthor}>{entry.authorName}</span>
                          <span style={css.histTime}
                                aria-label={`${Math.floor((Date.now() - entry.timestamp)/1000)} seconds ago`}>
                            {relTime(entry.timestamp)}
                          </span>
                        </div>
                        <div style={css.histDesc}>
                          <span aria-hidden="true">{HISTORY_ICONS[entry.type] || '✏️'}</span>
                          {' '}{entry.description}
                        </div>
                      </div>
                    </li>
                  ))}
                  <div ref={historyEndRef} />
                </ol>
              )}
            </aside>
          )}
        </div>

        {/* ── Keyboard Shortcut Help Modal ──────────────────────────────── */}
        {showHelp && (
          <div style={css.overlay} role="dialog" aria-modal="true"
               aria-labelledby="help-title"
               onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}>
            <div style={css.helpBox}>
              <div style={css.helpHead}>
                <h2 id="help-title" style={css.helpTitle}>Keyboard Shortcuts</h2>
                <button onClick={() => setShowHelp(false)} style={css.closeBtn}
                  aria-label="Close shortcuts">✕</button>
              </div>
              <table style={css.helpTable} role="table">
                <thead>
                  <tr>
                    <th style={css.helpTh} scope="col">Key</th>
                    <th style={css.helpTh} scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map((t) => (
                    <tr key={t.id}>
                      <td style={css.helpKey}><kbd style={css.kbd}>{t.key}</kbd></td>
                      <td style={css.helpAct}>{t.icon} {t.label}</td>
                    </tr>
                  ))}
                  <tr><td style={css.helpKey}><kbd style={css.kbd}>Ctrl+Z</kbd></td><td style={css.helpAct}>↩ Undo</td></tr>
                  <tr><td style={css.helpKey}><kbd style={css.kbd}>H</kbd></td><td style={css.helpAct}>📋 Toggle History</td></tr>
                  <tr><td style={css.helpKey}><kbd style={css.kbd}>?</kbd></td><td style={css.helpAct}>⌨️ This help</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Sticky Note sub-component ─────────────────────────────────────────────────
function StickyNote({ note, socketRef, onEdit, onMove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(note.text);
  const [pos, setPos]         = useState({ x: note.x, y: note.y });
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    if (editing) return;
    dragging.current = true;
    offset.current   = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const onMouseUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onMove(pos.x, pos.y);
    socketRef.current?.emit('wb:sticky-move', { id: note.id, x: pos.x, y: pos.y });
  };

  const save = () => {
    setEditing(false);
    onEdit(text);
    socketRef.current?.emit('wb:sticky-edit', { id: note.id, text });
  };

  const bg = note.color + '18';

  return (
    <div
      role="note"
      aria-label={`Sticky note by ${note.authorName}: ${text}`}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      style={{ ...css.sticky, left: pos.x, top: pos.y,
               background: bg, borderColor: note.color,
               cursor: editing ? 'text' : 'grab' }}>
      <div style={css.stickyHead}>
        <span style={{ fontSize: 10, color: note.color, fontWeight: 700 }}>
          📌 {note.authorName}
        </span>
        <button onClick={() => setEditing(true)}
          style={css.stickyEdit}
          aria-label="Edit this sticky note">✎</button>
      </div>
      {editing ? (
        <textarea autoFocus value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          aria-label="Sticky note text"
          style={css.stickyTA} />
      ) : (
        <p style={css.stickyText}>{text}</p>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const css = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#F5F0E8',
    fontFamily: "'DM Mono', 'Courier New', monospace",
    overflow: 'hidden',
  },

  // Top bar
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 52, background: '#1C1C2E',
    color: '#F5F0E8', flexShrink: 0, gap: 12,
    borderBottom: '3px solid #E63946',
  },
  topLeft:    { display: 'flex', alignItems: 'center', gap: 14 },
  topRight:   { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: {
    background: 'transparent', border: '1px solid rgba(245,240,232,0.3)',
    color: '#F5F0E8', borderRadius: 6, padding: '5px 12px',
    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  boardInfo:  { display: 'flex', flexDirection: 'column', gap: 1 },
  boardTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 },
  boardSub:   { fontSize: 10, opacity: 0.55, letterSpacing: 0.5 },

  avatarRow: { display: 'flex', gap: 0 },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontSize: 11, fontWeight: 700, border: '2px solid #1C1C2E',
    marginLeft: -6, transition: 'transform 0.15s', cursor: 'default',
  },

  statusPill: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px',
    borderRadius: 20, fontSize: 11, fontWeight: 600,
  },
  dot: { width: 7, height: 7, borderRadius: '50%' },

  topBtn: {
    background: 'rgba(245,240,232,0.08)', border: '1px solid rgba(245,240,232,0.15)',
    color: '#F5F0E8', borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
    fontSize: 12, fontFamily: 'inherit', transition: 'background 0.15s',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  badge: {
    background: '#E63946', color: '#fff', borderRadius: 10,
    padding: '1px 6px', fontSize: 10, fontWeight: 700,
  },

  // Body
  body: { display: 'flex', flex: 1, overflow: 'hidden' },

  // Toolbar
  toolbar: {
    display: 'flex', flexDirection: 'column', gap: 0,
    padding: '12px 8px', background: '#fff', width: 80,
    borderRight: '1px solid #E8E3D8', flexShrink: 0,
    overflowY: 'auto',
  },
  toolSection: { border: 'none', padding: 0, margin: '0 0 4px', display: 'flex', flexDirection: 'column', gap: 3 },
  sectionLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: '#AAA',
    marginBottom: 5, textTransform: 'uppercase', padding: 0,
  },
  toolBtn: {
    width: '100%', border: '1.5px solid transparent', borderRadius: 8,
    background: 'transparent', cursor: 'pointer', padding: '7px 4px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    transition: 'all 0.12s', fontFamily: 'inherit',
  },
  toolActive: {
    background: '#1C1C2E', border: '1.5px solid #E63946',
    boxShadow: '0 2px 8px rgba(230,57,70,0.25)',
  },
  toolIcon:  { fontSize: 16, lineHeight: 1 },
  toolLabel: { fontSize: 8, fontWeight: 600, letterSpacing: 0.3, color: 'inherit', opacity: 0.75 },
  toolKey:   { fontSize: 7, opacity: 0.4, letterSpacing: 0.5 },

  divider: { height: 1, background: '#E8E3D8', margin: '8px 0' },

  colorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 },
  colorBtn: {
    width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', padding: 0,
    transition: 'transform 0.12s, outline 0.12s',
  },
  colorPreview: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 },
  colorDot:     { width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)' },
  colorName:    { fontSize: 9, opacity: 0.6 },

  sizeBtn: {
    width: '100%', border: '1.5px solid transparent', borderRadius: 7,
    background: 'transparent', cursor: 'pointer', padding: '6px 4px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    fontFamily: 'inherit',
  },
  sizeActive: { background: '#F5F0E8', border: '1.5px solid #1C1C2E' },
  sizeLabel:  { fontSize: 8, opacity: 0.5 },

  actionBtn: {
    width: '100%', border: '1.5px solid currentColor', borderRadius: 7,
    background: 'transparent', cursor: 'pointer', padding: '7px 4px',
    fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: 'all 0.12s', marginBottom: 3,
  },

  // Canvas
  canvasWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  canvas: {
    display: 'block', width: '100%', height: '100%',
    cursor: 'crosshair', touchAction: 'none',
    background: '#FDFAF4',
  },

  toolIndicator: {
    position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(28,28,46,0.75)', color: '#F5F0E8',
    padding: '5px 14px', borderRadius: 20, fontSize: 12, pointerEvents: 'none',
    backdropFilter: 'blur(4px)', letterSpacing: 0.5,
  },

  // Cursors
  cursor: { position: 'absolute', pointerEvents: 'none', zIndex: 50, transition: 'left 60ms, top 60ms' },
  cursorLabel: {
    position: 'absolute', left: 16, top: 0, fontSize: 10, color: '#fff',
    padding: '2px 6px', borderRadius: 5, whiteSpace: 'nowrap', fontWeight: 600,
  },

  // Text input overlay
  textOverlay: {
    position: 'absolute', border: 'none', outline: '2px dashed #E63946',
    background: 'rgba(253,250,244,0.7)', fontFamily: "'DM Mono', monospace",
    minWidth: 140, zIndex: 40, padding: '2px 4px',
  },

  // Sticky notes
  sticky: {
    position: 'absolute', width: 165, minHeight: 95,
    borderRadius: 6, border: '2px solid', padding: 8,
    zIndex: 30, boxShadow: '4px 4px 12px rgba(0,0,0,0.1)',
    userSelect: 'none',
  },
  stickyHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  stickyEdit:  { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, padding: 0 },
  stickyText:  { margin: 0, fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word', fontFamily: "'DM Mono', monospace" },
  stickyTA: {
    width: '100%', minHeight: 58, border: 'none', background: 'transparent',
    fontFamily: "'DM Mono', monospace", fontSize: 12, resize: 'vertical',
    outline: 'none', lineHeight: 1.5,
  },

  // History panel
  historyPanel: {
    width: 280, background: '#fff', borderLeft: '1px solid #E8E3D8',
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'hidden',
  },
  historyHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px 10px', borderBottom: '1px solid #E8E3D8',
  },
  historyTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: '#1C1C2E' },
  closeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 15, color: '#999', padding: 4,
  },
  historyEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    flex: 1, color: '#aaa', textAlign: 'center', gap: 8, padding: 24, fontSize: 13,
  },
  historyList: {
    listStyle: 'none', margin: 0, padding: '8px 0',
    overflowY: 'auto', flex: 1,
  },
  historyItem: {
    display: 'flex', gap: 10, padding: '9px 16px',
    borderBottom: '1px solid #F5F0E8', transition: 'background 0.1s',
  },
  histAvatar: {
    width: 28, height: 28, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  histBody:  { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  histTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  histAuthor:{ fontSize: 11, fontWeight: 700, color: '#1C1C2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  histTime:  { fontSize: 9, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 },
  histDesc:  { fontSize: 11, color: '#666', lineHeight: 1.4 },

  // Help modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(28,28,46,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    backdropFilter: 'blur(3px)',
  },
  helpBox: {
    background: '#fff', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  helpHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  helpTitle:{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, margin: 0, color: '#1C1C2E' },
  helpTable:{ width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  helpTh:   { textAlign: 'left', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', padding: '4px 8px' },
  helpKey:  { padding: '5px 8px', width: 110, verticalAlign: 'middle' },
  helpAct:  { padding: '5px 8px', color: '#444', verticalAlign: 'middle' },
  kbd: {
    background: '#F5F0E8', border: '1px solid #ddd', borderRadius: 5,
    padding: '2px 8px', fontSize: 11, fontFamily: "'DM Mono', monospace",
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
};
