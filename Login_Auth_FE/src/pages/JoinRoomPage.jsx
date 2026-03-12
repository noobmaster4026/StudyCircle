import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Hash, Lock, ArrowRight, ArrowLeft } from "lucide-react";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (!meetingId.trim()) {
      setError("Please enter a Meeting ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter the meeting password.");
      return;
    }
    // Navigate to the room — password passed as state for validation
    navigate(`/room/${meetingId.trim()}`, { state: { password } });
  };

  const handleCreate = () => {
    // Generate a random room ID and navigate directly
    const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
    navigate(`/room/${newId}`, { state: { password: password || "1234", isHost: true } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0f1e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow effects */}
      <div style={{
        position: "absolute", top: "10%", left: "15%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "15%",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "48px 40px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
            gap: 6, fontSize: 13, marginBottom: 32, padding: 0,
            fontFamily: "'Syne', sans-serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}>
            <Video size={24} color="white" />
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8 }}>
            Video Study Room
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
            Join an existing room or create a new one
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Meeting ID */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              MEETING ID
            </label>
            <div style={{ position: "relative" }}>
              <Hash size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)"
              }} />
              <input
                type="text"
                placeholder="e.g. ABC12345"
                value={meetingId}
                onChange={e => { setMeetingId(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{
                  width: "100%", padding: "13px 14px 13px 40px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "white", fontSize: 15,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              MEETING PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)"
              }} />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{
                  width: "100%", padding: "13px 14px 13px 40px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "white", fontSize: 15,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: "#f87171", fontSize: 13, margin: 0 }}
            >
              {error}
            </motion.p>
          )}

          {/* Join button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: 12,
              color: "white", fontSize: 15, fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: "pointer", marginTop: 4,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            }}
          >
            Join Room <ArrowRight size={16} />
          </motion.button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Create button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            style={{
              width: "100%", padding: "14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              cursor: "pointer",
            }}
          >
            Create New Room
          </motion.button>
        </div>

        {/* Logged in as */}
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", marginTop: 28, marginBottom: 0 }}>
          Enter a Meeting ID to join an existing session
        </p>
      </motion.div>
    </div>
  );
};

export default JoinRoomPage;
