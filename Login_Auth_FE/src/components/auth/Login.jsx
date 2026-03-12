import React, { useState, useRef } from "react";
import authStyles from "./auth.module.css";
import styles from "./Login.module.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ show/hide password
  const videoRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const navigateByRole = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "teacher") navigate("/teacher");
    else navigate("/student");
  };

  const updateVideo = (videoFile) => {
    if (videoRef.current) {
      videoRef.current.src = `/${videoFile}`;
      videoRef.current.load();
      videoRef.current.play();
    }
  };

  const submitCall = async (data) => {
    setServerError("");
    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        updateVideo("correct.mp4");
        localStorage.setItem("userName", result.name);
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("userRole", result.role);
        setTimeout(() => navigateByRole(result.role), 1500);
      } else {
        if (result.message === "Incorrect password") {
          updateVideo("wrong.mp4");
        } else {
          updateVideo("againwrong.mp4");
        }
        setServerError(result.message);
      }
    } catch (error) {
      setServerError("Could not connect to the server. Is your backend running?");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginContainer}>

        {/* Video Panel */}
        <div className={styles.videoPanel}>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            src="/1026.mp4"
          />
        </div>

        {/* Login Panel */}
        <div className={styles.loginPanel}>
          <h2>Welcome Back!</h2>
          <p>Sign in to continue to StudyCircle</p>

          {serverError && (
            <p className={authStyles.serverError}>{serverError}</p>
          )}

          <form onSubmit={handleSubmit(submitCall)}>

            <div className={authStyles.inputGroup}>
              <label htmlFor="email" className={authStyles.label}>Email</label>
              <input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Enter a valid email"
                  }
                })}
                type="email"
                className={authStyles.input}
                placeholder="Enter your email"
              />
              {errors.email && <p className={authStyles.error}>{errors.email.message}</p>}
            </div>

            {/* ✅ removed role dropdown */}

            <div className={authStyles.inputGroup}>
              <label htmlFor="password" className={authStyles.label}>Password</label>
              <div className={authStyles.passwordWrapper}>
                <input
                  id="password"
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"} // ✅ toggle type
                  className={authStyles.input}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className={authStyles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
              {errors.password && <p className={authStyles.error}>{errors.password.message}</p>}
            </div>

            <button type="submit" className={authStyles.submitButton}>
              Sign In
            </button>
          </form>

          <p className={authStyles.toggleText}>
            Don't have an account?{" "}
            <a href="/" className={authStyles.toggleLink}>Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;