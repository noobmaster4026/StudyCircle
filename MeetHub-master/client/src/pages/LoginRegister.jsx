import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";

const LoginRegister = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `/api/auth/${isRegister ? "register" : "login"}`;
      const { data } = await axios.post(url, { email, password });
      onLogin(data);
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4">
      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-10 w-full max-w-md text-white border border-white/30"
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
            <FaUserCircle className="text-indigo-600 text-5xl" />
          </div>
          <h1 className="text-4xl font-extrabold mt-4 tracking-tight drop-shadow-lg">
            Meet<span className="text-pink-300">Hub</span>
          </h1>
          <p className="text-sm opacity-80 mt-2">
            {isRegister ? "Create a new account" : "Login to continue"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-xl bg-white/80 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-md"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 rounded-xl bg-white/80 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-md"
          />
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-white/40"></span>
          <span className="text-sm opacity-80">or</span>
          <span className="flex-1 h-px bg-white/40"></span>
        </div>

        {/* Toggle Login/Register */}
        <p
          className="text-center text-sm font-medium cursor-pointer hover:underline"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Don’t have an account? Register"}
        </p>
      </motion.div>
    </div>
  );
};

export default LoginRegister;
