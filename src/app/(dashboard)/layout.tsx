"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { restoreSession } from "@/store/authSlice";
import { useGetProfileQuery } from "@/store/auth.api";
import Sidebar from "@/components/layout/Sidebar";
import Cookies from "js-cookie";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.replace("/login");
    } else {
      dispatch(restoreSession());
    }
  }, [dispatch, router]);

  const { isError } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F0F5",
          fontFamily: "'DM Sans', sans-serif",
          color: "#9B5E8A",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Loading...
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 250;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F0F5",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#1A0F2E",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C9A8C0; border-radius: 3px; }
      `}</style>

      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <div
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, padding: "0 0 24px" }}>
          {children}
        </div>

        <footer
          style={{
            borderTop: "1px solid rgba(155,94,138,0.15)",
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(8px)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#7A6882", textAlign: "center" }}>
            {"© 2026 "}
            <a
              href="https://property360degree.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563EB", textDecoration: "underline", paddingLeft: 4, paddingRight: 4 }}
            >
              Property 360 Degree
            </a>
            {" All rights reserved."}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#7A6882",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Designed by</span>
            <a
              href="http://iameya.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563EB", textDecoration: "underline" }}
            >
              Ameya Innovex
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}