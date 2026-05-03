import React, { useState, useEffect } from 'react';
import bookmarkService from '../../services/bookmarkService';
import './Bookmarks.css';

const Bookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // For creating a new bookmark
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        description: '',
        subject: '',
        topic: '',
        resourceType: 'link'
    });

    // For filtering
    const [filters, setFilters] = useState({
        subject: '',
        topic: ''
    });

    // Mock userId for demonstration (replace with actual auth context later)
    const MOCK_USER_ID = "64f1b2c3e4d5a6b7c8d9e0f1"; 

    useEffect(() => {
        fetchBookmarks();
        // eslint-disable-next-line
    }, [filters]);

    const fetchBookmarks = async () => {
        try {
            setLoading(true);
            const data = await bookmarkService.getBookmarks(filters);
            setBookmarks(data.bookmarks || []);
        } catch (error) {
            console.error("Failed to fetch bookmarks:", error);
            // Fallback for UI testing if backend is not running
            if (bookmarks.length === 0) {
                 setBookmarks([
                    { _id: '1', title: 'React Documentation', url: 'https://reactjs.org', subject: 'Web Development', topic: 'React', resourceType: 'link', description: 'Official docs for React' },
                    { _id: '2', title: 'Node.js Crash Course', url: 'https://youtube.com', subject: 'Backend', topic: 'Node.js', resourceType: 'video', description: 'Great beginner tutorial' }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Append the logged-in user's ID
            const newBookmarkData = { ...formData, uploadedBy: MOCK_USER_ID };
            await bookmarkService.createBookmark(newBookmarkData);
            
            // Reset form
            setFormData({
                title: '', url: '', description: '', subject: '', topic: '', resourceType: 'link'
            });
            
            // Refresh list
            fetchBookmarks();
            alert('Bookmark saved successfully!');
        } catch (error) {
            console.error("Failed to create bookmark:", error);
            alert('Failed to save bookmark. Make sure backend is running.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this bookmark?')) {
            try {
                await bookmarkService.deleteBookmark(id);
                fetchBookmarks();
            } catch (error) {
                console.error("Failed to delete bookmark:", error);
            }
        }
    };

    const getResourceIcon = (type) => {
        switch(type) {
            case 'video': return '🎥';
            case 'document': return '📄';
            default: return '🔗';
        }
    };

    return (
        <div className="bookmarks-container">
            <div className="bookmarks-header">
                <h2>Categorized Resource Bookmarks</h2>
                <p>Save and organize your useful links, videos, and documents by subject and topic.</p>
            </div>

            <div className="bookmarks-layout">
                {/* Add Bookmark Form */}
                <div className="add-bookmark-section">
                    <h3>Add New Resource</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Intro to MongoDB" />
                        </div>
                        <div className="form-group">
                            <label>URL / Link *</label>
                            <input type="url" name="url" value={formData.url} onChange={handleInputChange} required placeholder="https://..." />
                        </div>
                        <div className="form-group">
                            <label>Subject *</label>
                            <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="e.g., Database Management" />
                        </div>
                        <div className="form-group">
                            <label>Topic</label>
                            <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} placeholder="e.g., NoSQL" />
                        </div>
                        <div className="form-group">
                            <label>Resource Type</label>
                            <select name="resourceType" value={formData.resourceType} onChange={handleInputChange}>
                                <option value="link">Web Link</option>
                                <option value="video">Video</option>
                                <option value="document">Document (PDF, Docs)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief note about this resource..." />
                        </div>
                        <button type="submit" className="btn-primary">Save Bookmark</button>
                    </form>
                </div>

                <div className="bookmarks-list-section">
                    {/* Filters */}
                    <div className="filter-section" style={{ marginBottom: '20px' }}>
                        <h3>Filter Resources</h3>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <input type="text" name="subject" value={filters.subject} onChange={handleFilterChange} placeholder="Filter by Subject..." />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <input type="text" name="topic" value={filters.topic} onChange={handleFilterChange} placeholder="Filter by Topic..." />
                            </div>
                        </div>
                    </div>

                    {/* Bookmarks Grid */}
                    {loading ? (
                        <div style={{textAlign: 'center', padding: '20px'}}>Loading...</div>
                    ) : bookmarks.length > 0 ? (
                        <div className="bookmarks-grid">
                            {bookmarks.map((bookmark) => (
                                <div className="bookmark-card" key={bookmark._id}>
                                    <div className="bookmark-header">
                                        <h4>{bookmark.title}</h4>
                                        <span className="resource-icon" title={bookmark.resourceType}>
                                            {getResourceIcon(bookmark.resourceType)}
                                        </span>
                                    </div>
                                    <div className="bookmark-tags">
                                        <span className="tag">{bookmark.subject}</span>
                                        {bookmark.topic && <span className="tag topic-tag">{bookmark.topic}</span>}
                                    </div>
                                    <p className="bookmark-description">{bookmark.description}</p>
                                    <div className="bookmark-actions">
                                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="btn-link">
                                            Open Resource
                                        </a>
                                        <button onClick={() => handleDelete(bookmark._id)} className="btn-delete">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-bookmarks">
                            <p>No resources found. Add a bookmark to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Bookmarks;
