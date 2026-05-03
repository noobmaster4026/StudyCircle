const Streak = require("../models/Streak");

// Helper function to check if two dates are consecutive days
const isConsecutiveDay = (lastDate, currentDate) => {
    if (!lastDate) return false;
    
    // Normalize to start of day for comparison
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(current - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays === 1;
};

// Helper function to check if two dates are the same day
const isSameDay = (lastDate, currentDate) => {
    if (!lastDate) return false;
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    return last.getFullYear() === current.getFullYear() &&
           last.getMonth() === current.getMonth() &&
           last.getDate() === current.getDate();
};

// Log study activity (called when a user finishes a session)
const logStudyActivity = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        let streakData = await Streak.findOne({ userId });
        const now = new Date();

        if (!streakData) {
            // First time logging activity
            streakData = new Streak({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastStudyDate: now,
                badges: [{
                    name: 'Getting Started',
                    description: 'Completed your first study session!',
                    icon: '🚀'
                }]
            });
        } else {
            // Already has streak data
            if (isSameDay(streakData.lastStudyDate, now)) {
                return res.status(200).json({ 
                    message: "Activity already logged for today.",
                    streak: streakData
                });
            } else if (isConsecutiveDay(streakData.lastStudyDate, now)) {
                // Streak continues
                streakData.currentStreak += 1;
            } else {
                // Streak broken
                streakData.currentStreak = 1;
            }

            // Update longest streak if necessary
            if (streakData.currentStreak > streakData.longestStreak) {
                streakData.longestStreak = streakData.currentStreak;
            }

            streakData.lastStudyDate = now;

            // Check for new badges
            const currentBadgeNames = streakData.badges.map(b => b.name);
            
            if (streakData.currentStreak >= 3 && !currentBadgeNames.includes('On a Roll')) {
                streakData.badges.push({ name: 'On a Roll', description: 'Hit a 3-day streak!', icon: '🔥' });
            }
            if (streakData.currentStreak >= 7 && !currentBadgeNames.includes('Week Warrior')) {
                streakData.badges.push({ name: 'Week Warrior', description: 'Studied every day for a week!', icon: '⚔️' });
            }
            if (streakData.currentStreak >= 30 && !currentBadgeNames.includes('Dedicated Scholar')) {
                streakData.badges.push({ name: 'Dedicated Scholar', description: 'Incredible 30-day streak!', icon: '👑' });
            }
        }

        await streakData.save();

        res.status(200).json({
            message: "Study activity logged successfully!",
            streak: streakData
        });

    } catch (error) {
        console.log("Error logging study activity:", error);
        res.status(500).json({ message: "Server error logging activity." });
    }
};

// Get user's current streak and badges
const getStreakData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        let streakData = await Streak.findOne({ userId });
        
        if (!streakData) {
            // Return empty state if not found
            return res.status(200).json({
                streak: {
                    userId,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastStudyDate: null,
                    badges: []
                }
            });
        }

        // If missed a day, visually show currentStreak as 0 for the frontend? 
        // We will keep the logic strictly database-driven. If they haven't logged today, 
        // the streak isn't technically "lost" until they try to log tomorrow and fail.
        // Or if it's > 1 day since last study, it's definitively lost.
        const now = new Date();
        const last = new Date(streakData.lastStudyDate);
        last.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(Math.abs(now - last) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            streakData.currentStreak = 0; 
            // We don't save this zero immediately unless we want to reset it in DB too.
            // Saving it keeps the DB accurate without waiting for the next action.
            await streakData.save();
        }

        res.status(200).json({ streak: streakData });

    } catch (error) {
        console.log("Error fetching streak data:", error);
        res.status(500).json({ message: "Server error fetching streak data." });
    }
};

module.exports = {
    logStudyActivity,
    getStreakData
};
