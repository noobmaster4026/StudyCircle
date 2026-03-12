import React, { useState } from "react";
import { MdMessage, MdCallEnd } from "react-icons/md";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PhoneOff,
} from "lucide-react"; // npm i lucide-react

const Controls = ({ socket, roomId, onLeave }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = () => {
    setMicOn(!micOn);
    socket.emit("toggle-mic", { roomId, enabled: !micOn });
  };

  const toggleCam = () => {
    setCamOn(!camOn);
    socket.emit("toggle-cam", { roomId, enabled: !camOn });
  };

  const shareScreen = () => {
    socket.emit("share-screen", { roomId });
  };

  const openChat = () => {
    socket.emit("open-chat", { roomId });
  };

  const leaveRoom = () => {
    if (onLeave) onLeave();
    socket.emit("leave-room", { roomId });
  };

  return (
    <div className="flex justify-center gap-4 p-4 bg-gray-900 text-white fixed bottom-0 w-full shadow-lg">
      <button
        onClick={toggleMic}
        className={`p-3 rounded-full ${
          micOn ? "bg-green-600" : "bg-red-600"
        } hover:opacity-80`}
      >
        {micOn ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      <button
        onClick={toggleCam}
        className={`p-3 rounded-full ${
          camOn ? "bg-green-600" : "bg-red-600"
        } hover:opacity-80`}
      >
        {camOn ? <Video size={22} /> : <VideoOff size={22} />}
      </button>

      <button
        onClick={shareScreen}
        className="p-3 rounded-full bg-blue-600 hover:opacity-80"
      >
        <MonitorUp size={22} />
      </button>

      <button
        onClick={openChat}
        className="p-3 rounded-full bg-purple-600 hover:opacity-80"
      >
        <MessageSquare size={22} />
      </button>

      <button
        onClick={leaveRoom}
        className="p-3 rounded-full bg-red-700 hover:opacity-90"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
};

export default Controls;
