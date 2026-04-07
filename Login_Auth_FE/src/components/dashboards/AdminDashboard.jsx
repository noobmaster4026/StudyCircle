import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";

const COURSES_API = "http://localhost:3001/api/courses";

function AdminDashboard() {
  const userName = localStorage.getItem("userName") || "Admin";
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showUsersPanel, setShowUsersPanel] = useState(false);

  // Course launch state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ name: "", code: "", seatCapacity: "" });
  const [courseError, setCourseError] = useState("");
  const [courseSuccess, setCourseSuccess] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
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

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:3001/api/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(COURSES_API);
      const data = await res.json();
      if (res.ok) setCourses(data);
    } catch {
      setCourseError("Failed to load courses.");
    }
  };

  const handleOpenCourseModal = () => {
    setCourseForm({ name: "", code: "", seatCapacity: "" });
    setCourseError("");
    setCourseSuccess("");
    setEditingCourse(null);
    fetchCourses();
    setShowCourseModal(true);
  };

  const handleCourseFormChange = (e) => {
    setCourseForm({ ...courseForm, [e.target.name]: e.target.value });
    setCourseError("");
    setCourseSuccess("");
  };

  const handleCreateOrUpdate = async () => {
    const { name, code, seatCapacity } = courseForm;
    if (!name.trim() || !code.trim()) {
      setCourseError("Course name and code are required.");
      return;
    }
    setCourseLoading(true);
    setCourseError("");
    setCourseSuccess("");
    try {
      const url = editingCourse ? `${COURSES_API}/${editingCourse._id}` : COURSES_API;
      const method = editingCourse ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, seatCapacity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCourseError(data.message || "Something went wrong.");
      } else {
        setCourseSuccess(editingCourse ? "Course updated!" : "Course launched successfully!");
        setCourseForm({ name: "", code: "", seatCapacity: "" });
        setEditingCourse(null);
        fetchCourses();
      }
    } catch {
      setCourseError("Network error.");
    }
    setCourseLoading(false);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      seatCapacity: course.seatCapacity ?? "",
    });
    setCourseError("");
    setCourseSuccess("");
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course? Students will lose access.")) return;
    try {
      const res = await fetch(`${COURSES_API}/${id}`, { method: "DELETE" });
      if (res.ok) fetchCourses();
    } catch {
      setCourseError("Failed to delete course.");
    }
  };

  const handleBan = async (id, isBanned) => {
    await fetch(`http://localhost:3001/api/admin/ban/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned })
    });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await fetch(`http://localhost:3001/api/admin/users/${id}`, { method: "DELETE" });
      fetchUsers();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredUsers = filter === "all" ? users : users.filter(u => u.role === filter);
  const teacherCount = users.filter(u => u.role === "teacher").length;
  const studentCount = users.filter(u => u.role === "student").length;

  const features = [
    {
      num: "01. USERS",
      title: "All Users",
      desc: `Managing ${users.length} total users on the platform. View, search and manage all accounts.`,
      img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop",
      action: () => { setFilter("all"); setShowUsersPanel(true); },
      btnText: "View All Users"
    },
    {
      num: "02. TEACHERS",
      title: "Manage Teachers",
      desc: `${teacherCount} teacher(s) currently registered. Review their profiles and manage access.`,
      img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2664&auto=format&fit=crop",
      action: () => { setFilter("teacher"); setShowUsersPanel(true); },
      btnText: "View Teachers"
    },
    {
      num: "03. STUDENTS",
      title: "Manage Students",
      desc: `${studentCount} student(s) currently enrolled. Monitor their activity and manage accounts.`,
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop",
      action: () => { setFilter("student"); setShowUsersPanel(true); },
      btnText: "View Students"
    },
    {
      num: "04. COURSES",
      title: "View All Courses",
      desc: "Browse all courses available on the platform. Monitor content and ensure quality standards.",
      img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2670&auto=format&fit=crop",
      action: () => navigate("/admin/courses"),
      btnText: "View Courses"
    },
    {
      num: "05. LAUNCH",
      title: "Launch a Course",
      desc: "Create new courses for the platform. Students will be able to enroll immediately after launch.",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2670&auto=format&fit=crop",
      action: handleOpenCourseModal,
      btnText: "Launch Course"
    },
    {
      num: "06. MODERATION",
      title: "Ban / Delete Users",
      desc: "Enforce platform rules. Ban or remove users who violate community guidelines.",
      img: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop",
      action: () => { setFilter("all"); setShowUsersPanel(true); },
      btnText: "Moderate Users"
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
          <span className={styles.roleTag}>🛡️ Admin</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.revealText}>
          Welcome,<br />
          <span>{userName}!</span><br />
          Let's Manage.
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

      {/* Users Panel Modal */}
      {showUsersPanel && (
        <div className={styles.modalOverlay} onClick={() => setShowUsersPanel(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>👥 {filter === "all" ? "All Users" : filter === "teacher" ? "Teachers" : "Students"}</h3>

            <div className={styles.filterRow}>
              {["all", "teacher", "student"].map(f => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "teacher" ? "Teachers" : "Students"}
                </button>
              ))}
            </div>

            <div className={styles.userList}>
              {filteredUsers.length === 0 ? (
                <p className={styles.emptyMsg}>No users found.</p>
              ) : (
                filteredUsers.map(user => (
                  <div key={user._id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>👤 {user.name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles[user.role]}>{user.role}</span>
                      <span className={user.isBanned ? styles.banned : styles.activeStatus}>
                        {user.isBanned ? "Banned" : "Active"}
                      </span>
                    </div>
                    {user.role !== "admin" && (
                      <div className={styles.actions}>
                        <button
                          className={user.isBanned ? styles.unbanBtn : styles.banBtn}
                          onClick={() => handleBan(user._id, user.isBanned)}
                        >
                          {user.isBanned ? "Unban" : "Ban"}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowUsersPanel(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Course Launch Modal */}
      {showCourseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCourseModal(false)}>
          <div className={`${styles.modal} ${styles.courseModal}`} onClick={e => e.stopPropagation()}>
            <h3>🚀 {editingCourse ? "Edit Course" : "Launch a New Course"}</h3>

            {/* Form */}
            <div className={styles.courseForm}>
              <input
                className={styles.courseInput}
                type="text"
                name="name"
                placeholder="Course Name (e.g. Introduction to AI)"
                value={courseForm.name}
                onChange={handleCourseFormChange}
              />
              <input
                className={styles.courseInput}
                type="text"
                name="code"
                placeholder="Course Code (e.g. CS101)"
                value={courseForm.code}
                onChange={handleCourseFormChange}
              />
              <input
                className={styles.courseInput}
                type="number"
                name="seatCapacity"
                placeholder="Seat Capacity (optional, 0 = unlimited)"
                value={courseForm.seatCapacity}
                onChange={handleCourseFormChange}
                min="0"
              />

              {courseError && <p className={styles.courseError}>{courseError}</p>}
              {courseSuccess && <p className={styles.courseSuccess}>{courseSuccess}</p>}

              <div className={styles.courseFormBtns}>
                <button
                  className={styles.launchBtn}
                  onClick={handleCreateOrUpdate}
                  disabled={courseLoading}
                >
                  {courseLoading ? "Saving..." : editingCourse ? "Update Course" : "🚀 Launch Course"}
                </button>
                {editingCourse && (
                  <button
                    className={styles.cancelEditBtn}
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseForm({ name: "", code: "", seatCapacity: "" });
                      setCourseError("");
                      setCourseSuccess("");
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Existing Courses List */}
            <div className={styles.courseListSection}>
              <h4>Existing Courses ({courses.length})</h4>
              {courses.length === 0 ? (
                <p className={styles.emptyMsg}>No courses yet.</p>
              ) : (
                <div className={styles.courseItems}>
                  {courses.map(course => (
                    <div key={course._id} className={styles.courseItem}>
                      <div className={styles.courseItemInfo}>
                        <span className={styles.courseItemCode}>{course.code}</span>
                        <span className={styles.courseItemName}>{course.name}</span>
                        <span className={styles.courseItemSeats}>
                          {course.seatCapacity > 0 ? `${course.seatCapacity} seats` : "Unlimited"}
                        </span>
                      </div>
                      <div className={styles.courseItemActions}>
                        <button
                          className={styles.editCourseBtn}
                          onClick={() => handleEditCourse(course)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteCourseBtn}
                          onClick={() => handleDeleteCourse(course._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className={styles.closeBtn} onClick={() => setShowCourseModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <section className={styles.footer}>
        <p>© 2026 StudyCircle — Keep Managing 🛡️</p>
      </section>
    </div>
  );
}

export default AdminDashboard;