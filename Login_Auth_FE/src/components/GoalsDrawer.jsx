import React, { useState, useEffect } from "react";
import styles from "./GoalsDrawer.module.css";

function GoalsDrawer({ isOpen, onClose }) {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (isOpen) fetchGoals();
  }, [isOpen]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/goals/${userId}`);
      const data = await res.json();
      setGoals(data);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    }
  };

  const addGoal = async () => {
    if (!title.trim()) return setError("Please enter a goal title");
    if (!deadline) return setError("Please select a deadline");
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, deadline, completed: false })
      });
      const newGoal = await res.json();
      setGoals([...goals, newGoal]);
      setTitle("");
      setDeadline("");
    } catch (err) {
      console.error("Failed to add goal", err);
    }
  };

  const toggleComplete = async (goal) => {
    try {
      const res = await fetch(`http://localhost:3001/api/goals/${goal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !goal.completed })
      });
      const updated = await res.json();
      setGoals(goals.map(g => g._id === updated._id ? updated : g));
    } catch (err) {
      console.error("Failed to update goal", err);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/goals/${id}`, { method: "DELETE" });
      setGoals(goals.filter(g => g._id !== id));
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length === 0 ? 0 : Math.round((completedCount / goals.length) * 100);

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>📚 Study Goals</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.progressSection}>
          <p className={styles.progressText}>{completedCount}/{goals.length} goals completed</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressPercent}>{progress}%</p>
        </div>

        <div className={styles.addSection}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter your goal..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="date"
            className={styles.input}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.addBtn} onClick={addGoal}>+ Add Goal</button>
        </div>

        <div className={styles.goalsList}>
          {goals.length === 0 && (
            <p className={styles.noGoals}>No goals yet. Add one above!</p>
          )}
          {goals.map((goal) => (
            <div key={goal._id} className={`${styles.goalItem} ${goal.completed ? styles.completed : ""}`}>
              <div className={styles.goalInfo}>
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => toggleComplete(goal)}
                  className={styles.checkbox}
                />
                <div>
                  <p className={styles.goalTitle}>{goal.title}</p>
                  <p className={styles.goalDeadline}>
                    📅 {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={() => deleteGoal(goal._id)}>🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default GoalsDrawer;