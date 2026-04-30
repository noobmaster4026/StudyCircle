const ROOM_MAX_HISTORY = 600;

const PALETTE = [
  '#e94560','#0f9b8e','#f4a261','#6c63ff','#2ecc71',
  '#e67e22','#1abc9c','#9b59b6','#e74c3c','#3498db',
  '#f39c12','#16a085','#8e44ad','#c0392b','#27ae60',
];

/* ── In-memory store ────────────────────────────────────────────────────────
   rooms: Map<roomId, {
     strokes:  Object[],
     cursors:  Map<socketId, { x, y, color, name }>,
     history:  HistoryEntry[],
   }>
──────────────────────────────────────────────────────────────────────────── */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { strokes: [], cursors: new Map(), history: [] });
  }
  return rooms.get(roomId);
}

function assignColor(room) {
  const used = new Set([...room.cursors.values()].map((c) => c.color));
  return PALETTE.find((c) => !used.has(c)) || PALETTE[room.cursors.size % PALETTE.length];
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushHistory(room, { authorId, authorName, authorColor, actionType, description }) {
  const entry = {
    id: makeId(),
    authorId,
    authorName,
    authorColor,
    actionType,   // 'draw' | 'erase' | 'shape' | 'text' | 'sticky' | 'undo' | 'clear'
    description,
    timestamp: Date.now(),
  };
  room.history.push(entry);
  if (room.history.length > ROOM_MAX_HISTORY) {
    room.history.splice(0, room.history.length - ROOM_MAX_HISTORY);
  }
  return entry;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
function attachWhiteboardNamespace(io) {
  const wbNS = io.of('/whiteboard');

  wbNS.on('connection', (socket) => {
    let currentRoom = null;
    let userMeta    = { name: 'Anonymous', color: '#888' };

    /* JOIN ──────────────────────────────────────────────────────────────── */
    socket.on('wb:join', ({ roomId, userName }) => {
      currentRoom   = String(roomId || 'student-shared-board');
      userMeta.name = userName || 'Student';

      socket.join(currentRoom);
      const room   = getRoom(currentRoom);
      userMeta.color = assignColor(room);
      room.cursors.set(socket.id, { x: 0, y: 0, color: userMeta.color, name: userMeta.name });

      // Full state snapshot for the new joiner
      socket.emit('wb:init', {
        strokes:     room.strokes,
        history:     room.history,
        cursors:     Object.fromEntries(room.cursors),
        myColor:     userMeta.color,
        roomId:      currentRoom,
        onlineCount: room.cursors.size,
      });

      socket.to(currentRoom).emit('wb:user-joined', {
        socketId: socket.id, name: userMeta.name, color: userMeta.color,
        onlineCount: room.cursors.size,
      });

      console.log(`[WB] "${userMeta.name}" → room "${currentRoom}" (${room.cursors.size} online)`);
    });

    /* DISCONNECT ─────────────────────────────────────────────────────────── */
    socket.on('disconnect', () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      room.cursors.delete(socket.id);
      socket.to(currentRoom).emit('wb:user-left', { socketId: socket.id, onlineCount: room.cursors.size });
    });

    /* FREEHAND ──────────────────────────────────────────────────────────── */
    socket.on('wb:stroke-start', (data) => {
      if (!currentRoom) return;
      const stroke = {
        id: data.strokeId, tool: data.tool || 'pen', color: data.color,
        lineWidth: data.lineWidth || 2, points: [{ x: data.x, y: data.y }],
        authorId: socket.id, authorName: userMeta.name, timestamp: Date.now(),
      };
      getRoom(currentRoom).strokes.push(stroke);
      socket.to(currentRoom).emit('wb:stroke-start', { ...data, authorId: socket.id, authorName: userMeta.name });
    });

    socket.on('wb:stroke-move', (data) => {
      if (!currentRoom) return;
      const stroke = getRoom(currentRoom).strokes.find((s) => s.id === data.strokeId);
      if (stroke) stroke.points.push({ x: data.x, y: data.y });
      socket.to(currentRoom).emit('wb:stroke-move', data);
    });

    socket.on('wb:stroke-end', (data) => {
      if (!currentRoom) return;
      const room   = getRoom(currentRoom);
      const stroke = room.strokes.find((s) => s.id === data.strokeId);
      if (!stroke) return;
      const isErase = stroke.tool === 'eraser';
      const entry   = pushHistory(room, {
        authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
        actionType:  isErase ? 'erase' : 'draw',
        description: isErase ? 'erased part of the board' : 'drew a freehand stroke',
      });
      wbNS.to(currentRoom).emit('wb:history-entry', entry);
      socket.to(currentRoom).emit('wb:stroke-end', data);
    });

    /* SHAPES & TEXT ─────────────────────────────────────────────────────── */
    socket.on('wb:add-shape', (data) => {
      if (!currentRoom) return;
      const room  = getRoom(currentRoom);
      const shape = { ...data, authorId: socket.id, authorName: userMeta.name, timestamp: Date.now() };
      room.strokes.push(shape);

      const labels = { line: 'a line', rect: 'a rectangle', circle: 'a circle', text: 'text' };
      const entry  = pushHistory(room, {
        authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
        actionType:  data.tool === 'text' ? 'text' : 'shape',
        description: data.tool === 'text'
          ? `typed: "${String(data.text || '').slice(0, 50)}"`
          : `drew ${labels[data.tool] || 'a shape'}`,
      });

      wbNS.to(currentRoom).emit('wb:add-shape', shape);
      wbNS.to(currentRoom).emit('wb:history-entry', entry);
    });

    /* STICKY NOTES ──────────────────────────────────────────────────────── */
    socket.on('wb:sticky-add', (data) => {
      if (!currentRoom) return;
      const room = getRoom(currentRoom);
      const note = { ...data, type: 'sticky', authorId: socket.id, authorName: userMeta.name };
      room.strokes.push(note);
      const entry = pushHistory(room, {
        authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
        actionType: 'sticky', description: 'added a sticky note',
      });
      wbNS.to(currentRoom).emit('wb:sticky-add', note);
      wbNS.to(currentRoom).emit('wb:history-entry', entry);
    });

    socket.on('wb:sticky-move', (data) => {
      if (!currentRoom) return;
      const note = getRoom(currentRoom).strokes.find((s) => s.id === data.id);
      if (note) { note.x = data.x; note.y = data.y; }
      socket.to(currentRoom).emit('wb:sticky-move', data);
    });

    socket.on('wb:sticky-edit', (data) => {
      if (!currentRoom) return;
      const room = getRoom(currentRoom);
      const note = room.strokes.find((s) => s.id === data.id);
      if (note) note.text = data.text;
      const entry = pushHistory(room, {
        authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
        actionType: 'sticky',
        description: `edited sticky note: "${String(data.text || '').slice(0, 50)}"`,
      });
      socket.to(currentRoom).emit('wb:sticky-edit', data);
      wbNS.to(currentRoom).emit('wb:history-entry', entry);
    });

    /* UNDO ──────────────────────────────────────────────────────────────── */
    socket.on('wb:undo', () => {
      if (!currentRoom) return;
      const room = getRoom(currentRoom);
      for (let i = room.strokes.length - 1; i >= 0; i--) {
        if (room.strokes[i].authorId === socket.id) {
          const [removed] = room.strokes.splice(i, 1);
          const entry = pushHistory(room, {
            authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
            actionType: 'undo', description: 'undid their last action',
          });
          wbNS.to(currentRoom).emit('wb:undo', { id: removed.id });
          wbNS.to(currentRoom).emit('wb:history-entry', entry);
          break;
        }
      }
    });

    /* CLEAR ─────────────────────────────────────────────────────────────── */
    socket.on('wb:clear', () => {
      if (!currentRoom) return;
      const room = getRoom(currentRoom);
      room.strokes = [];
      const entry = pushHistory(room, {
        authorId: socket.id, authorName: userMeta.name, authorColor: userMeta.color,
        actionType: 'clear', description: 'cleared the entire board',
      });
      wbNS.to(currentRoom).emit('wb:clear');
      wbNS.to(currentRoom).emit('wb:history-entry', entry);
    });

    /* CURSOR ─────────────────────────────────────────────────────────────── */
    socket.on('wb:cursor', ({ x, y }) => {
      if (!currentRoom) return;
      const cursor = getRoom(currentRoom).cursors.get(socket.id);
      if (cursor) { cursor.x = x; cursor.y = y; }
      socket.to(currentRoom).emit('wb:cursor', { socketId: socket.id, x, y, name: userMeta.name, color: userMeta.color });
    });
  });

  console.log('[StudyCircle] /whiteboard namespace ready — open to all students.');
  return wbNS;
}

module.exports = { attachWhiteboardNamespace };