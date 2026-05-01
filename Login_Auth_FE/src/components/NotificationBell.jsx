import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import ReminderPreferencesPanel from './ReminderPreferencesPanel';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);
    const userId = localStorage.getItem("userId");

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const res = await axios.get(`http://localhost:3001/api/notifications/${userId}`);
            setNotifications(res.data);
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`http://localhost:3001/api/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) await handleMarkAsRead(n._id);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Bell button */}
            <button
                onClick={() => { setShowDropdown(!showDropdown); setShowPrefs(false); }}
                style={{
                    background: 'transparent', border: 'none',
                    color: 'white', cursor: 'pointer',
                    position: 'relative', display: 'flex',
                    alignItems: 'center', padding: '8px'
                }}
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
                        background: '#ef4444', color: 'white', borderRadius: '50%',
                        width: 16, height: 16, fontSize: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700
                    }}>{unreadCount}</span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute', top: '42px', right: 0,
                    width: '300px', background: '#1e1e2f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    maxHeight: '500px', overflowY: 'auto'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>🔔 Notifications</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} style={{ fontSize: 11, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setShowPrefs(!showPrefs)}
                                title="Reminder Settings"
                                style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
                            >
                                ⚙️
                            </button>
                        </div>
                    </div>

                    {/* Preferences panel (togglable) */}
                    {showPrefs && <ReminderPreferencesPanel onClose={() => setShowPrefs(false)} />}

                    {/* Notifications list */}
                    <div style={{ padding: '8px 10px' }}>
                        {notifications.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '16px 0' }}>
                                No notifications yet 👋
                            </p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                                    style={{
                                        padding: '10px', borderRadius: 8, marginBottom: 6,
                                        background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.1)',
                                        cursor: n.isRead ? 'default' : 'pointer',
                                        borderLeft: n.isRead ? '3px solid transparent' : '3px solid #8b5cf6'
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, color: n.isRead ? 'rgba(255,255,255,0.6)' : '#fff' }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                                        {new Date(n.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
