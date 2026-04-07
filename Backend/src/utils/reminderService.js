const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/user');
const Goal = require('../models/goal');

// ─── Separate connection to MeetingServer DB ──────────────────────────────────
const MEETING_DB_URI = process.env.MEETING_DB_URI || 'mongodb://localhost:27017/meeting-app';
let meetingConn = null;

const getMeetingConnection = async () => {
    try {
        if (meetingConn && meetingConn.readyState === 1) return meetingConn;
        meetingConn = await mongoose.createConnection(MEETING_DB_URI).asPromise();
        return meetingConn;
    } catch (err) {
        console.error('[Reminder] Meeting DB connection failed:', err.message);
        return null;
    }
};

// ─── Email Transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

// ─── Send reminder email ──────────────────────────────────────────────────────
const sendReminderEmail = async (toEmail, userName, subject, body) => {
    console.log(`[EMAIL DEBUG] Attempting to send to ${toEmail}...`);
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
        console.log(`[EMAIL PLACEHOLDER] → ${toEmail} | ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"StudyCircle" <${process.env.SMTP_EMAIL}>`,
            to: toEmail,
            subject,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;background:#0a0a1a;color:white;border-radius:12px;">
                    <h2 style="color:#8b5cf6;">StudyCircle Reminder 🎓</h2>
                    <p>Hi <strong>${userName}</strong>,</p>
                    <p>${body}</p>
                    <p style="color:#a0a0b0;">Keep studying! 🚀</p>
                    <hr style="border-color:rgba(255,255,255,0.1);" />
                    <small style="color:#606080;">StudyCircle — CSE470 Section 12, Group 8</small>
                </div>
            `
        });
        console.log(`[EMAIL SENT SUCCESS] → ${toEmail}`);
    } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send to ${toEmail}:`, err.message);
        if (err.message.includes('Invalid login')) {
            console.error('  TIP: Ensure "Less Secure App Access" is ON or use an App Password.');
        }
    }
};


// ─── Create in-app notification ───────────────────────────────────────────────
const triggerNotification = async (userId, title, message, relatedId, windowMinutes, emailInfo) => {
    // Check if ALREADY SENT for this specific window
    const exists = await Notification.findOne({ userId, relatedId, meta: windowMinutes });
    if (exists) return; // Prevent duplicates

    // Save In-App
    await new Notification({ userId, title, message, type: 'reminder', relatedId, meta: windowMinutes }).save();

    // Send Email if allowed
    if (emailInfo) {
        await sendReminderEmail(emailInfo.to, emailInfo.name, emailInfo.subject, emailInfo.body);
    }
};

// ─── Main Cron Service ────────────────────────────────────────────────────────
const startReminderService = async () => {
    console.log('📅 Reminder Service checking config...');
    
    // Verify SMTP on startup
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASS) {
        try {
            await transporter.verify();
            console.log('✅ SMTP Transporter Verified & Ready');
        } catch (err) {
            console.error('❌ SMTP Verification Failed:', err.message);
        }
    } else {
        console.log('⚠️ SMTP Credentials missing. Emails will be in PLACEHOLDER mode.');
    }

    console.log('📅 Reminder Service started. Running every minute.');

    cron.schedule('* * * * *', async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                console.log('[CRON] Waiting for main DB connection...');
                return;
            }

            const now = new Date();
            console.log(`[CRON] Reminder check @ ${now.toLocaleTimeString()}`);

            // ── 1. GOAL DEADLINE REMINDERS ────────────────────────────────────
            const goals = await Goal.find({ completed: false, deadline: { $gt: now } });
            const users = await User.find({ _id: { $in: goals.map(g => g.userId) } });
            const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

            for (const goal of goals) {
                const user = userMap[goal.userId.toString()];
                if (!user) continue;
                const prefs = user.reminderPreferences || {};
                const triggerTimes = prefs.reminderTimes?.length > 0 ? prefs.reminderTimes : [60];

                const diffMins = (goal.deadline - now) / 60000;

                for (const t of triggerTimes) {
                    // Fire if we are within the window (e.g. diff <= 15 mins) AND haven't sent yet
                    if (diffMins <= t) {
                        const timeLabel = t === 1440 ? '1 day' : t === 60 ? '1 hour' : `${t} minutes`;
                        
                        await triggerNotification(
                            user._id, 
                            'Goal Deadline Reminder',
                            `Your goal "${goal.title}" is due in ${timeLabel}.`,
                            goal._id.toString(),
                            t,
                            (prefs.emailReminders !== false) ? {
                                to: user.email, name: user.name,
                                subject: `⏰ Goal "${goal.title}" due soon`,
                                body: `Your study goal <strong>"${goal.title}"</strong> is due in <strong>${timeLabel}</strong>.`
                            } : null
                        );
                    }
                }
            }

            // ── 2. STUDY SESSION REMINDERS ────────────────────────────────────
            const conn = await getMeetingConnection();
            if (conn) {
                const MeetingModel = conn.models.Meeting || conn.model('Meeting', new mongoose.Schema({
                    title: String, hostUserId: String, scheduledAt: Date, participantUserIds: [String], isActive: Boolean
                }));

                const sessions = await MeetingModel.find({ isActive: true, scheduledAt: { $gt: now } });
                for (const session of sessions) {
                    if (!session.scheduledAt) continue;
                    const allUserIds = [...new Set([...(session.participantUserIds || []), session.hostUserId].filter(Boolean))];
                    const sessionUsers = await User.find({ _id: { $in: allUserIds } });
                    const diffMins = (session.scheduledAt - now) / 60000;

                    for (const user of sessionUsers) {
                        const prefs = user.reminderPreferences || {};
                        const triggerTimes = prefs.reminderTimes?.length > 0 ? prefs.reminderTimes : [60];

                        for (const t of triggerTimes) {
                            if (diffMins <= t) {
                                const timeLabel = t === 1440 ? '1 day' : t === 60 ? '1 hour' : `${t} minutes`;
                                await triggerNotification(
                                    user._id,
                                    'Study Session Starting Soon',
                                    `Your session "${session.title}" starts in ${timeLabel}!`,
                                    session._id.toString(),
                                    t,
                                    (prefs.emailReminders !== false) ? {
                                        to: user.email, name: user.name,
                                        subject: `📹 Session "${session.title}" starts soon`,
                                        body: `Your study session <strong>"${session.title}"</strong> starts in <strong>${timeLabel}</strong>.`
                                    } : null
                                );
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('[CRON Error]', error.message);
        }
    });
};

module.exports = startReminderService;
