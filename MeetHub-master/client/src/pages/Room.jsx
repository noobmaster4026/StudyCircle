import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaChalkboardTeacher } from "react-icons/fa";
import { MdOutlineVideoCall } from "react-icons/md";

import VideoGrid from "../components/VideoGrid.jsx";
import Chat from "../components/Chat.jsx";
import Controls from "../components/Controls.jsx";
import Whiteboard from "../components/Whiteboard.jsx";

const Room = ({ socket, user }) => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", id, user);

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [id, socket, user]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-700">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xl font-bold text-indigo-400"
        >
          <MdOutlineVideoCall className="text-2xl" />
          MeetHub Room
        </motion.h1>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-gray-300"
        >
          <FaUsers className="text-indigo-400" />
          Room ID: <span className="font-mono">{id}</span>
        </motion.span>

        <span className="px-4 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md">
          {user?.email || "Guest"}
        </span>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video + Whiteboard */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 bg-black relative"
          >
            <VideoGrid socket={socket} />
            <div className="absolute top-3 left-3 bg-indigo-600/80 px-3 py-1 rounded-lg text-xs shadow-md">
              Live Meeting
            </div>
          </motion.div>

          {/* Whiteboard Section */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-[300px] border-t border-gray-700 bg-gray-900/90"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 text-indigo-400 font-semibold">
              <FaChalkboardTeacher />
              Whiteboard
            </div>
            <Whiteboard socket={socket} roomId={id} />
          </motion.div>
        </div>

        {/* Right: Chat */}
        <motion.aside
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-80 bg-gray-800/90 border-l border-gray-700 flex flex-col"
        >
          <Chat messages={messages} socket={socket} roomId={id} user={user} />
        </motion.aside>
      </div>

      {/* Footer Controls */}
      <footer className="bg-gray-800/90 border-t border-gray-700 shadow-lg">
        <Controls socket={socket} roomId={id} user={user} />
      </footer>
    </div>
  );
};

export default Room;
