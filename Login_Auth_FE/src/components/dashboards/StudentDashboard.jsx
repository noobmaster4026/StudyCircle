import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GoalsDrawer from "../GoalsDrawer";
import styles from "./StudentDashboard.module.css";

function StudentDashboard() {
  const userName = localStorage.getItem("userName") || "Student";
  const navigate  = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cardsRef = useRef([]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Scroll-stack animation
  useEffect(() => {
    const cards = cardsRef.current;
    const handleScroll = () => {
      const viewportHeight  = window.innerHeight;
      const isMobile        = window.innerWidth <= 768;
      const stickyTopOffset = isMobile ? viewportHeight * 0.10 : viewportHeight * 0.15;

      cards.forEach((card, index) => {
        if (!card) return;
        const nextCard = cards[index + 1];
        if (nextCard) {
          const nextRect = nextCard.getBoundingClientRect();
          const distance = nextRect.top - stickyTopOffset;
          if (distance < viewportHeight && distance > 0) {
            const maxShrink  = isMobile ? 0.95 : 0.90;
            const factor     = (1 - maxShrink) / viewportHeight;
            const scale      = 1 - ((viewportHeight - distance) * factor);
            const finalScale = Math.max(maxShrink, Math.min(1, scale));
            const brightness = Math.max(0.6, Math.min(1, scale));
            card.style.transform = `scale(${finalScale})`;
            card.style.filter    = `brightness(${brightness})`;
          } else if (distance <= 0) {
            const maxShrink = isMobile ? 0.95 : 0.90;
            card.style.transform = `scale(${maxShrink})`;
            card.style.filter    = `brightness(0.6)`;
          } else {
            card.style.transform = `scale(1)`;
            card.style.filter    = `brightness(1)`;
          }
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      num: "01. FLASHCARDS",
      title: "Study Smarter",
      desc: "Create and flip through flashcards to memorize concepts faster. Organize by deck and track what you know.",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      action: () => navigate("/flashcards"),
      btnText: "Open Flashcards",
    },
    {
      num: "02. POMODORO",
      title: "Deep Focus",
      desc: "Use the Pomodoro technique to stay focused. Work in timed intervals with short and long breaks in between.",
      img: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/pomodoro"),
      btnText: "Start Timer",
    },
    {
      num: "03. SHARED NOTES",
      title: "Share & Learn",
      desc: "Upload lecture slides and study notes. Browse and download materials shared by your peers.",
      img: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/notes"),
      btnText: "Browse Notes",
    },
    {
      num: "04. MY COURSES",
      title: "Add Courses",
      desc: "Add and manage your enrolled courses. Keep track of what you're studying this semester.",
      img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2576&auto=format&fit=crop",
      action: () => navigate("/my-courses"),
      btnText: "Manage Courses",
    },
    {
      num: "05. VIDEO ROOMS",
      title: "Study Together",
      desc: "Join live video study rooms with classmates. Collaborate in real time and stay motivated together.",
      img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/join-room"),
      btnText: "Join Room",
    },
    {
      num: "06. PROGRESS",
      title: "See Growth",
      desc: "Visualize your learning journey. Track completed goals, study sessions, and flashcard mastery over time.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
      action: () => setDrawerOpen(true),
      btnText: "View Progress",
    },
  ];

  return (
    <div className={styles.wrapper}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logoWrapper}>
          <img src="/Icon.png" alt="logo" className={styles.logoImg} />
          <h1 className={styles.logo}>StudyCircle</h1>
        </div>
        <div className={styles.navRight}>
          <span className={styles.roleTag}>🎓 Student</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.revealText}>
          Welcome,<br />
          <span>{userName}!</span><br />
          Let's Study.
        </h1>
        <div className={styles.scrollIndicator}>SCROLL TO EXPLORE</div>
      </section>

      {/* Stacking Cards */}
      <div className={styles.stackArea}>
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${styles.card} ${styles[`card${index + 1}`]}`}
            ref={el => cardsRef.current[index] = el}
          >
            <div className={styles.cardContent}>
              <span className={styles.cardNum}>{feature.num}</span>
              <h2>{feature.title}</h2>
              <p>{feature.desc}</p>
              <button className={styles.cardBtn} onClick={feature.action}>
                {feature.btnText} →
              </button>
            </div>
            <div className={styles.cardImg}>
              <img src={feature.img} alt={feature.title} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <section className={styles.footer}>
        <p>© 2026 StudyCircle — Keep Learning 🚀</p>
      </section>

      <GoalsDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default StudentDashboard;
