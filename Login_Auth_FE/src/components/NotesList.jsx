import React from "react";
import styles from "./NotesList.module.css";

const NotesList = ({ notes, onDelete }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No notes or slides uploaded yet. Be the first to share!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const currentUserId = localStorage.getItem("userId");
  const isAdmin = localStorage.getItem("role") === "admin";

  return (
    <div className={styles.notesGrid}>
      {notes.map((note) => (
        <div key={note._id} className={styles.noteCard}>
          <div className={styles.cardHeader}>
            <h4>{note.title}</h4>
            {note.course && <span className={styles.courseTag}>{note.course}</span>}
          </div>

          {note.description && <p className={styles.description}>{note.description}</p>}

          <div className={styles.metaData}>
            <span className={styles.uploader}>
              By: {note.uploadedBy ? note.uploadedBy.name : "Unknown"}
            </span>
            <span className={styles.date}>{formatDate(note.createdAt)}</span>
          </div>

          <div className={styles.actions}>
            <a
              href={"http://localhost:3001" + note.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadBtn}
              download={note.fileName}
            >
              View / Download
            </a>

            {(currentUserId === (note.uploadedBy?._id || note.uploadedBy) || isAdmin) && (
              <button
                onClick={() => onDelete(note._id)}
                className={styles.deleteBtn}
                title="Delete Note"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesList;
