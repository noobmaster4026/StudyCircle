import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/reglog.css';

const API = 'http://localhost:5000/api/auth';

const VIEWS = {
    LANDING: 'landing',
    ROLE_SELECT: 'role_select',
    REGISTER: 'register',
    LOGIN: 'login',
};

export default function RegLog() {
    const navigate = useNavigate();

    const [view, setView] = useState(VIEWS.LANDING);
    const [role, setRole] = useState(null); // 'student' | 'teacher' | 'admin'
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoginChange = (e) => {
        setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const selectRole = (selectedRole) => {
        setRole(selectedRole);
        setView(VIEWS.REGISTER);
    };

    const goToAdminRegister = () => {
        setRole('admin');
        setView(VIEWS.REGISTER);
    };

    const goToLogin = () => { setView(VIEWS.LOGIN); };
    const goToRegister = () => { setView(VIEWS.ROLE_SELECT); };

    const goBack = () => {
        if (view === VIEWS.REGISTER) setView(VIEWS.ROLE_SELECT);
        else if (view === VIEWS.ROLE_SELECT) setView(VIEWS.LANDING);
        else if (view === VIEWS.LOGIN) setView(VIEWS.LANDING);
    };

    // ─── Register ────────────────────────────────────────────────
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (role !== 'admin' && form.password !== form.confirm) {
            toast.error('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Registration failed.');
            } else {
                // Registration successful — take user to login
                setForm({ name: '', email: '', password: '', confirm: '' });
                toast.success('Account created! Please sign in to continue.');
                setTimeout(() => {
                    setView(VIEWS.LOGIN);
                }, 1500);
            }
        } catch {
            toast.error('Could not connect to server. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    // ─── Login ───────────────────────────────────────────────────
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Login failed.');
            } else {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success(`Welcome back, ${data.user.name}! Redirecting…`);
                setTimeout(() => redirectByRole(data.user.role), 1000);
            }
        } catch {
            toast.error('Could not connect to server. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    // ─── Role-based redirect ──────────────────────────────────────
    const redirectByRole = (userRole) => {
        if (userRole === 'student') navigate('/student');
        else if (userRole === 'teacher') navigate('/teacher');
        else if (userRole === 'admin') navigate('/admin');
        else navigate('/home');
    };

    return (
        <div className="rl-root">
            {/* Background decoration */}
            <div className="rl-bg-blob rl-blob1" />
            <div className="rl-bg-blob rl-blob2" />

            <div className="rl-card">

                {/* ─── LANDING VIEW ─── */}
                {view === VIEWS.LANDING && (
                    <div className="rl-view rl-fade">
                        <div className="rl-brand">
                            <div className="rl-logo-wrap">
                                <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                                    <circle cx="19" cy="19" r="19" fill="#6C63FF" fillOpacity="0.12" />
                                    <path d="M10 26L19 12L28 26" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="19" cy="11" r="2.5" fill="#6C63FF" />
                                </svg>
                            </div>
                            <span className="rl-brand-name">StudyCircle</span>
                        </div>

                        <h1 className="rl-heading">Welcome back.</h1>
                        <p className="rl-subtext">Connect. Collaborate. Learn together.</p>

                        <div className="rl-actions">
                            <button
                                id="btn-get-started"
                                className="rl-btn rl-btn-primary"
                                onClick={() => setView(VIEWS.ROLE_SELECT)}
                            >
                                Get Started
                            </button>
                            <button
                                id="btn-sign-in"
                                className="rl-btn rl-btn-outline"
                                onClick={goToLogin}
                            >
                                Sign In
                            </button>
                        </div>

                        <p className="rl-footer-note">
                            A platform built for modern education
                        </p>
                    </div>
                )}

                {/* ─── ROLE SELECT VIEW ─── */}
                {view === VIEWS.ROLE_SELECT && (
                    <div className="rl-view rl-fade">
                        <button className="rl-back-btn" onClick={goBack}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M11 4L6 9L11 14" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        <div className="rl-brand">
                            <div className="rl-logo-wrap">
                                <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                                    <circle cx="19" cy="19" r="19" fill="#6C63FF" fillOpacity="0.12" />
                                    <path d="M10 26L19 12L28 26" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="19" cy="11" r="2.5" fill="#6C63FF" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="rl-heading" style={{ fontSize: '1.9rem' }}>I am a…</h2>
                        <p className="rl-subtext">Choose your role to create your account</p>

                        <div className="rl-role-grid">
                            <button
                                id="btn-role-student"
                                className="rl-role-card"
                                onClick={() => selectRole('student')}
                            >
                                <div className="rl-role-icon">
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                        <rect width="36" height="36" rx="10" fill="#EDE9FE" />
                                        <path d="M18 10L28 15V17L18 22L8 17V15L18 10Z" stroke="#6C63FF" strokeWidth="1.8" strokeLinejoin="round" />
                                        <path d="M12 18.5V24C14.5 25.5 21.5 25.5 24 24V18.5" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" />
                                        <line x1="28" y1="15" x2="28" y2="22" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span className="rl-role-label">Student</span>
                                <span className="rl-role-desc">Join classes, track progress, collaborate with peers</span>
                                <div className="rl-role-arrow">→</div>
                            </button>

                            <button
                                id="btn-role-teacher"
                                className="rl-role-card"
                                onClick={() => selectRole('teacher')}
                            >
                                <div className="rl-role-icon">
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                        <rect width="36" height="36" rx="10" fill="#EDE9FE" />
                                        <rect x="8" y="10" width="20" height="14" rx="2" stroke="#6C63FF" strokeWidth="1.8" />
                                        <line x1="8" y1="17" x2="28" y2="17" stroke="#6C63FF" strokeWidth="1.8" />
                                        <line x1="18" y1="24" x2="18" y2="28" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" />
                                        <line x1="13" y1="28" x2="23" y2="28" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" />
                                        <line x1="12" y1="13.5" x2="16" y2="13.5" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span className="rl-role-label">Teacher</span>
                                <span className="rl-role-desc">Create courses, manage students, share resources</span>
                                <div className="rl-role-arrow">→</div>
                            </button>
                        </div>

                        <p className="rl-switch-text">
                            Already have an account?{' '}
                            <button className="rl-link-btn" onClick={goToLogin}>Sign in</button>
                            {' '}&nbsp;·&nbsp;{' '}
                            <button className="rl-link-btn" onClick={goToAdminRegister}>Admin</button>
                        </p>
                    </div>
                )}

                {/* ─── REGISTER VIEW ─── */}
                {view === VIEWS.REGISTER && (
                    <div className="rl-view rl-fade">
                        <button className="rl-back-btn" onClick={goBack}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M11 4L6 9L11 14" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        <div className="rl-role-badge">
                            <span className={`rl-badge rl-badge-${role}`}>
                                {role === 'student'
                                    ? '🎓 Student'
                                    : role === 'teacher'
                                    ? '🖥️ Teacher'
                                    : '🔐 Admin'}
                            </span>
                        </div>

                        <h2 className="rl-heading" style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>
                            Create your account
                        </h2>
                        <p className="rl-subtext" style={{ marginBottom: '1.4rem' }}>
                            Start your journey with StudyCircle
                        </p>

                        <form className="rl-form" onSubmit={handleRegisterSubmit} noValidate>
                            <div className="rl-field-group">
                                <div className="rl-field">
                                    <label className="rl-label" htmlFor="reg-name">Full Name</label>
                                    <input
                                        className="rl-input"
                                        id="reg-name"
                                        name="name"
                                        type="text"
                                        placeholder="Jane Doe"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="rl-field">
                                    <label className="rl-label" htmlFor="reg-email">Email Address</label>
                                    <input
                                        className="rl-input"
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="rl-field">
                                    <label className="rl-label" htmlFor="reg-password">Password</label>
                                    <div className="rl-input-wrap">
                                        <input
                                            className="rl-input"
                                            id="reg-password"
                                            name="password"
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="rl-eye-btn"
                                            onClick={() => setShowPass((v) => !v)}
                                            aria-label="Toggle password visibility"
                                        >
                                            {showPass ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                                {role !== 'admin' && (
                                    <div className="rl-field">
                                        <label className="rl-label" htmlFor="reg-confirm">Confirm Password</label>
                                        <div className="rl-input-wrap">
                                            <input
                                                className="rl-input"
                                                id="reg-confirm"
                                                name="confirm"
                                                type={showConfirm ? 'text' : 'password'}
                                                placeholder="Repeat your password"
                                                value={form.confirm}
                                                onChange={handleChange}
                                                required={role !== 'admin'}
                                            />
                                            <button
                                                type="button"
                                                className="rl-eye-btn"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                aria-label="Toggle confirm password visibility"
                                            >
                                                {showConfirm ? '🙈' : '👁'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                id="btn-register-submit"
                                type="submit"
                                className="rl-btn rl-btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Creating account…' : 'Create Account'}
                            </button>
                        </form>

                        <p className="rl-switch-text" style={{ marginTop: '1.4rem' }}>
                            Already have an account?{' '}
                            <button className="rl-link-btn" onClick={goToLogin}>Sign in</button>
                        </p>
                    </div>
                )}

                {/* ─── LOGIN VIEW ─── */}
                {view === VIEWS.LOGIN && (
                    <div className="rl-view rl-fade">
                        <button className="rl-back-btn" onClick={goBack}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M11 4L6 9L11 14" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        <div className="rl-brand">
                            <div className="rl-logo-wrap">
                                <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                                    <circle cx="19" cy="19" r="19" fill="#6C63FF" fillOpacity="0.12" />
                                    <path d="M10 26L19 12L28 26" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="19" cy="11" r="2.5" fill="#6C63FF" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="rl-heading" style={{ fontSize: '1.9rem' }}>Sign in</h2>
                        <p className="rl-subtext" style={{ marginBottom: '1.6rem' }}>
                            Welcome back — let's pick up where you left off
                        </p>

                        <form className="rl-form" onSubmit={handleLoginSubmit} noValidate>
                            <div className="rl-field-group">
                                <div className="rl-field">
                                    <label className="rl-label" htmlFor="login-email">Email Address</label>
                                    <input
                                        className="rl-input"
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={loginForm.email}
                                        onChange={handleLoginChange}
                                        required
                                    />
                                </div>
                                <div className="rl-field">
                                    <label className="rl-label" htmlFor="login-password">Password</label>
                                    <div className="rl-input-wrap">
                                        <input
                                            className="rl-input"
                                            id="login-password"
                                            name="password"
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="Your password"
                                            value={loginForm.password}
                                            onChange={handleLoginChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="rl-eye-btn"
                                            onClick={() => setShowPass((v) => !v)}
                                            aria-label="Toggle password visibility"
                                        >
                                            {showPass ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rl-forgot-row">
                                <button type="button" className="rl-link-btn">Forgot password?</button>
                            </div>

                            <button
                                id="btn-login-submit"
                                type="submit"
                                className="rl-btn rl-btn-primary"
                                style={{ width: '100%', marginTop: '1rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <p className="rl-switch-text" style={{ marginTop: '1.4rem' }}>
                            Don't have an account?{' '}
                            <button className="rl-link-btn" onClick={goToRegister}>Get started</button>
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
