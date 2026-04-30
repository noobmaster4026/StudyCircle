/**
 * QuizzesPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Three-phase UI:
 *   1. GENERATOR  – topic input, difficulty, count, question type
 *   2. QUIZ       – question-by-question with keyboard shortcuts
 *   3. RESULTS    – score breakdown, per-question review, retry
 *
 * Aesthetic: terminal / command-line meets editorial dark mode.
 * Phosphor green on charcoal. Monospace precision. Confident.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ── Suggested topics ────────────────────────────────────────────── */
const SUGGESTIONS = [
  'Data Structures', 'Operating Systems', 'Computer Networks',
  'Database Systems', 'Machine Learning', 'Natural Language Processing',
  'Algorithms', 'Compiler Design', 'Linear Algebra', 'Statistics',
  'Software Engineering', 'Cybersecurity', 'Cloud Computing',
  'React.js', 'Python', 'JavaScript', 'Bangladesh History',
  'Thermodynamics', 'Organic Chemistry', 'Calculus',
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Beginner friendly',     color: '#22c55e' },
  { value: 'medium', label: 'Medium', desc: 'Intermediate level',    color: '#f59e0b' },
  { value: 'hard',   label: 'Hard',   desc: 'Advanced & in-depth',   color: '#ef4444' },
];

const Q_TYPES = [
  { value: 'mcq',       label: 'Multiple Choice', icon: '◉' },
  { value: 'truefalse', label: 'True / False',    icon: '⊤⊥' },
  { value: 'mixed',     label: 'Mixed',           icon: '⬡' },
];

const COUNTS = [3, 5, 8, 10, 15];

/* ── Tiny hooks ──────────────────────────────────────────────────── */
function useTypewriter(text, speed = 18, active = true) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, active]);
  return displayed;
}

function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const reset = () => setSeconds(0);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { seconds, fmt, reset };
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 1 — GENERATOR
═══════════════════════════════════════════════════════════════════ */
function Generator({ onQuizReady }) {
  const [topic,      setTopic]      = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count,      setCount]      = useState(5);
  const [qType,      setQType]      = useState('mcq');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [history,    setHistory]    = useState([]);
  const [showSugg,   setShowSugg]   = useState(false);
  const inputRef = useRef(null);
  const userId   = localStorage.getItem('userId');

  useEffect(() => {
    inputRef.current?.focus();
    if (userId) {
      fetch(`${API}/api/quiz/history?userId=${userId}`)
        .then(r => r.json())
        .then(d => setHistory(d.quizzes || []))
        .catch(() => {});
    }
  }, []);

  const filtered = SUGGESTIONS.filter(s =>
    topic ? s.toLowerCase().includes(topic.toLowerCase()) : true
  ).slice(0, 8);

  const generate = async () => {
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), difficulty, count, questionType: qType, userId }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      onQuizReady(data.quiz);
    } catch (err) {
      setError(err.message || 'Generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !loading) generate(); };

  return (
    <div style={g.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* noise texture overlay */}
      <div style={g.noise} aria-hidden="true" />

      {/* Header */}
      <header style={g.header}>
        <div style={g.logo}>
          <span style={g.logoBracket}>[</span>
          <span style={g.logoText}>QUIZ_GEN</span>
          <span style={g.logoBracket}>]</span>
        </div>
        <div style={g.headerRight}>
          <span style={g.statusDot} />
          <span style={g.statusText}>AI Ready · {MODEL_LABEL}</span>
        </div>
      </header>

      <main style={g.main}>
        {/* Left — form */}
        <section style={g.formPanel}>
          <div style={g.prompt}>
            <span style={g.promptSign}>~/studycircle$</span>
            <span style={g.promptCmd}> quiz generate</span>
          </div>

          <h1 style={g.title}>Generate a Quiz<span style={g.cursor}>_</span></h1>
          <p style={g.subtitle}>Enter any topic. The AI will craft custom questions in seconds.</p>

          {/* Topic input */}
          <div style={g.fieldWrap}>
            <label style={g.label} htmlFor="topic-input">TOPIC</label>
            <div style={g.inputWrap}>
              <span style={g.inputIcon} aria-hidden="true">⌕</span>
              <input
                id="topic-input"
                ref={inputRef}
                value={topic}
                onChange={e => { setTopic(e.target.value); setShowSugg(true); setError(''); }}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                onKeyDown={handleKey}
                placeholder="e.g. Data Structures, NLP, Calculus…"
                style={g.input}
                aria-label="Quiz topic"
                autoComplete="off"
              />
            </div>
            {/* Suggestions dropdown */}
            {showSugg && filtered.length > 0 && (
              <div style={g.sugg} role="listbox" aria-label="Topic suggestions">
                {filtered.map(s => (
                  <button key={s} role="option" onMouseDown={() => { setTopic(s); setShowSugg(false); }}
                    style={g.suggItem}>{s}</button>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div style={g.fieldWrap}>
            <label style={g.label}>DIFFICULTY</label>
            <div style={g.chipRow} role="radiogroup" aria-label="Difficulty">
              {DIFFICULTIES.map(d => (
                <button key={d.value} role="radio" aria-checked={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                  style={{ ...g.chip, ...(difficulty === d.value ? { ...g.chipOn, borderColor: d.color, color: d.color } : {}) }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block', marginRight: 6 }} />
                  {d.label}
                  <span style={g.chipSub}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div style={g.fieldWrap}>
            <label style={g.label}>NUMBER OF QUESTIONS</label>
            <div style={g.chipRow} role="radiogroup" aria-label="Question count">
              {COUNTS.map(c => (
                <button key={c} role="radio" aria-checked={count === c}
                  onClick={() => setCount(c)}
                  style={{ ...g.countChip, ...(count === c ? g.countOn : {}) }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Question type */}
          <div style={g.fieldWrap}>
            <label style={g.label}>QUESTION TYPE</label>
            <div style={g.chipRow} role="radiogroup" aria-label="Question type">
              {Q_TYPES.map(t => (
                <button key={t.value} role="radio" aria-checked={qType === t.value}
                  onClick={() => setQType(t.value)}
                  style={{ ...g.chip, ...(qType === t.value ? g.chipOn : {}) }}>
                  <span style={{ fontFamily: 'DM Mono', marginRight: 6 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={g.error} role="alert">⚠ {error}</div>}

          <button onClick={generate} disabled={loading || !topic.trim()}
            style={{ ...g.genBtn, opacity: (!topic.trim() || loading) ? 0.5 : 1 }}
            aria-label="Generate quiz">
            {loading ? (
              <span style={g.genBtnInner}>
                <span style={g.spinner} aria-hidden="true" /> Generating…
              </span>
            ) : (
              <span style={g.genBtnInner}>
                <span style={g.genBtnIcon}>⚡</span> Generate Quiz
                <span style={g.genBtnHint}>↵ Enter</span>
              </span>
            )}
          </button>

          {loading && (
            <div style={g.loadingLog} aria-live="polite">
              <LoadingLog topic={topic} count={count} />
            </div>
          )}
        </section>

        {/* Right — history */}
        <aside style={g.histPanel}>
          <div style={g.histHeader}>
            <span style={g.histTitle}>RECENT QUIZZES</span>
            <span style={g.histCount}>{history.length}</span>
          </div>
          {history.length === 0 ? (
            <div style={g.histEmpty}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>📋</span>
              <span style={{ fontSize: 12, opacity: 0.4, marginTop: 8 }}>No quizzes yet</span>
            </div>
          ) : history.map(h => (
            <div key={h.id} style={g.histItem}>
              <div style={g.histItemTop}>
                <span style={g.histTopic}>{h.topic}</span>
                {h.lastScore !== null && (
                  <span style={{ ...g.histScore, color: scoreColor(h.lastScore) }}>
                    {h.lastScore}%
                  </span>
                )}
              </div>
              <div style={g.histItemSub}>
                <span style={{ ...g.histDiff, color: DIFFICULTIES.find(d => d.value === h.difficulty)?.color }}>
                  {h.difficulty}
                </span>
                <span style={g.histDot}>·</span>
                <span style={g.histQ}>{h.totalQ}Q</span>
                <span style={g.histDot}>·</span>
                <span style={g.histDate}>{new Date(h.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}

const MODEL_LABEL = 'Llama 3.1 8B';
function scoreColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function LoadingLog({ topic, count }) {
  const steps = [
    `> Connecting to ${MODEL_LABEL}…`,
    `> Analysing topic: "${topic}"`,
    `> Crafting ${count} questions…`,
    `> Generating distractors…`,
    `> Writing explanations…`,
    `> Validating structure…`,
  ];
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setShown(s => Math.min(s + 1, steps.length)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, lineHeight: 2 }}>
      {steps.slice(0, shown).map((s, i) => (
        <div key={i} style={{ color: i === shown - 1 ? '#00FF88' : 'rgba(0,255,136,0.4)', transition: 'color 0.3s' }}>
          {s}{i === shown - 1 && <span style={g.cursor}>_</span>}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 2 — QUIZ INTERFACE
═══════════════════════════════════════════════════════════════════ */
function QuizInterface({ quiz, onFinish }) {
  const [current,  setCurrent]  = useState(0);
  const [answers,  setAnswers]  = useState({});   // { qIndex: selectedLabel }
  const [revealed, setRevealed] = useState(false); // show answer for current Q
  const { seconds, fmt, reset } = useTimer(true);
  const totalQ = quiz.questions.length;
  const q      = quiz.questions[current];
  const typed  = useTypewriter(q.question, 15, !revealed && Object.keys(answers).length <= current);

  const select = (label) => {
    if (revealed || answers[current] !== undefined) return;
    setAnswers(a => ({ ...a, [current]: label }));
    setRevealed(true);
  };

  const next = () => {
    if (current < totalQ - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
    } else {
      onFinish({ answers, timeTaken: seconds, quizId: quiz.id });
    }
  };

  // Keyboard: 1/2/3/4 or A/B/C/D to select, Enter/Space/→ to advance
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.key.toUpperCase();
      const opts = q.options.map(o => o.label);
      if (opts.includes(k)) { select(k); return; }
      const idx = parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < opts.length) { select(opts[idx]); return; }
      if ((k === 'ENTER' || k === ' ' || k === 'ARROWRIGHT') && revealed) { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, q]);

  const progress = ((current + (revealed ? 1 : 0)) / totalQ) * 100;
  const answered = answers[current];
  const isCorrect = answered === q.correct;

  return (
    <div style={qi.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={qi.noise} aria-hidden="true" />

      {/* Top bar */}
      <header style={qi.topBar}>
        <div style={qi.topLeft}>
          <span style={qi.quizTitle}>{quiz.title}</span>
          <span style={qi.diffBadge}>{quiz.difficulty}</span>
        </div>
        <div style={qi.topRight}>
          <span style={qi.timer} aria-label={`Time elapsed: ${fmt(seconds)}`}>⏱ {fmt(seconds)}</span>
          <span style={qi.qCount} aria-label={`Question ${current + 1} of ${totalQ}`}>
            {current + 1} / {totalQ}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div style={qi.progressWrap} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...qi.progressBar, width: `${progress}%` }} />
      </div>

      {/* Question */}
      <main style={qi.main}>
        <div style={qi.card}>
          <div style={qi.qNum}>Q{String(current + 1).padStart(2, '0')}</div>
          <p style={qi.qText} aria-live="polite">
            {typed || q.question}
            {typed.length < q.question.length && <span style={g.cursor}>_</span>}
          </p>

          {/* Options */}
          <div style={qi.options} role="group" aria-label="Answer options">
            {q.options.map((opt, i) => {
              const isSelected = answered === opt.label;
              const isRight    = opt.label === q.correct;
              let state = 'idle';
              if (revealed) {
                if (isRight) state = 'correct';
                else if (isSelected && !isRight) state = 'wrong';
              } else if (isSelected) state = 'selected';

              return (
                <button
                  key={opt.label}
                  onClick={() => select(opt.label)}
                  disabled={revealed && !isSelected && !isRight}
                  aria-pressed={isSelected}
                  aria-label={`Option ${opt.label}: ${opt.text}${state === 'correct' ? ' — Correct' : state === 'wrong' ? ' — Wrong' : ''}`}
                  style={{ ...qi.option, ...qi[`opt_${state}`] }}>
                  <span style={{ ...qi.optLabel, ...(state !== 'idle' ? qi[`lbl_${state}`] : {}) }}>
                    {opt.label}
                  </span>
                  <span style={qi.optText}>{opt.text}</span>
                  {revealed && isRight  && <span style={qi.optIcon} aria-hidden="true">✓</span>}
                  {revealed && isSelected && !isRight && <span style={qi.optIcon} aria-hidden="true">✗</span>}
                  {!revealed && (
                    <span style={qi.optKey} aria-hidden="true">[{i + 1}]</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <div style={{ ...qi.explanation, borderColor: isCorrect ? '#22c55e33' : '#ef444433',
                          background: isCorrect ? '#22c55e08' : '#ef444408' }}
              role="note" aria-label="Explanation">
              <div style={{ ...qi.explHeader, color: isCorrect ? '#22c55e' : '#ef4444' }}>
                {isCorrect ? '✓ Correct!' : `✗ Incorrect — Answer: ${q.correct}`}
              </div>
              <p style={qi.explText}>{q.explanation}</p>
            </div>
          )}

          {/* Next / Finish */}
          {revealed && (
            <button onClick={next} style={qi.nextBtn}
              aria-label={current < totalQ - 1 ? 'Next question' : 'See results'}>
              {current < totalQ - 1 ? (
                <><span>Next Question</span><span style={qi.nextHint}>[→ Enter]</span></>
              ) : (
                <><span>See Results ⟶</span></>
              )}
            </button>
          )}

          {!revealed && answered === undefined && (
            <p style={qi.hint} aria-hidden="true">
              Press <kbd style={qi.kbd}>A</kbd> <kbd style={qi.kbd}>B</kbd> <kbd style={qi.kbd}>C</kbd> <kbd style={qi.kbd}>D</kbd> or click an option
            </p>
          )}
        </div>

        {/* Mini progress map */}
        <div style={qi.miniMap} aria-hidden="true">
          {quiz.questions.map((_, i) => {
            const a = answers[i];
            const done = a !== undefined;
            const corr = done && a === quiz.questions[i].correct;
            return (
              <div key={i} style={{
                ...qi.miniDot,
                background: i === current ? '#00FF88'
                          : !done ? 'rgba(255,255,255,0.1)'
                          : corr ? '#22c55e33' : '#ef444433',
                border: i === current ? '1.5px solid #00FF88'
                      : done && corr ? '1.5px solid #22c55e'
                      : done ? '1.5px solid #ef4444'
                      : '1.5px solid rgba(255,255,255,0.15)',
              }} title={`Q${i + 1}`} />
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 3 — RESULTS
═══════════════════════════════════════════════════════════════════ */
function Results({ quiz, answers, timeTaken, onRetry, onNew }) {
  const userId = localStorage.getItem('userId');
  const totalQ = quiz.questions.length;
  const score  = quiz.questions.filter((q, i) => answers[i] === q.correct).length;
  const pct    = Math.round((score / totalQ) * 100);
  const [saved, setSaved] = useState(false);
  const [tab,   setTab]   = useState('summary'); // 'summary' | 'review'
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/quiz/save-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: quiz.id, userId, score, total: totalQ, timeTaken, answers }),
    })
      .then(r => r.json())
      .then(() => setSaved(true))
      .catch(() => {});
  }, []);

  const grade = pct >= 90 ? { label: 'EXCELLENT', color: '#00FF88', msg: 'Outstanding performance!' }
              : pct >= 75 ? { label: 'GREAT',     color: '#22c55e', msg: 'Well done!' }
              : pct >= 60 ? { label: 'GOOD',       color: '#f59e0b', msg: 'Decent result — review the misses.' }
              : pct >= 40 ? { label: 'FAIR',       color: '#f97316', msg: 'Keep practising.' }
              :             { label: 'NEEDS WORK',  color: '#ef4444', msg: 'Review the material and retry.' };

  const mins = Math.floor(timeTaken / 60), secs = timeTaken % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={r.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne+Mono&family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={r.noise} aria-hidden="true" />

      <header style={r.header}>
        <button onClick={() => navigate('/student')} style={r.backBtn}>← Dashboard</button>
        <span style={r.headerTitle}>Quiz Complete</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono' }}>
          {saved ? '✓ result saved' : 'saving…'}
        </span>
      </header>

      <main style={r.main}>
        {/* Score hero */}
        <div style={r.scoreHero}>
          <div style={{ ...r.gradeTag, color: grade.color, borderColor: grade.color }}>
            {grade.label}
          </div>
          <div style={r.scoreCircle}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="70" cy="70" r="58" fill="none" stroke={grade.color} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={r.scoreInner}>
              <span style={{ ...r.scorePct, color: grade.color }}>{pct}%</span>
              <span style={r.scoreLabel}>{score}/{totalQ}</span>
            </div>
          </div>
          <p style={r.gradeMsg}>{grade.msg}</p>

          <div style={r.statRow}>
            <div style={r.stat}><span style={r.statVal}>{score}</span><span style={r.statKey}>Correct</span></div>
            <div style={r.statDiv} />
            <div style={r.stat}><span style={r.statVal}>{totalQ - score}</span><span style={r.statKey}>Incorrect</span></div>
            <div style={r.statDiv} />
            <div style={r.stat}><span style={r.statVal}>{timeStr}</span><span style={r.statKey}>Time</span></div>
            <div style={r.statDiv} />
            <div style={r.stat}><span style={r.statVal}>{quiz.difficulty}</span><span style={r.statKey}>Difficulty</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={r.tabs}>
          {['summary', 'review'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...r.tab, ...(tab === t ? r.tabOn : {}) }}>
              {t === 'summary' ? '📊 Summary' : '🔍 Review All'}
            </button>
          ))}
        </div>

        {tab === 'summary' ? (
          <div style={r.summaryGrid}>
            {quiz.questions.map((q, i) => {
              const ans  = answers[i];
              const corr = ans === q.correct;
              return (
                <div key={i} style={{ ...r.summaryItem, borderColor: corr ? '#22c55e40' : '#ef444440' }}
                  onClick={() => setTab('review')}>
                  <div style={{ ...r.summaryDot, background: corr ? '#22c55e' : '#ef4444' }}>
                    {corr ? '✓' : '✗'}
                  </div>
                  <div style={r.summaryQ}>Q{i + 1}</div>
                  <div style={r.summarySnippet}>{q.question.slice(0, 60)}{q.question.length > 60 && '…'}</div>
                  <div style={{ ...r.summaryAns, color: corr ? '#22c55e' : '#ef4444' }}>
                    {corr ? 'Correct' : `Got ${ans || '—'}, was ${q.correct}`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={r.reviewList}>
            {quiz.questions.map((q, i) => {
              const ans  = answers[i];
              const corr = ans === q.correct;
              return (
                <div key={i} style={{ ...r.reviewCard, borderColor: corr ? '#22c55e25' : '#ef444425' }}>
                  <div style={r.reviewHead}>
                    <span style={{ ...r.reviewNum, color: corr ? '#22c55e' : '#ef4444' }}>Q{String(i + 1).padStart(2,'0')}</span>
                    <span style={{ ...r.reviewStatus, color: corr ? '#22c55e' : '#ef4444' }}>
                      {corr ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <p style={r.reviewQ}>{q.question}</p>
                  <div style={r.reviewOpts}>
                    {q.options.map(opt => {
                      const isCorr = opt.label === q.correct;
                      const isYou  = opt.label === ans;
                      return (
                        <div key={opt.label} style={{
                          ...r.reviewOpt,
                          background: isCorr ? '#22c55e12' : isYou && !isCorr ? '#ef444412' : 'transparent',
                          borderColor: isCorr ? '#22c55e50' : isYou && !isCorr ? '#ef444450' : 'rgba(255,255,255,0.07)',
                        }}>
                          <span style={{ ...r.reviewOptLbl, color: isCorr ? '#22c55e' : isYou && !isCorr ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                            {opt.label}
                          </span>
                          <span style={{ color: isCorr || (isYou && !isCorr) ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                            {opt.text}
                          </span>
                          {isCorr && <span style={{ marginLeft: 'auto', color: '#22c55e', fontSize: 12 }}>✓ correct</span>}
                          {isYou && !isCorr && <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 12 }}>✗ your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={r.explBox}>
                    <span style={r.explIcon}>💡</span>
                    <p style={r.explTxt}>{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={r.actions}>
          <button onClick={onRetry} style={r.retryBtn}>↺ Retry Same Quiz</button>
          <button onClick={onNew}   style={r.newBtn}>⚡ New Quiz</button>
          <button onClick={() => navigate('/student')} style={r.dashBtn}>← Dashboard</button>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT — orchestrates phases
═══════════════════════════════════════════════════════════════════ */
export default function QuizzesPage() {
  const [phase,    setPhase]    = useState('generate'); // generate | quiz | results
  const [quiz,     setQuiz]     = useState(null);
  const [resultData, setResult] = useState(null);

  const handleQuizReady = (q) => { setQuiz(q); setPhase('quiz'); };
  const handleFinish    = (data) => { setResult(data); setPhase('results'); };
  const handleRetry     = () => { setResult(null); setPhase('quiz'); };
  const handleNew       = () => { setQuiz(null); setResult(null); setPhase('generate'); };

  if (phase === 'generate') return <Generator onQuizReady={handleQuizReady} />;
  if (phase === 'quiz')     return <QuizInterface quiz={quiz} onFinish={handleFinish} />;
  if (phase === 'results')  return <Results quiz={quiz} {...resultData} onRetry={handleRetry} onNew={handleNew} />;
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */

// ── Generator styles ──────────────────────────────────────────────
const g = {
  page:{ minHeight:'100vh', background:'#0A0A0F', color:'#F0EBE3', fontFamily:"'DM Mono', monospace", position:'relative', overflow:'hidden' },

  noise:{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.6 },

  header:{
    display:'flex', justifyContent:'space-between', padding:'16px 32px',
    borderBottomWidth:'1px', borderBottomStyle:'solid', borderBottomColor:'rgba(0,255,136,0.12)'
  },

  main:{ display:'grid', gridTemplateColumns:'1fr 300px' },

  formPanel:{
    padding:'40px 48px',
    borderRightWidth:'1px', borderRightStyle:'solid', borderRightColor:'rgba(255,255,255,0.06)'
  },

  input:{
    width:'100%',
    background:'rgba(255,255,255,0.04)',
    borderWidth:'1px',
    borderStyle:'solid',
    borderColor:'rgba(0,255,136,0.2)',
    borderRadius:8,
    padding:'13px 14px 13px 40px',
    color:'#F0EBE3'
  },

  sugg:{
    background:'#141420',
    borderWidth:'1px',
    borderStyle:'solid',
    borderColor:'rgba(0,255,136,0.2)'
  },

  chip:{
    padding:'9px 16px',
    background:'rgba(255,255,255,0.04)',
    borderWidth:'1px',
    borderStyle:'solid',
    borderColor:'rgba(255,255,255,0.1)'
  },

  chipOn:{
    background:'rgba(0,255,136,0.08)',
    borderColor:'#00FF88'
  },

  countChip:{
    width:44, height:44,
    borderWidth:'1px',
    borderStyle:'solid',
    borderColor:'rgba(255,255,255,0.1)'
  },

  countOn:{
    borderColor:'#00FF88'
  },

  error:{
    borderWidth:'1px',
    borderStyle:'solid',
    borderColor:'rgba(239,68,68,0.3)'
  },

  genBtn:{
    border:'none' // safe
  }
};

// ── Quiz interface styles ────────────────────────────────────────────
const qi = {
  page:       { minHeight:'100vh', background:'#0A0A0F', color:'#F0EBE3', fontFamily:"'DM Mono', monospace", display:'flex', flexDirection:'column' },
  noise:      g.noise,
  topBar:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, position:'relative', zIndex:1 },
  topLeft:    { display:'flex', alignItems:'center', gap:12 },
  topRight:   { display:'flex', alignItems:'center', gap:16 },
  quizTitle:  { fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, color:'rgba(240,235,227,0.8)' },
  diffBadge:  { fontSize:10, padding:'2px 8px', background:'rgba(0,255,136,0.1)', color:'#00FF88', borderRadius:20, border:'1px solid rgba(0,255,136,0.3)' },
  timer:      { fontFamily:'Syne Mono, monospace', fontSize:13, color:'rgba(240,235,227,0.5)' },
  qCount:     { fontFamily:'Syne Mono, monospace', fontSize:13, color:'#00FF88' },
  progressWrap:{ height:3, background:'rgba(255,255,255,0.05)', position:'relative', zIndex:1 },
  progressBar:{ height:'100%', background:'linear-gradient(90deg,#00FF88,#22c55e)', transition:'width 0.4s ease', borderRadius:'0 2px 2px 0' },
  main:       { flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', gap:24, position:'relative', zIndex:1 },
  card:       { maxWidth:680, width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:36, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' },
  qNum:       { fontFamily:'Syne Mono, monospace', fontSize:11, color:'rgba(0,255,136,0.6)', letterSpacing:2, marginBottom:16 },
  qText:      { fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:20, lineHeight:1.4, marginBottom:28, color:'#F0EBE3', minHeight:56 },
  options:    { display:'flex', flexDirection:'column', gap:10, marginBottom:24 },
  option:{
  display:'flex',
  borderWidth:'1.5px',
  borderStyle:'solid',
  borderColor:'rgba(255,255,255,0.08)'
  },
  opt_idle:   {},
  opt_selected:{
  borderColor:'#00FF88'
  },
  opt_correct:{
  borderColor:'#22c55e'
  },
  opt_wrong:{
  borderColor:'#ef4444'
  },
 optLabel:   { width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne Mono, monospace', fontSize:12, fontWeight:700, flexShrink:0 },
  lbl_correct:{ background:'rgba(34,197,94,0.2)', color:'#22c55e' },
  lbl_wrong:  { background:'rgba(239,68,68,0.2)', color:'#ef4444' },
  lbl_selected:{ background:'rgba(0,255,136,0.2)', color:'#00FF88' },
  optText:    { flex:1, lineHeight:1.5 },
  optIcon:    { marginLeft:'auto', fontSize:16, flexShrink:0 },
  optKey:     { marginLeft:'auto', fontSize:10, color:'rgba(240,235,227,0.2)', fontFamily:'DM Mono' },
  explanation:{
  borderWidth:'1px',
  borderStyle:'solid'
  },
  explHeader: { fontWeight:700, fontSize:13, marginBottom:8, fontFamily:'Syne, sans-serif' },
  explText:   { fontSize:13, lineHeight:1.65, color:'rgba(240,235,227,0.7)', margin:0 },
  nextBtn:    { width:'100%', padding:'14px', background:'#00FF88', border:'none', borderRadius:10, color:'#0A0A0F', fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:12, transition:'all 0.15s' },
  nextHint:   { fontSize:11, opacity:0.5, fontFamily:'DM Mono', fontWeight:400 },
  hint:       { textAlign:'center', fontSize:11, color:'rgba(240,235,227,0.2)', margin:'12px 0 0', lineHeight:2 },
  kbd:        { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:4, padding:'1px 6px', fontSize:10 },
  miniMap:    { display:'flex', flexDirection:'column', gap:6, paddingTop:8 },
  miniDot:    { width:12, height:12, borderRadius:3, transition:'all 0.2s' },
};

// ── Results styles ────────────────────────────────────────────────────
const r = {
  page:       { minHeight:'100vh', background:'#0A0A0F', color:'#F0EBE3', fontFamily:"'DM Mono', monospace", position:'relative', overflow:'hidden' },
  noise:      g.noise,
  header:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'relative', zIndex:1 },
  backBtn:    { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,235,227,0.6)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontFamily:'DM Mono' },
  headerTitle:{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:14, color:'rgba(240,235,227,0.7)' },
  main:       { maxWidth:840, margin:'0 auto', padding:'40px 24px', position:'relative', zIndex:1 },
  scoreHero:  { textAlign:'center', marginBottom:40 },
  gradeTag:   { display:'inline-block', border:'1.5px solid', borderRadius:4, padding:'4px 16px', fontSize:11, fontFamily:'Syne Mono, monospace', letterSpacing:2, marginBottom:20 },
  scoreCircle:{ position:'relative', width:140, height:140, margin:'0 auto 16px' },
  scoreInner: { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  scorePct:   { fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:32, lineHeight:1 },
  scoreLabel: { fontSize:11, color:'rgba(240,235,227,0.4)', marginTop:2 },
  gradeMsg:   { fontSize:14, color:'rgba(240,235,227,0.55)', marginBottom:24 },
  statRow:{
  display:'inline-flex',
  alignItems:'center',
  justifyContent:'center',
  background:'rgba(255,255,255,0.03)',
  borderWidth:'1px',
  borderStyle:'solid',
  borderColor:'rgba(255,255,255,0.07)',
  borderRadius:12,
  padding:'16px 24px'
  },
  stat:       { display:'flex', flexDirection:'column', gap:4, padding:'0 20px' },
  statVal:    { fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:18, color:'#F0EBE3' },
  statKey:    { fontSize:10, color:'rgba(240,235,227,0.35)', textTransform:'uppercase', letterSpacing:1 },
  statDiv:    { width:1, height:36, background:'rgba(255,255,255,0.08)' },
  tabs:       { display:'flex', gap:4, marginBottom:24 },
  tab:        { padding:'9px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(240,235,227,0.5)', cursor:'pointer', fontSize:13, fontFamily:'DM Mono', transition:'all 0.15s' },
  tabOn:      { background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.3)', color:'#00FF88' },
  summaryGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:32 },
  summaryItem:{ display:'grid', gridTemplateColumns:'28px 40px 1fr auto', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:8, cursor:'pointer', transition:'background 0.12s' },
  summaryDot: { width:24, height:24, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#0A0A0F', fontSize:12, fontWeight:700, flexShrink:0 },
  summaryQ:   { fontFamily:'Syne Mono, monospace', fontSize:12, color:'rgba(240,235,227,0.4)' },
  summarySnippet:{ fontSize:12, color:'rgba(240,235,227,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  summaryAns: { fontSize:11, fontFamily:'DM Mono', flexShrink:0 },
  reviewList: { display:'flex', flexDirection:'column', gap:16, marginBottom:32 },
  reviewCard: { background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:12, padding:'20px 24px' },
  reviewHead: { display:'flex', justifyContent:'space-between', marginBottom:12 },
  reviewNum:  { fontFamily:'Syne Mono, monospace', fontSize:12, fontWeight:700 },
  reviewStatus:{ fontSize:12, fontWeight:700 },
  reviewQ:    { fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:15, marginBottom:16, lineHeight:1.4, color:'#F0EBE3' },
  reviewOpts: { display:'flex', flexDirection:'column', gap:6, marginBottom:14 },
  reviewOpt:  { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'1px solid', borderRadius:8, fontSize:13 },
  reviewOptLbl:{ fontFamily:'Syne Mono, monospace', fontSize:11, fontWeight:700, flexShrink:0, width:20 },
  explBox:    { display:'flex', gap:10, padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, marginTop:4 },
  explIcon:   { fontSize:16, flexShrink:0 },
  explTxt:    { fontSize:12, color:'rgba(240,235,227,0.6)', lineHeight:1.6, margin:0 },
  actions:    { display:'flex', gap:10, flexWrap:'wrap' },
  retryBtn:   { flex:1, padding:'13px', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.3)', borderRadius:10, color:'#00FF88', fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', transition:'all 0.15s' },
  newBtn:     { flex:1, padding:'13px', background:'#00FF88', border:'none', borderRadius:10, color:'#0A0A0F', fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', transition:'all 0.15s' },
  dashBtn:    { padding:'13px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(240,235,227,0.5)', fontFamily:'DM Mono', fontSize:13, cursor:'pointer' },
};

// Inject keyframe animations into document head once
if (typeof document !== 'undefined' && !document.getElementById('quiz-keyframes')) {
  const style = document.createElement('style');
  style.id = 'quiz-keyframes';
  style.textContent = `
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes spin { to { transform: rotate(360deg) } }
    input:focus { border-color: rgba(0,255,136,0.5) !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.08); }
    button:hover { filter: brightness(1.08); }
  `;
  document.head.appendChild(style);
}
