"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetLatestLocationsQuery, useRequestLocationMutation } from "@/store/staffLocation.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import type { StaffLocation } from "@/types";
import { FiMapPin, FiClock, FiSend, FiUser } from "react-icons/fi";

function formatTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function StaffLocationPage() {
  const { data: locations, isLoading } = useGetLatestLocationsQuery();
  const { data: employees } = useGetScopeEmployeesQuery();
  const [requestLoc, { isLoading: requesting }] = useRequestLocationMutation();
  const [selectedEmp, setSelectedEmp] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!selectedEmp) return;
    try {
      await requestLoc({ employeeId: selectedEmp }).unwrap();
      const emp = employees?.find(e => e.id === selectedEmp);
      setSent(emp ? `${emp.firstName} ${emp.lastName}` : "Employee");
      setTimeout(() => setSent(null), 4000);
    } catch {
      alert("Failed to send location request.");
    }
  };

  return (
    <>
      <TopBar title="Staff Location" subtitle="Request and view real-time employee locations" />

      <div style={{ padding: "24px 32px" }}>
        {/* Request Location */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "20px 24px", marginBottom: 24,
          border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}>
          <FiSend size={18} color={COLORS.mauve} />
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo }}>Request Location:</span>
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{
            padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`, fontSize: 13,
            background: "#fff", color: COLORS.darkIndigo, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", minWidth: 200,
          }}>
            <option value="">Select employee...</option>
            {employees?.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
          </select>
          <button onClick={handleRequest} disabled={!selectedEmp || requesting} style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: !selectedEmp || requesting ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: !selectedEmp || requesting ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {requesting ? "Sending..." : "Send Request"}
          </button>
          {sent && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Request sent to {sent}</span>}
        </div>

        {/* Locations Grid */}
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo }}>
          Latest Known Locations
        </h3>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.mauve }}>Loading locations...</div>
        ) : !locations || locations.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60, color: COLORS.mauve, background: COLORS.white,
            borderRadius: 16, border: `1px solid ${COLORS.lavender}30`,
          }}>
            No location data available yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {(locations as StaffLocation[]).map(loc => (
              <div key={loc.id} style={{
                background: COLORS.white, borderRadius: 14, padding: "18px 20px",
                border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: `${COLORS.mauve}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: COLORS.mauve,
                  }}>
                    <FiUser size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: COLORS.darkIndigo, fontSize: 14 }}>
                      {loc.employee ? `${loc.employee.firstName} ${loc.employee.lastName}` : loc.employeeId.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.mauve }}>
                      {loc.employee?.designation?.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8, fontSize: 12, color: COLORS.darkIndigo }}>
                  <FiMapPin size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{loc.address || `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.mauve }}>
                  <FiClock size={12} /> {formatTime(loc.capturedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
