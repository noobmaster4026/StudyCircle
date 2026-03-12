import React from "react";
import { useNavigate } from "react-router-dom";
import { Video, Users, ArrowRight } from "lucide-react";

/**
 * VideoRoomCard
 * Drop this into StudentDashboard.jsx and TeacherDashboard.jsx
 * where the "Video Study Room" feature card should appear.
 *
 * Usage:
 *   import VideoRoomCard from "./VideoRoomCard";
 *   <VideoRoomCard />
 */
const VideoRoomCard = ({ accentColor = "#6366f1" }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/join-room")}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Syne', sans-serif",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(99,102,241,0.2)`;
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {/* Glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100,
        background: `radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
        boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
      }}>
        <Video size={20} color="white" />
      </div>

      {/* Text */}
      <h3 style={{
        color: "white", fontSize: 16, fontWeight: 700,
        margin: 0, marginBottom: 6,
      }}>
        Video Study Room
      </h3>
      <p style={{
        color: "rgba(255,255,255,0.4)", fontSize: 13,
        margin: 0, lineHeight: 1.5,
      }}>
        Join or host a live video session with your peers
      </p>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 20,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.3)", fontSize: 12,
        }}>
          <Users size={12} /> Live collaboration
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          color: "#6366f1", fontSize: 13, fontWeight: 600,
        }}>
          Enter <ArrowRight size={13} />
        </div>
      </div>
    </div>
  );
};

export default VideoRoomCard;
