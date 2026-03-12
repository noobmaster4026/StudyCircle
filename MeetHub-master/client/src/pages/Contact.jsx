// client/src/pages/Contact.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can add API call to send the message
    console.log("Message submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6 md:px-16 py-20">
      {/* Hero */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-extrabold text-indigo-400 mb-8 text-center"
      >
        Get in Touch <span className="text-pink-500">With MeetHub</span>
      </motion.h1>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid sm:grid-cols-3 gap-8 text-center mb-12"
      >
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-md hover:scale-[1.05] transition-transform duration-300">
          <FaEnvelope className="mx-auto text-indigo-400 text-3xl mb-2" />
          <h3 className="text-lg font-semibold text-indigo-300 mb-1">Email</h3>
          <p className="text-gray-400 text-sm">support@meethub.com</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-md hover:scale-[1.05] transition-transform duration-300">
          <FaPhone className="mx-auto text-green-400 text-3xl mb-2" />
          <h3 className="text-lg font-semibold text-indigo-300 mb-1">Phone</h3>
          <p className="text-gray-400 text-sm">+91 9876543210</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-md hover:scale-[1.05] transition-transform duration-300">
          <FaMapMarkerAlt className="mx-auto text-pink-400 text-3xl mb-2" />
          <h3 className="text-lg font-semibold text-indigo-300 mb-1">Address</h3>
          <p className="text-gray-400 text-sm">Jajpur, Odisha, India</p>
        </div>
      </motion.div>

      {/* Contact Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-lg flex flex-col gap-4"
      >
        {submitted && (
          <p className="text-green-400 font-semibold text-center">
            Thank you! Your message has been sent.
          </p>
        )}
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="p-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none text-white"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none text-white"
        />
        <textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="p-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none text-white resize-none"
        />
        <button
          type="submit"
          className="py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300"
        >
          Send Message
        </button>
      </motion.form>
    </div>
  );
};

export default Contact;
