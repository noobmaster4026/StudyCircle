import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Hash, Lock, ArrowRight, ArrowLeft, Plus } from "lucide-react";

const MEETING_SERVER = "http://localhost:5000";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("join");

  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const userName = localStorage.getItem("userName") || "Guest";
  const userId = localStorage.getItem("userId") || "guest";

  const handleJoin = async () => {
    if (!joinId.trim()) return setJoinError("Please enter a Meeting ID.");
    if (!joinPassword.trim()) return setJoinError("Please enter the password.");
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await fetch(`${MEETING_SERVER}/api/meetings/${joinId.trim()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: joinPassword, userId, name: userName }),
      });
      const data = await res.json();
      if (!res.ok) return setJoinError(data.message || "Failed to join.");
      navigate(`/room/${data.roomId}`, { state: { title: data.title, isHost: false } });
    } catch {
      setJoinError("Server unreachable. Make sure MeetHub server is running on port 5000.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createPassword.trim()) return setCreateError("Please set a password.");
    setCreateLoading(true);
    setCreateError("");
    const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      const res = await fetch(`${MEETING_SERVER}/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, password: createPassword, title: createTitle || "Study Room", host: userName }),
      });
      const data = await res.json();
      if (!res.ok) return setCreateError(data.message || "Failed to create.");
      navigate(`/room/${data.roomId}`, { state: { title: data.title, isHost: true, password: createPassword } });
    } catch {
      setCreateError("Server unreachable. Make sure MeetHub server is running on port 5000.");
    } finally {
      setCreateLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 14px 13px 40px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "white", fontSize: 15,
    fontFamily: "'Syne', sans-serif", outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
    letterSpacing: "0.08em", display: "block", marginBottom: 8,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0f1e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif", overflow: "hidden", position: "relative",
    }}>
      <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{
        width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "48px 40px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
          gap: 6, fontSize: 13, marginBottom: 32, padding: 0, fontFamily: "'Syne', sans-serif",
        }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>
            <Video size={24} color="white" />
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 6 }}>Video Study Room</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
            Joining as <span style={{ color: "rgba(255,255,255,0.7)" }}>{userName}</span>
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["join", "create"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px",
              background: tab === t ? "rgba(99,102,241,0.8)" : "transparent",
              border: "none", borderRadius: 10,
              color: tab === t ? "white" : "rgba(255,255,255,0.4)",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
            }}>
              {t === "join" ? "Join Room" : "Create Room"}
            </button>
          ))}
        </div>

        {tab === "join" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>MEETING ID</label>
              <div style={{ position: "relative" }}>
                <Hash size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="text" placeholder="e.g. ABC12345" value={joinId}
                  onChange={e => { setJoinId(e.target.value); setJoinError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="password" placeholder="Enter meeting password" value={joinPassword}
                  onChange={e => { setJoinPassword(e.target.value); setJoinError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>
            {joinError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{joinError}</motion.p>}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleJoin} disabled={joinLoading} style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700,
              fontFamily: "'Syne', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)", opacity: joinLoading ? 0.7 : 1,
            }}>
              {joinLoading ? "Joining..." : <><span>Join Room</span><ArrowRight size={16} /></>}
            </motion.button>
          </div>
        )}

        {tab === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>ROOM TITLE (optional)</label>
              <div style={{ position: "relative" }}>
                <Video size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="text" placeholder="e.g. Math Study Session" value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>SET PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="password" placeholder="Participants will need this" value={createPassword}
                  onChange={e => { setCreatePassword(e.target.value); setCreateError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCreate()} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>
            {createError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{createError}</motion.p>}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={createLoading} style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700,
              fontFamily: "'Syne', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)", opacity: createLoading ? 0.7 : 1,
            }}>
              {createLoading ? "Creating..." : <><span>Create Room</span><Plus size={16} /></>}
            </motion.button>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", margin: 0 }}>
              A unique Room ID will be generated automatically. Share it with participants.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JoinRoomPage;
