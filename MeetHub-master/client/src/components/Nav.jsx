import React, { useState } from "react";
import { Menu, X, Video, Users, Info, Mail } from "lucide-react"; // icons

const Nav = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Video className="w-8 h-8 text-yellow-300" />
            <span className="text-white font-extrabold text-xl tracking-wide">
              MeetHub
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 text-white font-medium">
            <a href="/" className="flex items-center gap-1 hover:text-yellow-300 transition">
              <Video size={18} /> Home
            </a>
            <a href="/about" className="flex items-center gap-1 hover:text-yellow-300 transition">
              <Info size={18} /> About
            </a>
            <a href="/contact" className="flex items-center gap-1 hover:text-yellow-300 transition">
              <Mail size={18} /> Contact
            </a>
            {user ? (
              <>
                <a
                  href="/room"
                  className="flex items-center gap-1 hover:text-yellow-300 transition"
                >
                  <Users size={18} /> Rooms
                </a>
                <button
                  onClick={onLogout}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-md hover:bg-yellow-500 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 transition"
              >
                Login
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-2xl">
          <div className="flex flex-col space-y-4 p-6 text-gray-800 font-medium">
            <a href="/" className="flex items-center gap-2 hover:text-indigo-600">
              <Video size={18} /> Home
            </a>
            <a href="/about" className="flex items-center gap-2 hover:text-indigo-600">
              <Info size={18} /> About
            </a>
            <a href="/contact" className="flex items-center gap-2 hover:text-indigo-600">
              <Mail size={18} /> Contact
            </a>
            {user ? (
              <>
                <a href="/room" className="flex items-center gap-2 hover:text-indigo-600">
                  <Users size={18} /> Rooms
                </a>
                <button
                  onClick={onLogout}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
              >
                Login
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
