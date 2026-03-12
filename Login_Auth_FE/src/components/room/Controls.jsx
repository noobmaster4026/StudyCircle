import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff } from "lucide-react";

const Controls = ({ socket, roomId, onLeave }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    socket?.emit("toggle-mic", { roomId, enabled: next });
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    socket?.emit("toggle-cam", { roomId, enabled: next });
  };

  const shareScreen = () => {
    socket?.emit("share-screen", { roomId });
  };

  const leaveRoom = () => {
    if (onLeave) onLeave();
    socket?.emit("leave-room", { roomId });
  };

  const btnBase = {
    width: 46, height: 46,
    border: "none", borderRadius: 12, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity 0.2s, transform 0.1s",
    fontFamily: "'Syne', sans-serif",
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      gap: 12, padding: "14px 24px",
      fontFamily: "'Syne', sans-serif",
    }}>
      <button
        onClick={toggleMic}
        title={micOn ? "Mute" : "Unmute"}
        style={{
          ...btnBase,
          background: micOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.8)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {micOn ? <Mic size={18} color="white" /> : <MicOff size={18} color="white" />}
      </button>

      <button
        onClick={toggleCam}
        title={camOn ? "Turn off camera" : "Turn on camera"}
        style={{
          ...btnBase,
          background: camOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.8)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {camOn ? <Video size={18} color="white" /> : <VideoOff size={18} color="white" />}
      </button>

      <button
        onClick={shareScreen}
        title="Share screen"
        style={{
          ...btnBase,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        <MonitorUp size={18} color="white" />
      </button>

      <button
        onClick={leaveRoom}
        title="Leave room"
        style={{
          ...btnBase,
          width: 56,
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          boxShadow: "0 4px 14px rgba(239,68,68,0.4)",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        <PhoneOff size={18} color="white" />
      </button>
    </div>
  );
};

export default Controls;
