"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCredentials } from "@/store/authSlice";
import { useLoginMutation } from "@/store/auth.api";
import { COLORS } from "@/lib/colors";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [login, { isLoading, error }] = useLoginMutation();

  const errorMessage =
    error && "data" in error
      ? (error.data as { message?: string })?.message || "Login failed"
      : error
        ? "Login failed"
        : null;

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          employee: result.employee,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
      router.push("/dashboard");
    } catch {
      // error handled by RTK Query
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.darkIndigo} 0%, #2D1B4E 40%, ${COLORS.mauveDark} 100%)`,
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 20,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: "100%", maxWidth: 440,
          animation: "fadeIn 0.6s ease both",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }} className ={"flex justify-center items-center"}>
          <img
            src="/property360roundNoBg.png"
            alt="Property 360 - A Higher Form of Realty"
            style={{
              maxWidth: 280,
              width: "100%",
              height: "auto",
              filter: "brightness(0) invert(1)",  // Makes logo white to show on dark background
              objectFit: "contain",
            }}
          />
        </div>

        {/* Card */}
        <div
          style={{
            background: COLORS.white,
            borderRadius: 24,
            padding: "40px 36px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Top gradient line */}
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${COLORS.mauve}, ${COLORS.gold}, ${COLORS.mauve})`,
            }}
          />

          <h2
            style={{
              margin: "0 0 8px", fontSize: 24, fontWeight: 800,
              color: COLORS.darkIndigo,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Welcome Back
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: COLORS.mauve }}>
            Sign in to your CRM account
          </p>

          {errorMessage && (
            <div
              style={{
                padding: "12px 16px", borderRadius: 10,
                background: COLORS.dangerLight, color: COLORS.danger,
                fontSize: 13, fontWeight: 600, marginBottom: 20,
                border: `1px solid ${COLORS.danger}30`,
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo,
                  display: "block", marginBottom: 6, letterSpacing: "0.5px",
                }}
              >
                Email Address
              </label>
              <div
                style={{
                  display: "flex", alignItems: "center",
                  border: `1.5px solid ${COLORS.lavender}60`,
                  borderRadius: 12, padding: "0 14px",
                  transition: "border-color 0.2s",
                }}
              >
                <FiMail size={18} color={COLORS.mauve} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@property360.com"
                  required
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "14px 12px",
                    fontSize: 14, color: COLORS.darkIndigo, background: "transparent",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo,
                  display: "block", marginBottom: 6, letterSpacing: "0.5px",
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: "flex", alignItems: "center",
                  border: `1.5px solid ${COLORS.lavender}60`,
                  borderRadius: 12, padding: "0 14px",
                  transition: "border-color 0.2s",
                }}
              >
                <FiLock size={18} color={COLORS.mauve} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "14px 12px",
                    fontSize: 14, color: COLORS.darkIndigo, background: "transparent",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: 4, display: "flex",
                  }}
                >
                  {showPassword ? (
                    <FiEyeOff size={18} color={COLORS.mauve} />
                  ) : (
                    <FiEye size={18} color={COLORS.mauve} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "15px",
                background: isLoading
                  ? COLORS.lavender
                  : `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.white,
                border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.5px",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: isLoading ? "none" : "0 4px 16px rgba(200,146,42,0.4)",
                transition: "all 0.3s",
              }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center", marginTop: 24,
            fontSize: 12, color: COLORS.lavender,
          }}
        >
          Property 360 Degree — Internal CRM Platform
        </p>
      </div>
    </div>
  );
}
