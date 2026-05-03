import React, { useState } from "react";
import styles from "./auth.module.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({ mode: "onBlur" });

  const navigateByRole = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "teacher") navigate("/teacher");
    else navigate("/student");
  };

  const submitCall = async (data) => {
    setServerError("");
    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (response.ok) {
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("userRole", result.role);
        reset();
        navigateByRole(result.role);
      } else {
        setServerError(result.message);
      }
    } catch (error) {
      console.error("Connection error:", error);
      setServerError("Could not connect to the server. Is your backend running?");
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit(submitCall)}>
        <h2 className={styles.authTitle}>Create an Account</h2>

        {serverError && (
          <p className={styles.serverError}>{serverError}</p>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>Full Name</label>
          <input
            id="name"
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 5,
                message: "Name must be at least 5 characters!!"
              }
            })}
            type="text"
            className={styles.input}
            placeholder="Enter your full name"
          />
          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
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
            className={styles.input}
            placeholder="Enter your email"
          />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="mobile" className={styles.label}>Mobile No.</label>
          <input
            id="mobile"
            {...register("mobile", {
              required: "Mobile number is required",
              pattern: {
                value: /^[0-9]{11}$/,
                message: "Mobile number must be exactly 11 digits"
              }
            })}
            type="tel"
            className={styles.input}
            placeholder="Enter your mobile no."
          />
          {errors.mobile && <p className={styles.error}>{errors.mobile.message}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="role" className={styles.label}>Register As</label>
          <select
            id="role"
            {...register("role", { required: "Please select a role" })}
            className={styles.input}
          >
            <option value="">-- Select Role --</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className={styles.error}>{errors.role.message}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            {...register("password", {
              required: "Password is required",
              validate: (value) => {
                const errs = [];
                if (value.length < 8)
                  errs.push("At least 8 characters");
                if (!/[A-Z]/.test(value))
                  errs.push("At least one capital letter");
                if (!/[a-z]/.test(value))
                  errs.push("At least one lowercase letter");
                if (!/[0-9]/.test(value))
                  errs.push("At least one number");
                if (!/[!@#$%^&*]/.test(value))
                  errs.push("At least one special character (!@#$%^&*)");
                return errs.length === 0 || errs.join("\n");
              }
            })}
            type="password"
            className={styles.input}
            placeholder="Enter your password"
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        <button type="submit" className={styles.submitButton}>
          Register
        </button>

        <p className={styles.toggleText}>
          Already have an account?{" "}
          <a href="/login" className={styles.toggleLink}>Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
