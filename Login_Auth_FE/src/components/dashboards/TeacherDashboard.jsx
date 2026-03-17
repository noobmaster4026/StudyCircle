import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TeacherDashboard.module.css";
import VideoRoomCard from "../VideoRoomCard";

function TeacherDashboard() {
  const userName = localStorage.getItem("userName") || "Teacher";
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/api/students")
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const cards = cardsRef.current;
      const viewportHeight = window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const stickyTopOffset = isMobile ? viewportHeight * 0.10 : viewportHeight * 0.15;

      cards.forEach((card, index) => {
        if (!card) return;
        const nextCard = cards[index + 1];
        if (nextCard) {
          const nextRect = nextCard.getBoundingClientRect();
          const distance = nextRect.top - stickyTopOffset;
          if (distance < viewportHeight && distance > 0) {
            const maxShrink = isMobile ? 0.95 : 0.90;
            const factor = (1 - maxShrink) / viewportHeight;
            const scale = 1 - ((viewportHeight - distance) * factor);
            const finalScale = Math.max(maxShrink, Math.min(1, scale));
            const brightness = Math.max(0.6, Math.min(1, scale));
            card.style.transform = `scale(${finalScale})`;
            card.style.filter = `brightness(${brightness})`;
          } else if (distance <= 0) {
            const maxShrink = isMobile ? 0.95 : 0.90;
            card.style.transform = `scale(${maxShrink})`;
            card.style.filter = `brightness(0.6)`;
          } else {
            card.style.transform = `scale(1)`;
            card.style.filter = `brightness(1)`;
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const features = [
    {
      num: "01. COURSES",
      title: "My Courses",
      desc: "View and manage all the courses you are teaching. Keep your curriculum organized and up to date.",
      img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/courses"),
      btnText: "View Courses"
    },
    {
      num: "02. STUDENTS",
      title: "My Students",
      desc: `You have ${students.length} student(s) enrolled. View their profiles and track their progress.`,
      img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2664&auto=format&fit=crop",
      action: () => setShowStudents(true),
      btnText: "View Students"
    },
    {
      num: "03. MATERIAL",
      title: "Course Material",
      desc: "Upload lecture notes, assignments, and resources for your students to access anytime.",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/material"),
      btnText: "Add Material"
    },
    {
      num: "04. GOALS",
      title: "Study Goals",
      desc: "Set and track your own teaching goals. Stay on top of your lesson plans and deadlines.",
      img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2576&auto=format&fit=crop",
      action: () => navigate("/goals"),
      btnText: "Open Goals"
    },
    {
      num: "05. FOCUS",
      title: "Pomodoro Timer",
      desc: "Use focused time intervals to prepare lessons and grade assignments more efficiently.",
      img: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/pomodoro"),
      btnText: "Start Timer"
    },
    {
      num: "06. ROOMS",
      title: "Video Rooms",
      desc: "Host live video sessions with your students. Conduct online classes and office hours.",
      img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/join-room"),
      btnText: "Start Session"
    },
  ];

  return (
    <div className={styles.wrapper}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logoWrapper}>
                  <img src="/Icon.png" alt="logo" className={styles.logoImg}/>
                  <h1 className={styles.logo}>StudyCircle</h1>
                  </div>
        <div className={styles.navRight}>
          <span className={styles.roleTag}>👨‍🏫 Teacher</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.revealText}>
          Welcome,<br />
          <span>{userName}!</span><br />
          Let's Teach.
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

      {/* Students Modal */}
      {showStudents && (
        <div className={styles.modalOverlay} onClick={() => setShowStudents(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>👨‍🎓 My Students ({students.length})</h3>
            <div className={styles.studentList}>
              {students.length === 0 ? (
                <p className={styles.emptyMsg}>No students enrolled yet.</p>
              ) : (
                students.map(s => (
                  <div key={s._id} className={styles.studentItem}>
                    <span>👤 {s.name}</span>
                    <span className={styles.email}>{s.email}</span>
                  </div>
                ))
              )}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowStudents(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <section className={styles.footer}>
        <p>© 2026 StudyCircle — Keep Teaching 🎓</p>
      </section>
    </div>
  );
}

export default TeacherDashboard;