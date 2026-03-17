import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import GoalsDrawer from "./GoalsDrawer";

function Home() {
  const userName = localStorage.getItem("userName") || "User";
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div className={styles.homeContainer}>
      <nav className={styles.navbar}>
        <h1 className={styles.logo}>StudyCircle</h1>
        <div className={styles.navRight}>
          <button className={styles.goalsBtn} onClick={() => setDrawerOpen(true)}>
            📚 Study Goals
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.welcomeBanner}>
        <h2 className={styles.welcomeText}>👋 Welcome, {userName}!</h2>
        <p className={styles.subText}>Ready to start learning today?</p>
      </div>

      <GoalsDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default Home;