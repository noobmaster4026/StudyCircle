import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REMINDER_OPTIONS = [
    { label: '15 minutes before', value: 15 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
];

const ReminderPreferencesPanel = ({ onClose }) => {
    const userId = localStorage.getItem('userId');
    const [emailReminders, setEmailReminders] = useState(true);
    const [inAppReminders, setInAppReminders] = useState(true);
    const [reminderTimes, setReminderTimes] = useState([60]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load existing preferences on mount
    useEffect(() => {
        if (!userId) return;
        axios.get(`http://localhost:3001/api/users/${userId}`)
            .then(res => {
                const prefs = res.data.reminderPreferences;
                if (prefs) {
                    setEmailReminders(prefs.emailReminders ?? true);
                    setInAppReminders(prefs.inAppReminders ?? true);
                    setReminderTimes(prefs.reminderTimes ?? [60]);
                }
            })
            .catch(err => console.error('Failed to load preferences', err));
    }, [userId]);

    const toggleTime = (value) => {
        setReminderTimes(prev =>
            prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`http://localhost:3001/api/users/${userId}/preferences`, {
                emailReminders,
                inAppReminders,
                reminderTimes
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save preferences', err);
        } finally {
            setSaving(false);
        }
    };

    const panel = {
        padding: '14px',
        background: '#15152a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '0 0 12px 12px'
    };

    const label = { fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' };
    const toggle = { width: 14, height: 14, accentColor: '#8b5cf6' };
    const sectionTitle = { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' };

    return (
        <div style={panel}>
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label="Close reminder preferences"
                    style={{ float: 'right', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                >
                    ✕
                </button>
            )}
            <p style={sectionTitle}>🔔 Reminder Timing</p>
            {REMINDER_OPTIONS.map(opt => (
                <label key={opt.value} style={label}>
                    <input
                        type="checkbox"
                        style={toggle}
                        checked={reminderTimes.includes(opt.value)}
                        onChange={() => toggleTime(opt.value)}
                    />
                    {opt.label}
                </label>
            ))}

            <p style={{ ...sectionTitle, marginTop: 12 }}>📬 Channels</p>
            <label style={label}>
                <input type="checkbox" style={toggle} checked={inAppReminders} onChange={e => setInAppReminders(e.target.checked)} />
                In-app notifications
            </label>
            <label style={label}>
                <input type="checkbox" style={toggle} checked={emailReminders} onChange={e => setEmailReminders(e.target.checked)} />
                Email reminders
            </label>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    marginTop: 12, width: '100%', padding: '8px',
                    background: saved ? 'rgba(74,222,128,0.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: 8, color: 'white',
                    fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}
            >
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Preferences'}
            </button>
        </div>
    );
};

export default ReminderPreferencesPanel;
