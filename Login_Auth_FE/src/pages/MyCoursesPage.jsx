import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MyCoursesPage.module.css";

const COURSES_API = "http://localhost:3001/api/courses";
const USERS_API   = "http://localhost:3001/api/users";
const MAX_COURSES = 4;

const MyCoursesPage = () => {
  const navigate = useNavigate();

  const [allCourses,  setAllCourses]  = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [search,      setSearch]      = useState("");
  const [error,       setError]       = useState("");

  const userId = useMemo(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) return storedUserId;

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      return storedUser?.id || storedUser?._id || "";
    } catch {
      return "";
    }
  }, []);

  // Load all available courses
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(COURSES_API);
        const data = await res.json();
        if (res.ok) setAllCourses(data);
        else setError("Failed to load courses.");
      } catch {
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load this student's enrolled course IDs
  useEffect(() => {
    if (!userId) {
      setError("Please log in again before adding courses.");
      return;
    }

    const load = async () => {
      try {
        const res  = await fetch(`${USERS_API}/${userId}/courses`);
        const data = await res.json();
        if (res.ok) {
          setSelectedIds((data.courses || []).map((c) =>
            typeof c === "string" ? c : c._id
          ));
        } else {
          setError(data.message || "Failed to load your enrolled courses.");
        }
      } catch {
        setError("Could not load your enrolled courses.");
      }
    };
    load();
  }, [userId]);

  const selectedCourses  = allCourses.filter((c) => selectedIds.includes(c._id));
  const availableCourses = allCourses
    .filter((c) => !selectedIds.includes(c._id))
    .filter((c) =>
      search.trim()
        ? c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase())
        : true
    );

  const handleAdd = async (courseId) => {
    if (selectedIds.length >= MAX_COURSES) return;
    if (!userId) {
      setError("Please log in again before adding courses.");
      return;
    }

    setUpdatingId(courseId);
    setError("");
    try {
      const res  = await fetch(`${USERS_API}/${userId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds((data.courses || []).map((c) =>
          typeof c === "string" ? c : c._id
        ));
      } else {
        setError(data.message || "Failed to add course.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDrop = async (courseId) => {
    if (!userId) {
      setError("Please log in again before dropping courses.");
      return;
    }

    setUpdatingId(courseId);
    setError("");
    try {
      const res  = await fetch(`${USERS_API}/${userId}/courses/${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds((data.courses || []).map((c) =>
          typeof c === "string" ? c : c._id
        ));
      } else {
        setError(data.message || "Failed to drop course.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const isFull = selectedIds.length >= MAX_COURSES;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          &larr; Back to Dashboard
        </button>
        <h2>My Courses</h2>
        <p>Add and manage your enrolled courses. You can select up to {MAX_COURSES} courses.</p>
        {error && <p className={styles.errorBanner}>{error}</p>}
      </div>

      <div className={styles.content}>

        {/* Enrolled courses */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Enrolled Courses</h3>
            <div className={styles.dots}>
              {Array.from({ length: MAX_COURSES }).map((_, i) => (
                <span
                  key={i}
                  className={styles.dot}
                  style={{ background: i < selectedIds.length ? "#b3ff00" : "rgba(255,255,255,0.15)" }}
                />
              ))}
              <span className={styles.slotLabel}>{selectedIds.length} / {MAX_COURSES}</span>
            </div>
          </div>

          {loading ? (
            <p className={styles.emptyMsg}>Loading courses...</p>
          ) : selectedCourses.length === 0 ? (
            <p className={styles.emptyMsg}>You have not added any courses yet.</p>
          ) : (
            <div className={styles.coursesList}>
              {selectedCourses.map((course) => {
                const busy = updatingId === course._id;
                return (
                  <div key={course._id} className={styles.enrolledCard}>
                    <div className={styles.courseInfo}>
                      <span className={styles.courseCode}>{course.code}</span>
                      <span className={styles.courseName}>{course.name}</span>
                      {course.description && (
                        <span className={styles.courseDesc}>{course.description}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDrop(course._id)}
                      disabled={busy}
                      className={styles.dropBtn}
                      style={{ opacity: busy ? 0.5 : 1 }}
                    >
                      {busy ? "..." : "Drop"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {isFull && (
            <div className={styles.fullBanner}>
              You have reached the maximum of {MAX_COURSES} courses.
            </div>
          )}
        </div>

        {/* Add a course */}
        {!isFull && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Add a Course</h3>
              <span className={styles.slotLabel}>
                {MAX_COURSES - selectedIds.length} slot{MAX_COURSES - selectedIds.length !== 1 ? "s" : ""} left
              </span>
            </div>

            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />

            {loading ? (
              <p className={styles.emptyMsg}>Loading...</p>
            ) : availableCourses.length === 0 ? (
              <p className={styles.emptyMsg}>
                {allCourses.length === 0 ? "No courses available." : "No matches found."}
              </p>
            ) : (
              <div className={styles.availableList}>
                {availableCourses.map((course) => {
                  const busy = updatingId === course._id;
                  return (
                    <div key={course._id} className={styles.availableCard}>
                      <div className={styles.courseInfo}>
                        <span className={styles.courseCode}>{course.code}</span>
                        <span className={styles.courseName}>{course.name}</span>
                        {course.description && (
                          <span className={styles.courseDesc}>{course.description}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(course._id)}
                        disabled={busy}
                        className={styles.addBtn}
                        style={{ opacity: busy ? 0.5 : 1 }}
                      >
                        {busy ? "..." : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyCoursesPage;
