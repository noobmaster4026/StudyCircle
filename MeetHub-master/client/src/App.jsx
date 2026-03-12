import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";

// Pages
import Home from "./pages/Home.jsx";
import Room from "./pages/Room.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import LoginRegister from "./pages/LoginRegister.jsx";
import Footer from "./pages/Footer.jsx";

// Components
import Nav from "./components/Nav.jsx";

// ✅ Initialize global socket instance (will connect after login)
const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
  autoConnect: false,
});

const App = () => {
  const [user, setUser] = useState(null);

  // Load user from localStorage if available
  useEffect(() => {
    const storedUser = localStorage.getItem("meetHubUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      socket.auth = { token: parsedUser.token };
      socket.connect();
    }
  }, []);

  // Handle login and save user
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("meetHubUser", JSON.stringify(userData));
    socket.auth = { token: userData.token };
    socket.connect();
  };

  // Handle logout and clear user
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("meetHubUser");
    socket.disconnect();
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <Nav user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            <Route
              path="/login"
              element={!user ? <LoginRegister onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/room/:id"
              element={user ? <Room socket={socket} user={user} /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>

        {/* Footer always at bottom */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
