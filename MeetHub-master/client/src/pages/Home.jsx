// client/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom":

const Home = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden px-4">

      {/* Animated Background Circles */}
      <div className="absolute w-[500px] h-[500px] bg-pink-500 rounded-full blur-3xl opacity-30 top-[-150px] left-[-150px] animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-yellow-400 rounded-full blur-3xl opacity-20 bottom-[-150px] right-[-150px] animate-ping"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-3xl mb-20">
        {/* Logo / Brand */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
          Welcome to{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-red-400">
            MeetHub
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-300 leading-relaxed">
          The ultimate space to{" "}
          <span className="font-semibold text-yellow-300">connect, collaborate,</span>{" "}
          and create — with <span className="font-semibold">video calls, chat, & whiteboards</span> all in one place.
        </p>

        {/* Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-2xl shadow-lg hover:scale-105 hover:bg-white/30 transition-transform duration-300"
          >
            🚀 Join / Create a Room
          </Link>
          <Link
            to="/about"
            className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 hover:text-yellow-300 transition-all duration-300"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Floating Feature Cards */}
      <div className="absolute bottom-24 flex flex-wrap justify-center gap-4 z-10 px-4 ">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-bold text-yellow-300">💬 Chat</h3>
          <p className="text-sm text-gray-200 opacity-80">Instant messaging in real-time</p>
        </div>
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-bold text-pink-300">🎥 Video</h3>
          <p className="text-sm text-gray-200 opacity-80">Crystal-clear group calls</p>
        </div>
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-bold text-indigo-300">📝 Whiteboard</h3>
          <p className="text-sm text-gray-200 opacity-80">Collaborate visually & brainstorm</p>
        </div>
      </div>

      {/* Footer Note */}
      <p className="absolute bottom-6 text-xs text-gray-300 z-10">
        🌐 Built with ❤️ for seamless collaboration
      </p>
    </div>
  );
};

export default Home;
