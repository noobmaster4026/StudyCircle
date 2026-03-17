import React, { useState } from "react";
import axios from "axios";
import styles from "./NoteUploadForm.module.css";

const NoteUploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setError("Title and file are required.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("course", course);
    formData.append("file", file);
    formData.append("uploadedBy", localStorage.getItem("userId") || "Anonymous");

    try {
      const response = await axios.post("http://localhost:3001/api/notes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTitle("");
      setDescription("");
      setFile(null);
      setCourse("");
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error uploading file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h3>Upload New Note/Slides</h3>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Title <span className={styles.red}>*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 4 Data Structures"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of these notes"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Course Name / Tag</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. CS101"
          />
        </div>
        <div className={styles.formGroup}>
          <label>File <span className={styles.red}>*</span></label>
          <input
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Uploading..." : "Upload Notes"}
        </button>
      </form>
    </div>
  );
};

export default NoteUploadForm;
