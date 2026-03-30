"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useGetTodayAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from "@/store/attendance.api";
import { COLORS } from "@/lib/colors";
import { FiMapPin, FiAlertCircle } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ─── Geocode on the frontend BEFORE sending ───────────────────────────────────
//
// Old app approach: resolve the address first, then POST everything in one shot.
// This way the DB record is complete immediately — no background patching needed.

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "Property360CRM/1.0" }, signal: AbortSignal.timeout(5_000) }
    );
    if (!res.ok) return "Address not available";
    const data = await res.json();
    if (data.address) {
      const a = data.address;
      return [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood,
        a.city || a.town || a.village || a.county,
        a.state,
      ]
        .filter(Boolean)
        .join(", ");
    }
    return data.display_name ?? "Address not available";
  } catch {
    return "Address not available";
  }
}

// ─── Geolocation: nested callback (no timer race condition) ───────────────────

function getLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    // Try high-accuracy (GPS) first, fall back to network on error/timeout
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => {
        // GPS failed — try low-accuracy (cell/WiFi), fast & reliable indoors
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          (err) => reject(new Error(geoError(err))),
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 0 }
    );
  });
}

function geoError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location access denied. Allow location in your browser settings and try again.";
    case err.POSITION_UNAVAILABLE:
      return "Location unavailable. Enable GPS or network location on your device.";
    case err.TIMEOUT:
      return "Location timed out. Move to an area with better signal and try again.";
    default:
      return "Could not get your location. Please try again.";
  }
}

// ─── Sub-step label ───────────────────────────────────────────────────────────

type Step = "idle" | "locating" | "geocoding" | "saving" | "done" | "error";

function StepLabel({ step }: { step: Step }) {
  if (step === "idle" || step === "done") return null;
  const map: Partial<Record<Step, { text: string; color: string }>> = {
    locating:  { text: "Getting your GPS…",  color: COLORS.gold    },
    geocoding: { text: "Fetching address…",  color: COLORS.gold    },
    saving:    { text: "Saving attendance…", color: "#27AE60"      },
    error:     { text: "Failed",             color: COLORS.danger  },
  };
  const c = map[step];
  if (!c) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 11, color: c.color, marginTop: 4,
      justifyContent: "center", fontFamily: "'DM Sans', sans-serif",
    }}>
      <FiMapPin size={11} />
      <span>{c.text}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckInBanner() {
  const [pulse, setPulse]     = useState(true);
  const [geoErr, setGeoErr]   = useState<string | null>(null);
  const [step, setStep]       = useState<Step>("idle");

  // Poll every 30s like the old app — keeps status fresh without manual refetch
  const { data: today, isLoading } = useGetTodayAttendanceQuery(undefined, {
    pollingInterval: 30_000,
  });

  const [doCheckIn,  { isLoading: checkingIn  }] = useCheckInMutation();
  const [doCheckOut, { isLoading: checkingOut }] = useCheckOutMutation();

  const busy = checkingIn || checkingOut || step === "locating" || step === "geocoding" || step === "saving";

  const hasCheckedIn  = !!today?.checkInAt;
  const hasCheckedOut = !!today?.checkOutAt;
  const isDisabled    = hasCheckedOut || isLoading || busy;

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(t);
  }, []);

  const handleAction = useCallback(async () => {
    if (isDisabled) return;
    setGeoErr(null);

    // Step 1: get GPS coords
    setStep("locating");
    let coords: Coords;
    try {
      coords = await getLocation();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not get your location.";
      setGeoErr(msg);
      setStep("error");
      setTimeout(() => setStep("idle"), 4_000);
      return;
    }

    // Step 2: resolve address on frontend (old app approach — fast, complete record in DB)
    setStep("geocoding");
    const address = await reverseGeocode(coords.latitude, coords.longitude);

    // Step 3: POST everything at once
    setStep("saving");
    try {
      const payload = { ...coords, address };
      if (!hasCheckedIn) {
        await doCheckIn(payload).unwrap();
      } else if (!hasCheckedOut) {
        await doCheckOut(payload).unwrap();
      }
      setStep("done");
      // RTK Query invalidatesTags fires here → today status re-fetches immediately
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      setGeoErr(e.data?.message || e.message || "Failed to save attendance. Please try again.");
      setStep("error");
      setTimeout(() => setStep("idle"), 4_000);
    }
  }, [isDisabled, hasCheckedIn, hasCheckedOut, doCheckIn, doCheckOut]);

  // ── Label ──────────────────────────────────────────────────────────────────
  const label = (() => {
    if (isLoading)             return "Loading…";
    if (step === "locating")   return "Getting location…";
    if (step === "geocoding")  return "Fetching address…";
    if (step === "saving")     return "Saving…";
    if (hasCheckedOut)         return "Checked Out ✓";
    if (hasCheckedIn)          return "Check Out";
    return "Check In for Today";
  })();

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bgGradient = hasCheckedOut
    ? "linear-gradient(135deg, #1a7a40, #27AE60)"
    : busy
    ? `linear-gradient(135deg, ${COLORS.mauve}, #2D1B4E)`
    : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`;

  const shadowColor = hasCheckedOut
    ? "rgba(39,174,96,0.35)"
    : busy
    ? "rgba(90,50,130,0.3)"
    : "rgba(200,146,42,0.35)";

  const dotColor = hasCheckedOut ? "#fff" : busy ? COLORS.gold : "#4ADE80";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        role={isDisabled ? undefined : "button"}
        aria-disabled={isDisabled}
        onClick={isDisabled ? undefined : handleAction}
        style={{
          background: bgGradient,
          padding: "14px 28px",
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          cursor: isDisabled ? "default" : "pointer",
          boxShadow: `0 4px 20px ${shadowColor}`,
          transition: "transform 0.15s, box-shadow 0.15s",
          position: "relative", overflow: "hidden",
          opacity: isLoading ? 0.7 : 1,
          minWidth: 220,
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        }}
      >
        {/* Shimmer — idle only */}
        {!hasCheckedOut && step === "idle" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
            animation: "shimmer 2.5s infinite",
          }} />
        )}

        {/* Spinner or pulse dot */}
        {busy ? (
          <div style={{
            width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
            border: "2.5px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            animation: "spin360 0.7s linear infinite",
          }} />
        ) : (
          <div style={{
            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
            background: dotColor,
            boxShadow: pulse ? `0 0 12px ${dotColor}` : `0 0 4px ${dotColor}`,
            transition: "box-shadow 0.5s",
          }} />
        )}

        <span style={{
          color: "#fff", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.5px", fontFamily: "'DM Sans', sans-serif",
          textShadow: "0 1px 2px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      </div>

      <StepLabel step={step} />

      {geoErr && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 5,
          fontSize: 11, color: COLORS.danger, marginTop: 6,
          maxWidth: 280, textAlign: "center", lineHeight: 1.4,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <FiAlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{geoErr}</span>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes spin360 { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}