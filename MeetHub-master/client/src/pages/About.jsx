// client/src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaUsers, FaVideo, FaChalkboardTeacher } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";

const features = [
  {
    icon: <FaVideo className="text-indigo-400 text-3xl" />,
    title: "Seamless Video Meetings",
    desc: "Experience high-quality, real-time video calls with smooth performance and reliability.",
  },
  {
    icon: <FaChalkboardTeacher className="text-pink-400 text-3xl" />,
    title: "Interactive Whiteboard",
    desc: "Collaborate visually with your team using a shared whiteboard that updates live.",
  },
  {
    icon: <FaUsers className="text-green-400 text-3xl" />,
    title: "Team Collaboration",
    desc: "Connect, chat, and brainstorm together in secure and private meeting rooms.",
  },
  {
    icon: <MdSecurity className="text-yellow-400 text-3xl" />,
    title: "Secure by Design",
    desc: "All communication is encrypted, ensuring your privacy and data security.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <section className="px-6 md:px-16 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold text-indigo-400 mb-6"
        >
          About <span className="text-pink-500">MeetHub</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-2xl mx-auto text-gray-300 text-lg"
        >
          MeetHub is a modern video conferencing platform designed to make
          collaboration seamless, interactive, and secure. Whether you’re
          studying, teaching, or working with a team, MeetHub empowers you to
          connect and create effortlessly.
        </motion.p>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-16 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2, duration: 0.5 }}
            className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 text-center shadow-lg border border-gray-700 hover:scale-[1.05] transform transition-all duration-300"
          >
            <div className="flex justify-center mb-4">{feature.icon}</div>
            <h3 className="text-lg font-bold mb-2 text-indigo-300">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Closing Section */}
      <section className="px-6 md:px-16 py-16 text-center border-t border-gray-700">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-indigo-400 mb-4"
        >
          Building the Future of Collaboration 🚀
        </motion.h2>
        <p className="max-w-xl mx-auto text-gray-400">
          At MeetHub, we believe teamwork should be simple, fun, and effective.
          Our mission is to provide you with the tools you need to connect and
          succeed in the digital era.
        </p>
      </section>
    </div>
  );
};

export default About;
