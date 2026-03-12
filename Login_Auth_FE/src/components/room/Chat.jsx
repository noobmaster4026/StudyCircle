import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const Chat = ({ messages, socket, roomId, user }) => {
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    socket.emit("send-message", { roomId, message: newMessage.trim() });
    setNewMessage("");
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: "'Syne', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 13, fontWeight: 700,
        color: "rgba(255,255,255,0.6)",
        letterSpacing: "0.06em",
      }}>
        ROOM CHAT
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 16px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", marginTop: 24 }}>
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.user?.email === user?.email;
          return (
            <div key={idx} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
            }}>
              <span style={{
                fontSize: 11, color: "rgba(255,255,255,0.3)",
                marginBottom: 3,
              }}>
                {msg.user?.name || msg.user?.email || "User"}
              </span>
              <div style={{
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                background: isMe
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(255,255,255,0.07)",
                color: "white", fontSize: 13, lineHeight: 1.5,
                border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8,
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: "10px 14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, color: "white", fontSize: 13,
            fontFamily: "'Syne', sans-serif", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button
          onClick={handleSend}
          style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 10, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
