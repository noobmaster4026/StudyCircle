import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GoalsDrawer from "../GoalsDrawer";
import styles from "./StudentDashboard.module.css";
import ReminderPreferencesPanel from "../ReminderPreferencesPanel";

function StudentDashboard() {
  const userName = localStorage.getItem("userName") || "Student";
  const navigate  = useNavigate();
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const cardsRef                              = useRef([]);
  const [showReminderPrefs, setShowReminderPrefs] = useState(false);

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
    {
      num: "07. SCANNER",
      title: "Scan Documents",
      desc: "Upload images and extract text using OCR. Share scanned documents with a link.",
      img: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/scanner"),
      btnText: "Open Scanner",
    },
    {
      num: "08. STUDY GROUPS",
      title: "Find Your Group",
      desc: "Get auto-matched into study groups based on your courses, schedule, and study style. Collaborate with peers who study the way you do.",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop",
      action: () => navigate("/study-groups"),
      btnText: "Explore Groups",
    },
    {
      num: "09. WHITEBOARD",
      title: "Think Visually",
      // ✅ Independent from study groups — every student can access the class-wide board
      // directly. No group membership required. Study groups also get their own boards
      // via /whiteboard/<group-room-id>, but this card always opens the shared class board.
      desc: "Draw, annotate, and brainstorm with any classmate in real time. Open to every student — see a live history log of who changed what, with full undo support.",
      img: "https://images.unsplash.com/photo-1507209575474-fa818c2f4e46?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/whiteboard/shared-board"),
      btnText: "Open Whiteboard",
    },
    {
      num: "10. AI QUIZ",
      title: "Test Yourself",
      desc: "Generate custom quizzes on any topic using AI. Pick your difficulty, question count, and type — get instant feedback with detailed explanations after every answer.",
      img: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/quizzes"),
      btnText: "Generate Quiz",
    },
    {
      num: "11. RECOMMENDATIONS",
      title: "What to Study Next",
      desc: "Get personalized study recommendations based on your subjects, goals, and upcoming deadlines. Rate suggestions to improve future picks.",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/recommendations"),
      btnText: "View Recommendations",
    },
    {
      num: "12. ANALYTICS",
      title: "Track Your Progress",
      desc: "See your study hours, quiz trends, flashcard retention, streak, and Pomodoro heatmap all in one place. Log sessions and watch your growth over time.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/analytics"),
      btnText: "View Analytics",
    },
    {
      num: "13. STUDY SESSIONS",
      title: "Create & Join",
      desc: "Create focused study sessions, set a topic and seat limit, then join classmates for quick peer learning.",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop",
      action: () => navigate("/study-session"),
      btnText: "Open Sessions",
    },
    {
      num: "14. STUDY SCHEDULE",
      title: "Plan Your Week",
      desc: "Generate a practical weekly study plan from your subjects, available hours, preferred days, and exam focus.",
      img: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2668&auto=format&fit=crop",
      action: () => navigate("/study-schedule"),
      btnText: "Generate Plan",
    },
    {
      num: "15. TUTORS",
      title: "Find a Tutor",
      desc: "Browse available tutors, compare course expertise and tuition fee, then save a booking request.",
      img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/tutor-marketplace"),
      btnText: "Browse Tutors",
    },
    {
      num: "16. PEER RATINGS",
      title: "Rate Study Partners",
      desc: "Leave helpful ratings after group work so reliable, supportive classmates are easier to recognize.",
      img: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/peer-ratings"),
      btnText: "Rate Peers",
    },
    {
      num: "17. REMINDERS",
      title: "Never Miss Study Time",
      desc: "Create reminders for goals, review blocks, study sessions, and upcoming exam preparation.",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/reminders"),
      btnText: "Set Reminders",
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
          <button
            className={styles.logoutBtn}
            onClick={() => setShowReminderPrefs(v => !v)}
            style={{ marginRight: 8 }}
          >
            🔔
          </button>
          {showReminderPrefs && (
            <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 999, width: 280, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <ReminderPreferencesPanel onClose={() => setShowReminderPrefs(false)} />
            </div>
          )}
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
