import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GoalsDrawer from "../GoalsDrawer";
import styles from "./StudentDashboard.module.css";

const COURSES_API = "http://localhost:5001/api/courses";
const IND_INFO_API = "http://localhost:5001/api/ind-infos";
const MAX_COURSES = 4;

function StudentDashboard() {
  const userName = localStorage.getItem("userName") || "Student";
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cardsRef = useRef([]);

  // ── My Courses state ──────────────────────────────────────────
  const [allCourses, setAllCourses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // Load all available courses
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(COURSES_API);
        const data = await res.json();
        if (res.ok) setAllCourses(data);
      } catch {}
      finally { setCoursesLoading(false); }
    };
    load();
  }, []);

  // Load student's selected courses
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await fetch(`${IND_INFO_API}/${user.id}`);
        const data = await res.json();
        if (res.ok) {
          const ids = (data.courses || []).map((c) =>
            typeof c === "string" ? c : c._id
          );
          setSelectedIds(ids);
        }
      } catch {}
    };
    load();
  }, [user?.id]);

  const selectedCourses = allCourses.filter((c) => selectedIds.includes(c._id));
  const availableCourses = allCourses
    .filter((c) => !selectedIds.includes(c._id))
    .filter((c) =>
      search.trim()
        ? c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase())
        : true
    );

  const handleAdd = async (courseId) => {
    if (selectedIds.length >= MAX_COURSES || !user?.id) return;
    setUpdatingId(courseId);
    try {
      const res = await fetch(`${IND_INFO_API}/${user.id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        const ids = (data.courses || []).map((c) =>
          typeof c === "string" ? c : c._id
        );
        setSelectedIds(ids);
        if (ids.length >= MAX_COURSES) setShowPicker(false);
      }
    } catch {}
    finally { setUpdatingId(null); }
  };

  const handleDrop = async (courseId) => {
    if (!user?.id) return;
    setUpdatingId(courseId);
    try {
      const res = await fetch(`${IND_INFO_API}/${user.id}/courses/${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        const ids = (data.courses || []).map((c) =>
          typeof c === "string" ? c : c._id
        );
        setSelectedIds(ids);
      }
    } catch {}
    finally { setUpdatingId(null); }
  };

  const isFull = selectedIds.length >= MAX_COURSES;
  // ── End My Courses state ──────────────────────────────────────

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const cards = cardsRef.current;
    const handleScroll = () => {
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

  const features = [
    {
      num: "01. FLASHCARDS",
      title: "Study Smarter",
      desc: "Create and flip through flashcards to memorize concepts faster. Organize by deck and track what you know.",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      action: () => navigate("/flashcards"),
      btnText: "Open Flashcards",
      type: "regular",
    },
    {
      num: "02. POMODORO",
      title: "Deep Focus",
      desc: "Use the Pomodoro technique to stay focused. Work in timed intervals with short and long breaks in between.",
      img: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/pomodoro"),
      btnText: "Start Timer",
      type: "regular",
    },
    {
      num: "03. MY COURSES",
      title: "Add Courses",
      desc: null, // rendered via custom panel
      img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2576&auto=format&fit=crop",
      type: "courses",
    },
    {
      num: "04. VIDEO ROOMS",
      title: "Study Together",
      desc: "Join live video study rooms with classmates. Collaborate in real time and stay motivated together.",
      img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/join-room"),
      btnText: "Join Room",
      type: "regular",
    },
    {
      num: "05. PROGRESS",
      title: "See Growth",
      desc: "Visualize your learning journey. Track completed goals, study sessions, and flashcard mastery over time.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
      action: () => setDrawerOpen(true),
      btnText: "View Progress",
      type: "regular",
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

      {/* Hero Section */}
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
            {feature.type === "courses" ? (
              /* ── My Courses Card ── */
              <>
                <div className={styles.cardContent}>
                  <span className={styles.cardNum}>{feature.num}</span>
                  <h2>{feature.title}</h2>

                  {/* Courses panel */}
                  <div className={styles.coursesPanel}>
                    {/* Header row */}
                    <div className={styles.coursesPanelHeader}>
                      <div>
                        <p className={styles.coursesPanelTitle}>My Courses</p>
                        <p className={styles.coursesPanelSub}>
                          {selectedIds.length} / {MAX_COURSES} selected
                        </p>
                      </div>
                      <div className={styles.coursesDots}>
                        {Array.from({ length: MAX_COURSES }).map((_, i) => (
                          <span
                            key={i}
                            className={styles.coursesDot}
                            style={{ background: i < selectedIds.length ? "#b3ff00" : "rgba(255,255,255,0.15)" }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Selected list */}
                    {coursesLoading ? (
                      <p className={styles.coursesEmpty}>Loading…</p>
                    ) : selectedCourses.length === 0 ? (
                      <p className={styles.coursesEmpty}>No courses added yet. Add up to {MAX_COURSES}.</p>
                    ) : (
                      <div className={styles.coursesList}>
                        {selectedCourses.map((course) => {
                          const busy = updatingId === course._id;
                          return (
                            <div key={course._id} className={styles.courseItem}>
                              <div>
                                <div className={styles.courseCode}>{course.code}</div>
                                <div className={styles.courseName}>{course.name}</div>
                              </div>
                              <button
                                onClick={() => handleDrop(course._id)}
                                disabled={busy}
                                className={styles.dropBtn}
                                style={{ opacity: busy ? 0.5 : 1 }}
                              >
                                {busy ? "…" : "Drop"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add / cancel button */}
                    {!isFull && (
                      <button
                        onClick={() => setShowPicker((p) => !p)}
                        className={`${styles.addCourseBtn} ${showPicker ? styles.addCourseBtnCancel : ""}`}
                      >
                        {showPicker ? "Cancel" : `+ Add Course (${MAX_COURSES - selectedIds.length} left)`}
                      </button>
                    )}

                    {isFull && (
                      <p className={styles.coursesMaxMsg}>Maximum {MAX_COURSES} courses reached.</p>
                    )}

                    {/* Picker dropdown */}
                    {showPicker && !isFull && (
                      <div className={styles.pickerDropdown}>
                        <input
                          type="text"
                          placeholder="Search courses…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className={styles.pickerSearch}
                        />
                        <div className={styles.pickerList}>
                          {availableCourses.length === 0 ? (
                            <p className={styles.coursesEmpty} style={{ margin: 0 }}>
                              {allCourses.length === 0 ? "No courses available." : "No matches."}
                            </p>
                          ) : (
                            availableCourses.map((course) => {
                              const busy = updatingId === course._id;
                              return (
                                <div key={course._id} className={styles.pickerItem}>
                                  <div>
                                    <div className={styles.pickerCode}>{course.code}</div>
                                    <div className={styles.pickerName}>{course.name}</div>
                                  </div>
                                  <button
                                    onClick={() => handleAdd(course._id)}
                                    disabled={busy}
                                    className={styles.addBtn}
                                    style={{ opacity: busy ? 0.5 : 1 }}
                                  >
                                    {busy ? "…" : "Add"}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardImg}>
                  <img src={feature.img} alt={feature.title} />
                </div>
              </>
            ) : (
              /* ── Regular Card ── */
              <>
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
              </>
            )}
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
