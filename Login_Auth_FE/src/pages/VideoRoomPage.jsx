import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, Copy, Check } from "lucide-react";
import { FaUsers, FaChalkboardTeacher } from "react-icons/fa";
import { MdOutlineVideoCall } from "react-icons/md";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoRoomPage = ({ socket }) => {
  const { id: roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.state?.title || "Study Room";
  const userName = localStorage.getItem("userName") || "Guest";

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const chatBottomRef = useRef(null);

  const [remoteStreams, setRemoteStreams] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  // ── Step 1: Get camera/mic first ──────────────────────────────
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setMediaError("");
        setSocketConnected(true); // trigger socket setup after media ready
      } catch (err) {
        console.error("getUserMedia failed:", err.name, err.message);
        if (err.name === "NotAllowedError") {
          setMediaError("Camera/mic access was denied. Please click the camera icon in your browser address bar and allow access, then refresh.");
        } else if (err.name === "NotFoundError") {
          setMediaError("No camera or microphone found on this device.");
        } else {
          setMediaError(`Could not access camera/mic: ${err.message}`);
        }
        // Still join the room even without media
        setSocketConnected(true);
      }
    };

    startMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Step 2: Setup socket AFTER media is ready ─────────────────
  useEffect(() => {
    if (!socket || !socketConnected) return;

    if (!socket.connected) socket.connect();

    socket.emit("set-user", { name: userName });
    socket.emit("join-room", roomId);
    console.log("📡 Joined room:", roomId);

    const createPeer = (socketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { candidate: e.candidate, to: socketId });
        }
      };

      pc.ontrack = (e) => {
        console.log("🎥 Remote track from:", socketId);
        setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));
      };

      // Add local tracks to peer
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      return pc;
    };

    // New user joined — we send offer
    socket.on("user-joined", async ({ socketId }) => {
      console.log("👤 New user joined:", socketId);
      const pc = createPeer(socketId);
      peersRef.current[socketId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer, to: socketId });
    });

    // Received offer — send answer
    socket.on("offer", async ({ offer, from }) => {
      console.log("📥 Offer from:", from);
      const pc = createPeer(from);
      peersRef.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    });

    // Received answer
    socket.on("answer", async ({ answer, from }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE candidate
    socket.on("ice-candidate", async ({ candidate, from }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    // User left
    socket.on("user-left", ({ socketId }) => {
      peersRef.current[socketId]?.close();
      delete peersRef.current[socketId];
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    // Chat
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("receive-message");
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [socket, socketConnected, roomId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const handleLeave = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socket?.emit("leave-room", roomId);
    navigate(-1);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socket?.emit("send-message", { roomId, message: newMessage.trim() });
    setMessages((prev) => [...prev, { user: { name: userName }, message: newMessage.trim(), isSelf: true }]);
    setNewMessage("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Remote video component
  const RemoteVideo = ({ socketId, stream }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current && stream) ref.current.srcObject = stream;
    }, [stream]);
    return (
      <div style={{ position: "relative", background: "#111", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
        <video ref={ref} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 8, left: 10, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 6, fontSize: 12, color: "white" }}>
          Participant
        </div>
      </div>
    );
  };

  const totalParticipants = Object.keys(remoteStreams).length + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a1a", color: "white", fontFamily: "'Syne', sans-serif" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MdOutlineVideoCall size={16} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>StudyCircle — {title}</span>
        </div>

        <button onClick={copyRoomId} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "5px 14px", color: "white", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
          {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
          Room: <strong>{roomId}</strong>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          <FaUsers size={12} />
          {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
          {totalParticipants === 1 && <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>(waiting for others...)</span>}
        </div>
      </header>

      {/* Media error banner */}
      {mediaError && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", padding: "10px 20px", fontSize: 13, color: "#fca5a5" }}>
          ⚠️ {mediaError}
        </div>
      )}

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Video grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: totalParticipants === 1 ? "1fr" : "repeat(2, 1fr)",
              gap: 10,
            }}>
              {/* Local video */}
              <div style={{ position: "relative", background: "#111", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camOn ? "block" : "none" }} />
                {!camOn && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
                      {userName[0]?.toUpperCase()}
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 8, left: 10, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>
                  {userName} (You)
                </div>
                {!micOn && <MicOff size={14} color="#f87171" style={{ position: "absolute", top: 8, right: 8 }} />}
              </div>

              {/* Remote videos */}
              {Object.entries(remoteStreams).map(([socketId, stream]) => (
                <RemoteVideo key={socketId} socketId={socketId} stream={stream} />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: "12px 20px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={toggleMic} style={{ width: 44, height: 44, border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: micOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.8)" }}>
              {micOn ? <Mic size={18} color="white" /> : <MicOff size={18} color="white" />}
            </button>
            <button onClick={toggleCam} style={{ width: 44, height: 44, border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: camOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.8)" }}>
              {camOn ? <Video size={18} color="white" /> : <VideoOff size={18} color="white" />}
            </button>
            <button onClick={handleLeave} style={{ width: 52, height: 44, border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>
              <PhoneOff size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ width: 280, background: "rgba(255,255,255,0.02)", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
            ROOM CHAT
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages yet 👋</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.isSelf ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{msg.user?.name || "User"}</span>
                <div style={{ maxWidth: "85%", padding: "7px 11px", borderRadius: msg.isSelf ? "10px 10px 3px 10px" : "10px 10px 10px 3px", background: msg.isSelf ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.07)", fontSize: 13, color: "white" }}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, fontFamily: "'Syne', sans-serif", outline: "none" }}
            />
            <button onClick={sendMessage} style={{ width: 36, height: 36, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRoomPage;
