import React, { useState, useEffect } from 'react';
import streakService from '../../services/streakService';
import './StreakTracker.css';

const StreakTracker = () => {
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        badges: []
    });
    const [loading, setLoading] = useState(true);

    // Mock userId for demonstration (replace with actual auth context later)
    const MOCK_USER_ID = "64f1b2c3e4d5a6b7c8d9e0f1"; 

    useEffect(() => {
        fetchStreak();
        // eslint-disable-next-line
    }, []);

    const fetchStreak = async () => {
        try {
            setLoading(true);
            const data = await streakService.getStreakData(MOCK_USER_ID);
            if (data.streak) {
                setStreakData(data.streak);
            }
        } catch (error) {
            console.error("Failed to fetch streak data:", error);
            // Fallback UI if backend isn't connected
            if (!streakData.badges.length) {
                setStreakData({
                    currentStreak: 2,
                    longestStreak: 5,
                    badges: [
                        { name: 'Getting Started', description: 'Completed your first study session!', icon: '🚀', earnedAt: new Date().toISOString() }
                    ]
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogStudyActivity = async () => {
        try {
            const data = await streakService.logActivity(MOCK_USER_ID);
            setStreakData(data.streak);
            if (data.message === "Activity already logged for today.") {
                alert("You've already studied today! Great job, keep it up tomorrow.");
            } else {
                alert("Study session logged! Your streak has been updated.");
            }
        } catch (error) {
            console.error("Failed to log study activity:", error);
            alert("Could not log activity. Ensure backend is running.");
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading your achievements...</div>;
    }

    return (
        <div className="streak-tracker-container">
            <div className="streak-header">
                <h2>Your Study Journey</h2>
                <p>Consistency is key! Log your sessions daily to keep your flame burning and unlock badges.</p>
            </div>

            <div className="streak-stats-row">
                <div className="stat-card">
                    <span className="stat-icon">🔥</span>
                    <h3 className="stat-value">{streakData.currentStreak}</h3>
                    <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card longest">
                    <span className="stat-icon">⚡</span>
                    <h3 className="stat-value">{streakData.longestStreak}</h3>
                    <div className="stat-label">Longest Streak</div>
                </div>
            </div>

            <div className="badges-section">
                <h3>Achievement Badges</h3>
                <div className="badges-grid">
                    {streakData.badges && streakData.badges.length > 0 ? (
                        streakData.badges.map((badge, index) => (
                            <div className="badge-card" key={index}>
                                <span className="badge-icon">{badge.icon}</span>
                                <div className="badge-name">{badge.name}</div>
                                <div className="badge-desc">{badge.description}</div>
                                <div className="badge-date">Earned: {formatDate(badge.earnedAt)}</div>
                            </div>
                        ))
                    ) : (
                        <div className="no-badges">
                            You haven't earned any badges yet. Start studying to unlock them!
                        </div>
                    )}
                </div>
            </div>

            <div className="action-section">
                <button className="btn-log-study" onClick={handleLogStudyActivity}>
                    🎓 Simulate Finishing a Study Session
                </button>
                <p style={{marginTop: '15px', fontSize: '13px', color: '#718096'}}>
                    (In the real app, this happens automatically when you finish a pomodoro or class!)
                </p>
            </div>
        </div>
    );
};

export default StreakTracker;
