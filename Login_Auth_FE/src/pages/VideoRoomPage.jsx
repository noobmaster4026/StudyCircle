import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaChalkboardTeacher } from "react-icons/fa";
import { MdOutlineVideoCall } from "react-icons/md";
import VideoGrid from "../components/room/VideoGrid";
import Chat from "../components/room/Chat";
import Controls from "../components/room/Controls";
import Whiteboard from "../components/room/Whiteboard";

const VideoRoomPage = ({ socket, user }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Join the room on socket
    socket.emit("join-room", id);

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive-message");
      socket.emit("leave-room", id);
    };
  }, [id, socket]);

  const handleLeave = () => {
    socket?.emit("leave-room", id);
    navigate(-1);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0f1e 100%)",
      color: "white", fontFamily: "'Syne', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
      }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MdOutlineVideoCall size={18} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
            StudyCircle — Video Room
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20, padding: "6px 14px",
            fontSize: 13, color: "rgba(255,255,255,0.7)",
          }}
        >
          <FaUsers style={{ color: "#6366f1" }} />
          Room: <span style={{ fontFamily: "monospace", color: "white", fontWeight: 700 }}>{id}</span>
        </motion.div>

        <span style={{
          background: "rgba(99,102,241,0.2)",
          border: "1px solid rgba(99,102,241,0.3)",
          padding: "6px 16px", borderRadius: 20,
          fontSize: 13, color: "rgba(255,255,255,0.7)",
        }}>
          {user?.name || user?.email || "Guest"}
        </span>
      </header>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Video + optional Whiteboard */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, background: "#000", position: "relative", overflow: "hidden" }}
          >
            <VideoGrid socket={socket} roomId={id} />
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "rgba(99,102,241,0.8)",
              padding: "4px 12px", borderRadius: 8,
              fontSize: 12, fontWeight: 600,
            }}>
              Live
            </div>
            <button
              onClick={() => setShowWhiteboard(w => !w)}
              style={{
                position: "absolute", top: 12, right: 12,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8, padding: "6px 12px",
                color: "white", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              <FaChalkboardTeacher size={13} />
              {showWhiteboard ? "Hide" : "Show"} Whiteboard
            </button>
          </motion.div>

          {/* Whiteboard (collapsible) */}
          {showWhiteboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 280, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                overflow: "hidden",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                color: "#6366f1", fontSize: 13, fontWeight: 600,
              }}>
                <FaChalkboardTeacher /> Whiteboard
              </div>
              <Whiteboard socket={socket} roomId={id} />
            </motion.div>
          )}
        </div>

        {/* Right: Chat */}
        <motion.aside
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: 300,
            background: "rgba(255,255,255,0.02)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column",
          }}
        >
          <Chat messages={messages} socket={socket} roomId={id} user={user} />
        </motion.aside>
      </div>

      {/* Footer Controls */}
      <footer style={{
        background: "rgba(255,255,255,0.03)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <Controls socket={socket} roomId={id} onLeave={handleLeave} />
      </footer>
    </div>
  );
};

export default VideoRoomPage;
