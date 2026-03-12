// client/src/pages/Footer.jsx
import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white py-8 shadow-xl">
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center md:text-left"
        >
          <h1 className="text-2xl font-extrabold text-yellow-300">
            MeetHub
          </h1>
          <p className="text-gray-200 mt-1 text-sm">
            Connect. Collaborate. Create.
          </p>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex gap-6 text-sm font-medium"
        >
          <a href="/" className="hover:text-yellow-300 transition-colors duration-300">
            Home
          </a>
          <a href="/about" className="hover:text-yellow-300 transition-colors duration-300">
            About
          </a>
          <a href="/contact" className="hover:text-yellow-300 transition-colors duration-300">
            Contact
          </a>
          <a href="/login" className="hover:text-yellow-300 transition-colors duration-300">
            Login
          </a>
        </motion.div>

        {/* Social Icons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex gap-5"
        >
          <a href="#" className="hover:text-gray-100 transition-colors duration-300">
            <FaFacebookF size={18} />
          </a>
          <a href="#" className="hover:text-gray-100 transition-colors duration-300">
            <FaTwitter size={18} />
          </a>
          <a href="#" className="hover:text-gray-100 transition-colors duration-300">
            <FaLinkedinIn size={18} />
          </a>
          <a href="#" className="hover:text-gray-100 transition-colors duration-300">
            <FaGithub size={18} />
          </a>
        </motion.div>
      </div>

      {/* Footer Bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-6 text-center text-gray-200 text-sm"
      >
        &copy; {new Date().getFullYear()} MeetHub. All rights reserved.
      </motion.div>
    </footer>
  );
};

export default Footer;
