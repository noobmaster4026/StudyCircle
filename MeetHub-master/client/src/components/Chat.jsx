import React, { useState } from "react";

const Chat = ({ messages, socket, roomId, user }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage) return;
    socket.emit("send-message", { roomId, message: newMessage });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col p-2 border-t border-gray-300 h-48 overflow-y-auto bg-gray-50">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-1 ${msg.user.email === user.email ? "text-right" : "text-left"}`}>
            <span className="font-bold">{msg.user.email}: </span>
            {msg.message}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="ml-2 bg-blue-500 px-3 py-1 rounded text-white">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
