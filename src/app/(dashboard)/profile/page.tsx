"use client";

import { useState, FormEvent, useEffect } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/store/auth.api";
import { useAppSelector, useAppDispatch } from "@/store";
import { setEmployee } from "@/store/authSlice";
import { FiUser, FiMail, FiPhone, FiLock, FiCalendar, FiTarget, FiCheck } from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

export default function ProfilePage() {
  const { data: profile } = useGetProfileQuery();
  const dispatch = useAppDispatch();

  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [saved,     setSaved]     = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName   || "");
      setPhone(profile.phone         || "");
    }
  }, [profile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      const result = await updateProfile({
        firstName: firstName || undefined,
        lastName:  lastName  || undefined,
        phone:     phone     || undefined,
      }).unwrap();
      dispatch(setEmployee(result));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert("Failed to update profile."); }
  };

  const handleChangePw = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    try {
      await changePassword({ oldPassword: oldPw, newPassword: newPw }).unwrap();
      setPwMsg({ ok: true, text: "Password changed successfully." });
      setOldPw(""); setNewPw("");
    } catch (err: unknown) {
      setPwMsg({ ok: false, text: (err as { data?: { message?: string } })?.data?.message || "Failed to change password." });
    }
  };

  const fieldStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
    background: "#fff", color: COLORS.darkIndigo,
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const,
  };
  const readStyle = { ...fieldStyle, background: `${COLORS.lavender}15`, cursor: "not-allowed" as const };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: COLORS.darkIndigo, display: "block" as const, marginBottom: 4 };

  return (
    <>
      <TopBar title="Profile" subtitle="View and update your personal information" >
      <TutorialButton videoUrl={TUTORIALS.profile} />
      </TopBar>

      <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
        {/* User Header */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "24px 28px", marginBottom: 24,
          border: `1px solid ${COLORS.lavender}30`, display: "flex", alignItems: "center", gap: 18,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${COLORS.mauve}, ${COLORS.lavender})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "#fff",
          }}>
            {profile?.firstName?.[0]}{profile?.lastName?.[0] || ""}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {profile?.firstName} {profile?.lastName}
            </div>
            <div style={{ fontSize: 13, color: COLORS.mauve }}>{profile?.designation?.replace(/_/g, " ")} | {profile?.email}</div>
          </div>
        </div>

        {/* Profile Form */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "24px 28px", marginBottom: 24,
          border: `1px solid ${COLORS.lavender}30`,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: COLORS.darkIndigo }}>Personal Information</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}><FiUser size={11} /> First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}><FiUser size={11} /> Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} style={fieldStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}><FiPhone size={11} /> Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}><FiMail size={11} /> Email</label><input value={profile?.email || ""} readOnly style={readStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}><FiCalendar size={11} /> Birthday</label><input value={profile?.birthday ? new Date(profile.birthday).toLocaleDateString() : "Not set"} readOnly style={readStyle} /></div>
              <div><label style={labelStyle}><FiCalendar size={11} /> Marriage Anniversary</label><input value={profile?.marriageAnniversary ? new Date(profile.marriageAnniversary).toLocaleDateString() : "Not set"} readOnly style={readStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div><label style={labelStyle}><FiTarget size={11} /> Sales Target</label><input value={profile?.monthlySalesTarget || "Not set"} readOnly style={readStyle} /></div>
              <div><label style={labelStyle}><FiTarget size={11} /> Call Target</label><input value={profile?.dailyCallTarget || "Not set"} readOnly style={readStyle} /></div>
            </div>
            <button type="submit" disabled={updating} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: updating ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: updating ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
            }}>
              {saved ? <><FiCheck size={14} /> Saved</> : updating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "24px 28px",
          border: `1px solid ${COLORS.lavender}30`,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: COLORS.darkIndigo }}>
            <FiLock size={14} style={{ marginRight: 6 }} />Change Password
          </h3>
          {pwMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: pwMsg.ok ? COLORS.successLight : COLORS.dangerLight, color: pwMsg.ok ? COLORS.success : COLORS.danger, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handleChangePw}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div><label style={labelStyle}>Current Password</label><input type="password" required value={oldPw} onChange={e => setOldPw(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>New Password</label><input type="password" required minLength={6} value={newPw} onChange={e => setNewPw(e.target.value)} style={fieldStyle} /></div>
            </div>
            <button type="submit" disabled={changingPw} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: changingPw ? COLORS.lavender : COLORS.mauve,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: changingPw ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {changingPw ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
