import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NoteUploadForm from '../components/NoteUploadForm';
import NotesList from '../components/NotesList';
import styles from './NotesPage.module.css';

const NotesPage = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [courseFilter, setCourseFilter] = useState('');

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const url = courseFilter
                ? `http://localhost:3001/api/notes?course=${courseFilter}`
                : 'http://localhost:3001/api/notes';
            const response = await axios.get(url);
            setNotes(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load notes. Please try again later.');
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [courseFilter]);

    const handleUploadSuccess = (newNote) => {
        // Option 1: fetch all notes again to ensure correct sorting/population
        fetchNotes();
        // Option 2: Prepend to state (requires manual population of user details if needed immediately)
        // setNotes(prev => [newNote, ...prev]);
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        try {
            await axios.delete(`http://localhost:3001/api/notes/${noteId}`);
            setNotes(prev => prev.filter(note => note._id !== noteId));
        } catch (err) {
            alert('Failed to delete note. You may not have permission.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    &larr; Back to Dashboard
                </button>
                <h2>Shared Notes & Slides</h2>
                <p>Upload, share, and collaborate on study materials with your peers.</p>
            </div>

            <div className={styles.content}>
                <div className={styles.sidebar}>
                    <NoteUploadForm onUploadSuccess={handleUploadSuccess} />
                </div>

                <div className={styles.mainArea}>
                    <div className={styles.filterSection}>
                        <label>Filter by Course:</label>
                        <input
                            type="text"
                            placeholder="e.g. CS101"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className={styles.filterInput}
                        />
                        {courseFilter && (
                            <button
                                className={styles.clearBtn}
                                onClick={() => setCourseFilter('')}
                            >
                                Clear x
                            </button>
                        )}
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    {loading ? (
                        <div className={styles.loader}>Loading notes...</div>
                    ) : (
                        <NotesList notes={notes} onDelete={handleDelete} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesPage;
