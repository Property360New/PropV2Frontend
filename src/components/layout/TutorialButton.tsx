"use client";

import { useState } from "react";
import { FiPlayCircle, FiX } from "react-icons/fi";
import { COLORS } from "@/lib/colors";
import { createPortal } from "react-dom";

interface TutorialButtonProps {
  videoUrl: string; // pass EMBED URL here
  label?: string;
}

export default function TutorialButton({
  videoUrl,
  label = "Watch Tutorial",
}: TutorialButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 16px",
          borderRadius: 10,
          border: `1.5px solid ${COLORS.gold}60`,
          background: `${COLORS.gold}10`,
          color: COLORS.darkIndigo,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <FiPlayCircle size={15} color={COLORS.gold} />
        {label}
      </button>

      {/* Modal */}
      {open &&
  typeof window !== "undefined" &&
  createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "80%",
          maxWidth: 900,
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.6)",
            border: "none",
            borderRadius: "50%",
            padding: 6,
            cursor: "pointer",
            color: "#fff",
            zIndex: 2,
          }}
        >
          ✕
        </button>

        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src={videoUrl}
            allow="autoplay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}