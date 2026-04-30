import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COURSES = ['CSE310', 'CSE331', 'CSE360', 'CSE401', 'CSE421', 'CSE440', 'CSE446', 'CSE450'];
const DAYS    = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS   = ['morning', 'afternoon', 'evening', 'night'];
const GOALS   = ['exam-prep', 'project-help', 'concept-review', 'homework', 'research'];
const STYLES  = [
  { value: 'collaborative',           label: '🤝 Collaborative',        desc: 'Work together in real-time' },
  { value: 'individual-then-discuss', label: '📚 Solo then Discuss',    desc: 'Work alone, then sync up' },
  { value: 'lecture-style',           label: '🎓 Lecture Style',        desc: 'One person explains to others' },
  { value: 'problem-solving',         label: '🧩 Problem Solving',      desc: 'Tackle problems as a group' },
];

/* ─── API helper ─────────────────────────────────────────────────────────── */
// ✅ FIX: reads userId from localStorage and appends to every request
//         (project uses no JWT — userId stored in localStorage after login)
function apiFetch(path, opts = {}) {
  const userId = localStorage.getItem('userId');
  const url = path.includes('?')
    ? `${API}${path}&userId=${userId}`
    : `${API}${path}?userId=${userId}`;

  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then((r) => r.json());
}

function apiPost(path, body = {}) {
  const userId = localStorage.getItem('userId');
  return fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...body }),
  }).then((r) => r.json());
}

function apiPatch(path, body = {}) {
  const userId = localStorage.getItem('userId');
  const name   = localStorage.getItem('userName') || 'Student';
  return fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, ...body }),
  }).then((r) => r.json());
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function StudyGroupsPage() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState('myGroups');
  const [myGroups, setMyGroups]   = useState([]);
  const [available, setAvailable] = useState([]);
  const [prefs, setPrefs]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [matching, setMatching]   = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [g, a, p] = await Promise.all([
        apiFetch('/api/study-groups'),
        apiFetch('/api/study-groups/available'),
        apiFetch('/api/study-groups/my-preferences'),
      ]);
      setMyGroups(g.groups   || []);
      setAvailable(a.groups  || []);
      setPrefs(p.preferences || null);
    } catch (e) {
      console.error('StudyGroups loadAll error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunMatching() {
    setMatching(true);
    setMatchResult(null);
    try {
      const r = await apiPost('/api/study-groups/run-matching');
      setMatchResult(r);
      if (r.formed > 0) loadAll();
    } finally {
      setMatching(false);
    }
  }

  async function handleJoin(groupId) {
    const name  = localStorage.getItem('userName') || 'Student';
    await apiPost(`/api/study-groups/join/${groupId}`, { name });
    loadAll();
  }

  async function handleLeave(groupId) {
    if (!window.confirm('Leave this study group?')) return;
    await apiPost(`/api/study-groups/leave/${groupId}`);
    loadAll();
  }

  async function handleSavePrefs(data) {
    await apiPatch('/api/study-groups/my-preferences', data);
    await loadAll();
    setTab('myGroups');
  }

  if (loading) return <Loading />;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⬡ Study Groups</h1>
          <p style={s.subtitle}>Auto-matched by course, schedule & study style</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
          <button onClick={handleRunMatching} disabled={matching} style={s.matchBtn}>
            {matching ? '⟳ Matching…' : '⚡ Auto-Match Me'}
          </button>
        </div>
      </div>

      {/* Match result banner */}
      {matchResult && (
        <div style={{ ...s.banner, background: matchResult.formed > 0 ? '#d4edda' : '#fff3cd' }}>
          {matchResult.formed > 0
            ? `✅ You've been placed into ${matchResult.formed} new study group${matchResult.formed > 1 ? 's' : ''}!`
            : `ℹ️ ${matchResult.message || 'No new groups formed — check your preferences.'}`}
          <button onClick={() => setMatchResult(null)} style={s.bannerClose}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: 'myGroups',     label: `My Groups (${myGroups.length})` },
          { key: 'discover',     label: `Discover (${available.length})` },
          { key: 'preferences',  label: '⚙ Preferences' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={s.content}>
        {tab === 'myGroups' && (
          myGroups.length === 0
            ? <Empty icon="🔬" text="You're not in any groups yet. Hit Auto-Match or browse Discover!" />
            : <div style={s.grid}>
                {myGroups.map((g) => (
                  <GroupCard key={g._id} group={g} isMember
                    onWhiteboard={() => navigate(`/whiteboard/${g.whiteboardRoomId}`)}
                    onMeeting={() => navigate(`/room/${g.meetingRoomId}`)}
                    onLeave={() => handleLeave(g._id)} />
                ))}
              </div>
        )}

        {tab === 'discover' && (
          available.length === 0
            ? <Empty icon="🌐" text="No open groups for your courses right now. Run Auto-Match to create some!" />
            : <div style={s.grid}>
                {available.map((g) => (
                  <GroupCard key={g._id} group={g} onJoin={() => handleJoin(g._id)} />
                ))}
              </div>
        )}

        {tab === 'preferences' && (
          <PreferencesForm initial={prefs} onSave={handleSavePrefs} />
        )}
      </div>
    </div>
  );
}

/* ─── Group Card ─────────────────────────────────────────────────────────── */
function GroupCard({ group, isMember, onJoin, onLeave, onWhiteboard, onMeeting }) {
  const statusColor = { forming:'#f39c12', active:'#2ecc71', completed:'#95a5a6', dissolved:'#e74c3c' };
  const avatarColors = ['#e94560','#0f3460','#533483','#2ecc71','#f39c12','#3498db'];
  const full = group.members.length >= group.maxSize;

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <span style={s.courseTag}>{group.course}</span>
        <span style={{ ...s.statusBadge, background: statusColor[group.status] || '#aaa' }}>
          {group.status}
        </span>
      </div>
      <h3 style={s.cardTitle}>{group.name}</h3>
      {group.courseTitle && <p style={s.cardSub}>{group.courseTitle}</p>}

      <div style={s.memberRow}>
        {group.members.map((m, i) => (
          <div key={i} style={{ ...s.avatar, background: avatarColors[i % avatarColors.length] }} title={m.name}>
            {m.name?.[0]?.toUpperCase() || '?'}
            {m.role === 'leader' && <span style={s.crown}>👑</span>}
          </div>
        ))}
        <span style={s.memberCount}>{group.members.length}/{group.maxSize}</span>
      </div>

      {group.matchFactors?.studyStyle && (
        <div style={s.tagRow}>
          <span style={s.tag}>📖 {group.matchFactors.studyStyle}</span>
          {(group.matchFactors.sharedGoals || []).slice(0, 2).map((g) => (
            <span key={g} style={s.tag}>{g}</span>
          ))}
        </div>
      )}

      <div style={s.cardActions}>
        {isMember ? (
          <>
            <button onClick={onWhiteboard} style={s.btnPrimary}>🖊 Whiteboard</button>
            <button onClick={onMeeting}    style={s.btnSec}>📹 Meet</button>
            <button onClick={onLeave}      style={s.btnDanger}>Leave</button>
          </>
        ) : (
          <button onClick={onJoin} disabled={full}
            style={{ ...s.btnPrimary, width:'100%', opacity: full ? 0.5 : 1 }}>
            {full ? 'Group Full' : '+ Join Group'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Preferences Form ───────────────────────────────────────────────────── */
function PreferencesForm({ initial, onSave }) {
  const [courses,      setCourses]      = useState(initial?.enrolledCourses || []);
  const [style,        setStyle]        = useState(initial?.studyStyle      || 'collaborative');
  const [goals,        setGoals]        = useState(initial?.goals           || []);
  const [availability, setAvailability] = useState(
    initial?.availableTimes || DAYS.map((d) => ({ day: d, slots: [] }))
  );
  const [willingToLead, setWillingToLead] = useState(initial?.willingToLead || false);
  const [optIn,         setOptIn]         = useState(initial?.optIn !== false);
  const [saving,        setSaving]        = useState(false);

  const toggleCourse = (c) => setCourses((cs) => cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]);
  const toggleGoal   = (g) => setGoals((gs)   => gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]);

  const toggleSlot = (day, slot) => {
    setAvailability((av) => av.map((d) => d.day !== day ? d : {
      ...d, slots: d.slots.includes(slot) ? d.slots.filter((sl) => sl !== slot) : [...d.slots, slot],
    }));
  };

  const getSlots = (day) => availability.find((d) => d.day === day)?.slots || [];

  const handleSave = async () => {
    if (courses.length === 0) { alert('Please select at least one course.'); return; }
    setSaving(true);
    await onSave({ enrolledCourses: courses, studyStyle: style, goals, availableTimes: availability, willingToLead, optIn });
    setSaving(false);
  };

  return (
    <div style={s.prefWrap}>
      <h2 style={s.prefTitle}>⚙ Matching Preferences</h2>
      <p style={s.prefSub}>These settings determine how you're matched with study groups.</p>

      <label style={s.checkRow}>
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        <span style={{ marginLeft:8 }}>Enable automatic matching</span>
      </label>

      <Section title="📚 Enrolled Courses">
        <div style={s.chipRow}>
          {COURSES.map((c) => (
            <button key={c} onClick={() => toggleCourse(c)}
              style={{ ...s.chip, ...(courses.includes(c) ? s.chipOn : {}) }}>{c}</button>
          ))}
        </div>
      </Section>

      <Section title="🧠 Study Style">
        <div style={s.styleGrid}>
          {STYLES.map((st) => (
            <button key={st.value} onClick={() => setStyle(st.value)}
              style={{ ...s.styleCard, ...(style === st.value ? s.styleOn : {}) }}>
              <div style={{ fontWeight:600 }}>{st.label}</div>
              <div style={{ fontSize:11, opacity:0.7, marginTop:2 }}>{st.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="🎯 Study Goals">
        <div style={s.chipRow}>
          {GOALS.map((g) => (
            <button key={g} onClick={() => toggleGoal(g)}
              style={{ ...s.chip, ...(goals.includes(g) ? s.chipOn : {}) }}>{g}</button>
          ))}
        </div>
      </Section>

      <Section title="🕐 Weekly Availability">
        <div style={{ overflowX:'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th} />
                {SLOTS.map((sl) => <th key={sl} style={s.th}>{sl}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td style={s.td}><span style={{ fontSize:12 }}>{day.slice(0,3)}</span></td>
                  {SLOTS.map((slot) => (
                    <td key={slot} style={s.td}>
                      <button onClick={() => toggleSlot(day, slot)}
                        style={{ ...s.slotBtn, ...(getSlots(day).includes(slot) ? s.slotOn : {}) }}>
                        {getSlots(day).includes(slot) ? '✓' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <label style={s.checkRow}>
        <input type="checkbox" checked={willingToLead} onChange={(e) => setWillingToLead(e.target.checked)} />
        <span style={{ marginLeft:8 }}>I'm willing to be a group leader</span>
      </label>

      <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
        {saving ? 'Saving…' : '✓ Save Preferences'}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <h3 style={{ fontSize:13, fontWeight:700, marginBottom:10, color:'#1a1a2e', letterSpacing:0.5 }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'#888' }}>
      <div style={{ fontSize:46 }}>{icon}</div>
      <p style={{ marginTop:12, maxWidth:320, margin:'12px auto 0' }}>{text}</p>
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <p style={{ color:'#888' }}>Loading study groups…</p>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  page:        { maxWidth:1100, margin:'0 auto', padding:'28px 20px', fontFamily:"'Segoe UI', system-ui, sans-serif" },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 },
  title:       { margin:0, fontSize:26, fontWeight:800, color:'#1a1a2e' },
  subtitle:    { margin:'4px 0 0', color:'#666', fontSize:13 },
  backBtn:     { padding:'9px 16px', background:'transparent', border:'1px solid #ccc', borderRadius:8, cursor:'pointer', fontSize:13 },
  matchBtn:    { padding:'9px 20px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 },
  banner:      { padding:'11px 15px', borderRadius:8, marginBottom:16, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' },
  bannerClose: { border:'none', background:'transparent', cursor:'pointer', fontSize:16 },
  tabs:        { display:'flex', gap:2, marginBottom:20, borderBottom:'2px solid #e8e8e8' },
  tab:         { padding:'8px 18px', border:'none', background:'none', cursor:'pointer', fontWeight:600, color:'#888', fontSize:13, borderBottom:'2px solid transparent', marginBottom:-2 },
  tabActive:   { color:'#1a1a2e', borderBottomColor:'#e94560' },
  content:     {},
  grid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(285px, 1fr))', gap:18 },
  card:        { background:'#fff', border:'1px solid #eee', borderRadius:12, padding:18, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  cardTop:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  courseTag:   { background:'#1a1a2e', color:'#fff', padding:'2px 10px', borderRadius:6, fontSize:11, fontWeight:700, letterSpacing:1 },
  statusBadge: { padding:'2px 10px', borderRadius:10, fontSize:11, color:'#fff', fontWeight:600 },
  cardTitle:   { margin:'0 0 2px', fontSize:16, fontWeight:700, color:'#1a1a2e' },
  cardSub:     { margin:'0 0 12px', fontSize:12, color:'#888' },
  memberRow:   { display:'flex', alignItems:'center', gap:5, marginBottom:10 },
  avatar:      { width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, position:'relative', flexShrink:0 },
  crown:       { position:'absolute', top:-8, right:-4, fontSize:10 },
  memberCount: { fontSize:12, color:'#999', marginLeft:4 },
  tagRow:      { display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 },
  tag:         { background:'#f0f0f0', padding:'2px 8px', borderRadius:12, fontSize:11, color:'#555' },
  cardActions: { display:'flex', gap:7, marginTop:10 },
  btnPrimary:  { flex:1, padding:'8px 0', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:600 },
  btnSec:      { flex:1, padding:'8px 0', background:'#f0f4ff', color:'#1a1a2e', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:600 },
  btnDanger:   { padding:'8px 12px', background:'transparent', color:'#e94560', border:'1px solid #e94560', borderRadius:7, cursor:'pointer', fontSize:12 },
  prefWrap:    { maxWidth:680, background:'#fff', padding:28, borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' },
  prefTitle:   { margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#1a1a2e' },
  prefSub:     { margin:'0 0 22px', color:'#777', fontSize:13 },
  checkRow:    { display:'flex', alignItems:'center', marginBottom:20, cursor:'pointer', fontSize:14 },
  chipRow:     { display:'flex', flexWrap:'wrap', gap:8 },
  chip:        { padding:'6px 14px', border:'2px solid #e0e0e0', borderRadius:20, background:'#fff', cursor:'pointer', fontSize:13, color:'#555' },
  chipOn:      { background:'#1a1a2e', borderColor:'#1a1a2e', color:'#fff' },
  styleGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  styleCard:   { padding:'10px 13px', border:'2px solid #e0e0e0', borderRadius:10, background:'#fff', cursor:'pointer', textAlign:'left', fontSize:13 },
  styleOn:     { border:'2px solid #e94560', background:'#fff5f5' },
  table:       { borderCollapse:'collapse', fontSize:12, minWidth:300 },
  th:          { padding:'6px 10px', textAlign:'center', color:'#888', fontWeight:600, textTransform:'capitalize' },
  td:          { padding:'4px 8px', textAlign:'center' },
  slotBtn:     { width:30, height:30, border:'2px solid #ddd', borderRadius:6, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', margin:'auto', fontSize:12 },
  slotOn:      { background:'#1a1a2e', borderColor:'#1a1a2e', color:'#fff' },
  saveBtn:     { marginTop:16, padding:'12px 28px', background:'#e94560', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14, width:'100%' },
};
