"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetScopeEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useReactivateEmployeeMutation,
  useGetEmployeeDetailQuery
} from "@/store/hierarchy.api";
import type { Designation, CreateEmployeeBody, ScopeEmployee } from "@/types";
import {
  FiPlus, FiX, FiUser, FiMail, FiPhone, FiLock,
  FiToggleLeft, FiToggleRight, FiTarget, FiCalendar,
  FiEdit2, FiAlertTriangle, FiCheckCircle,
  FiEyeOff,
  FiEye,
} from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Constants ────────────────────────────────────────────────────────────────

const DESIGNATIONS: { value: Designation; label: string }[] = [
  { value: "SALES_EXECUTIVE", label: "Sales Executive" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "AREA_MANAGER", label: "Area Manager" },
  { value: "DGM", label: "DGM" },
  { value: "GM", label: "GM" },
  { value: "VP_SALES", label: "VP Sales" },
  { value: "SALES_COORDINATOR", label: "Sales Coordinator" },
  { value: "ADMIN", label: "Admin" },
];

// Higher number = more senior. Used for client-side validation.
const DESIGNATION_LEVEL: Record<Designation, number> = {
  SALES_EXECUTIVE: 1,
  TEAM_LEAD: 2,
  SALES_MANAGER: 3,
  AREA_MANAGER: 4,
  DGM: 5,
  GM: 6,
  SALES_COORDINATOR: 7,
  VP_SALES: 7,
  ADMIN: 99,
};

const DESIG_COLORS: Record<string, string> = {
  ADMIN: "#E74C3C",
  SALES_COORDINATOR: "#8E44AD",
  VP_SALES: "#2980B9",
  GM: "#27AE60",
  DGM: "#16A085",
  AREA_MANAGER: "#E67E22",
  SALES_MANAGER: COLORS.gold,
  TEAM_LEAD: "#3498DB",
  SALES_EXECUTIVE: COLORS.mauve,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(d: string) { return DESIG_COLORS[d] || COLORS.mauve; }

function DesignationBadge({ designation }: { designation: Designation }) {
  const color = getColor(designation);
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      color, background: `${color}12`, border: `1px solid ${color}25`, whiteSpace: "nowrap",
    }}>
      {designation.replace(/_/g, " ")}
    </span>
  );
}

function InputWithIcon({
  icon: Icon, value, onChange, type = "text", required = false, placeholder = "",
}: {
  icon: typeof FiUser; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
    }}>
      <Icon size={15} color={COLORS.mauve} />
      <input
        type={type} required={required} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, border: "none", outline: "none", padding: "10px",
          fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo,
  display: "block", marginBottom: 4,
};

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
  background: "#fff", color: COLORS.darkIndigo,
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
};

const numberInputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
  background: "#fff", color: COLORS.darkIndigo,
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
};

// ─── Client-side Validation ───────────────────────────────────────────────────

/**
 * Returns a validation error message, or null if valid.
 * These mirror the backend rules so the user gets instant feedback.
 */
function validateReportingManager(
  employeeDesignation: Designation,
  managerId: string | undefined,
  employees: ScopeEmployee[],
  editingEmployeeId?: string,   // only for edit mode — prevents self-assignment
): string | null {
  if (!managerId) return null; // no manager selected → valid (optional)

  // Cannot assign yourself as your own manager
  if (managerId === editingEmployeeId) {
    return "An employee cannot be their own reporting manager.";
  }

  const manager = employees.find((e) => e.id === managerId);
  if (!manager) return "Selected manager not found.";

  const mgrLevel = DESIGNATION_LEVEL[manager.designation as Designation] ?? 0;
  const empLevel = DESIGNATION_LEVEL[employeeDesignation] ?? 0;

  if (mgrLevel <= empLevel) {
    return `Reporting manager (${manager.designation.replace(/_/g, " ")}) must be senior to the employee (${employeeDesignation.replace(/_/g, " ")}). Choose someone with a higher-ranking designation.`;
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { data: employees, isLoading, refetch } = useGetScopeEmployeesQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [deactivateEmp] = useDeactivateEmployeeMutation();
  const [reactivateEmp] = useReactivateEmployeeMutation();

  const handleToggle = async (emp: ScopeEmployee & { isActive?: boolean }) => {
    try {
      if (emp.isActive === false) {
        await reactivateEmp(emp.id).unwrap();
      } else {
        if (!confirm(
          `Deactivate ${emp.firstName} ${emp.lastName}?\n\n` +
          `Their leads will be automatically transferred to their reporting manager.`
        )) return;
        await deactivateEmp(emp.id).unwrap();
      }
      refetch();
    } catch {
      alert("Failed to update employee status.");
    }
  };

  return (
    <>
      <TopBar title="Employees" subtitle="Manage employee accounts, designations and reporting" >
        <TutorialButton videoUrl={TUTORIALS.addEmployee} />
      </TopBar>  

      <div style={{ padding: "24px 32px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 12px ${COLORS.gold}40`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <FiPlus size={16} /> Add Employee
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: COLORS.white, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
                  {["Employee", "Designation", "Reporting Manager", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading">
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      Loading employees...
                    </td>
                  </tr>
                ) : !employees?.length ? (
                  <tr key="empty">
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, i) => {
                    const isActive = (emp as any).isActive !== false;
                    const manager = employees.find((e) => e.id === (emp as any).reportingManagerId);
                    return (
                      <tr key={emp.id} style={{
                        borderBottom: `1px solid ${COLORS.lavender}20`,
                        background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                        opacity: isActive ? 1 : 0.55,
                        transition: "background 0.15s",
                      }}>
                        {/* Employee */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: `linear-gradient(135deg, ${getColor(emp.designation)}20, ${getColor(emp.designation)}10)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: getColor(emp.designation),
                              border: `1.5px solid ${getColor(emp.designation)}25`,
                            }}>
                              {emp.firstName?.[0]?.toUpperCase()}{emp.lastName?.[0]?.toUpperCase() || ""}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: COLORS.darkIndigo }}>
                                {emp.firstName} {emp.lastName}
                              </div>
                              {(emp as any).user?.email && (
                                <div style={{ fontSize: 11, color: COLORS.mauve }}>
                                  {(emp as any).user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Designation */}
                        <td style={{ padding: "12px 16px" }}>
                          <DesignationBadge designation={emp.designation} />
                        </td>

                        {/* Reporting Manager */}
                        <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12 }}>
                          {manager
                            ? <span style={{ fontWeight: 600, color: COLORS.darkIndigo }}>
                              {manager.firstName} {manager.lastName}
                              <span style={{
                                marginLeft: 6, fontSize: 10, color: COLORS.mauve,
                                fontWeight: 400,
                              }}>
                                ({manager.designation.replace(/_/g, " ")})
                              </span>
                            </span>
                            : <span style={{ color: COLORS.mauve, fontStyle: "italic" }}>None</span>
                          }
                        </td>

                        {/* Status toggle */}
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => handleToggle(emp as any)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: isActive ? "#27AE60" : COLORS.danger,
                              display: "flex", alignItems: "center", gap: 5,
                              fontSize: 12, fontWeight: 600,
                            }}
                          >
                            {isActive
                              ? <><FiToggleRight size={18} /> Active</>
                              : <><FiToggleLeft size={18} /> Inactive</>
                            }
                          </button>
                        </td>

                        {/* Edit action */}
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setEditingEmpId(emp.id)}
                            title="Edit employee"
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 8,
                              border: `1px solid ${COLORS.lavender}40`,
                              background: `${COLORS.darkIndigo}06`,
                              color: COLORS.darkIndigo, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <FiEdit2 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateEmployeeModal
          onClose={() => { setShowCreate(false); refetch(); }}
          employees={employees || []}
        />
      )}

      {editingEmpId && (
        <EditEmployeeModalLoader
          employeeId={editingEmpId}
          allEmployees={employees || []}
          onClose={() => { setEditingEmpId(null); refetch(); }}
        />
      )}
    </>
  );
}

// ─── Shared Modal Shell ───────────────────────────────────────────────────────

function ModalShell({
  title, subtitle, onClose, children,
}: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, width: 560,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)", position: "relative",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "22px 28px 18px",
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          borderRadius: "20px 20px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 20, fontWeight: 800,
              fontFamily: "'Playfair Display', Georgia, serif", color: "#fff",
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}>
            <FiX size={18} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Validation Banner ────────────────────────────────────────────────────────

function ValidationBanner({ message, type = "error" }: { message: string; type?: "error" | "success" }) {
  const isError = type === "error";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 14px", borderRadius: 10, marginBottom: 16,
      background: isError ? "#FEF0EF" : "#EBF9F1",
      border: `1px solid ${isError ? "#E74C3C" : "#27AE60"}25`,
      color: isError ? "#C0392B" : "#1E8449",
      fontSize: 13, fontWeight: 500, lineHeight: 1.5,
    }}>
      {isError
        ? <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        : <FiCheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      }
      {message}
    </div>
  );
}

// ─── Shared Form Fields ───────────────────────────────────────────────────────

function ManagerSelector({
  value, onChange, employees, employeeDesignation, editingId, label = "Reporting Manager",
}: {
  value: string;
  onChange: (v: string) => void;
  employees: ScopeEmployee[];
  employeeDesignation: Designation;
  editingId?: string;
  label?: string;
}) {
  const validationError = validateReportingManager(
    employeeDesignation, value || undefined, employees, editingId,
  );

  // Only show employees who are senior enough to manage this designation
  const empLevel = DESIGNATION_LEVEL[employeeDesignation] ?? 0;
  const eligibleManagers = employees.filter((e) => {
    if (e.id === editingId) return false; // can't be own manager
    const mgrLevel = DESIGNATION_LEVEL[e.designation as Designation] ?? 0;
    return mgrLevel > empLevel;
  });

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        ...selectStyle,
        borderColor: validationError ? "#E74C3C60" : `${COLORS.lavender}60`,
        background: validationError ? "#FEF0EF" : "#fff",
      }}>
        <option value="">None / No manager</option>
        {eligibleManagers.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName} — {emp.designation.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {/* Show ineligible managers greyed out as a hint */}
      {employees.some((e) => {
        const mgrLevel = DESIGNATION_LEVEL[e.designation as Designation] ?? 0;
        return mgrLevel <= empLevel && e.id !== editingId;
      }) && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.mauve }}>
            Only employees senior to this designation are shown.
          </p>
        )}

      {validationError && <ValidationBanner message={validationError} />}
    </div>
  );
}

// ─── CreateEmployeeModal ──────────────────────────────────────────────────────

function CreateEmployeeModal({
  onClose, employees,
}: {
  onClose: () => void; employees: ScopeEmployee[];
}) {
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState<CreateEmployeeBody>({
    firstName: "",
    email: "",
    password: "",
    designation: "SALES_EXECUTIVE",
    // new fields
    aadhaarNumber: "",
    panNumber: "",
    emergencyContact: "",
    employeeType: "EMPLOYEE",
  });
  const [error, setError] = useState("");

  const set = <K extends keyof CreateEmployeeBody>(key: K, val: CreateEmployeeBody[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const managerError = validateReportingManager(
    form.designation, form.reportingManagerId, employees,
  );

  const passwordMismatch = confirmPassword.length > 0 && form.password !== confirmPassword;

  // ── Client-side KYC validation ───────────────────────────────────────────────
  const aadhaarError =
    form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)
      ? "Aadhaar must be exactly 12 digits"
      : null;

  const panError =
    form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)
      ? "Invalid PAN format (e.g. ABCDE1234F)"
      : null;

  const emergencyError =
    form.emergencyContact && !/^\d{10}$/.test(form.emergencyContact)
      ? "Emergency contact must be 10 digits"
      : null;

  const hasKycError = !!(aadhaarError || panError || emergencyError);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (managerError) { setError(managerError); return; }
    if (hasKycError) { setError("Please fix the highlighted KYC field errors."); return; }
    if (form.password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    try {
      const { birthday, marriageAnniversary, ...rest } = form;
      const payload: Record<string, unknown> = { ...rest };
      if (birthday) payload.birthday = `${birthday}T00:00:00.000Z`;
      if (marriageAnniversary) payload.marriageAnniversary = `${marriageAnniversary}T00:00:00.000Z`;
      // Strip empty KYC strings so backend treats them as absent
      if (!payload.aadhaarNumber) delete payload.aadhaarNumber;
      if (!payload.panNumber) delete payload.panNumber;
      if (!payload.emergencyContact) delete payload.emergencyContact;
      await createEmployee(payload as unknown as CreateEmployeeBody).unwrap();
      onClose();
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to create employee");
    }
  };

  const isSubmitDisabled = isLoading || !!managerError || passwordMismatch || hasKycError;

  return (
    <ModalShell title="Add New Employee" subtitle="Create a login and set reporting structure" onClose={onClose}>
      {error && <ValidationBanner message={error} />}

      <form onSubmit={handleSubmit}>

        {/* ── Name ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}>First Name <span style={{ color: COLORS.danger }}>*</span></label>
            <InputWithIcon icon={FiUser} value={form.firstName} onChange={(v) => set("firstName", v)} required />
          </div>
          <div>
            <label style={fieldLabel}>Last Name</label>
            <InputWithIcon icon={FiUser} value={form.lastName || ""} onChange={(v) => set("lastName", v)} />
          </div>
        </div>

        {/* ── Email + Password ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}>Email <span style={{ color: COLORS.danger }}>*</span></label>
            <InputWithIcon icon={FiMail} type="email" value={form.email} onChange={(v) => set("email", v)} required />
          </div>
          <div>
            <label style={fieldLabel}>Password <span style={{ color: COLORS.danger }}>*</span></label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiLock size={15} color={COLORS.mauve} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button type="button" onClick={() => setShowPassword((p) => !p)}
                style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Confirm Password ── */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Confirm Password <span style={{ color: COLORS.danger }}>*</span></label>
          <div style={{
            display: "flex", alignItems: "center",
            border: `1.5px solid ${passwordMismatch ? COLORS.danger : COLORS.lavender}60`,
            borderRadius: 10, padding: "0 12px",
          }}>
            <FiLock size={15} color={COLORS.mauve} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", padding: "10px",
                fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
              style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}>
              {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {passwordMismatch && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>
              Passwords do not match
            </p>
          )}
        </div>

        {/* ── Phone ── */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Phone</label>
          <InputWithIcon icon={FiPhone} value={form.phone || ""} onChange={(v) => set("phone", v)} placeholder="10-digit mobile number" />
        </div>

        {/* ── Designation + Manager ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}>Designation <span style={{ color: COLORS.danger }}>*</span></label>
            <select
              value={form.designation}
              onChange={(e) => {
                set("designation", e.target.value as Designation);
                set("reportingManagerId", undefined);
              }}
              required
              style={selectStyle}
            >
              {DESIGNATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <ManagerSelector
              value={form.reportingManagerId || ""}
              onChange={(v) => set("reportingManagerId", v || undefined)}
              employees={employees}
              employeeDesignation={form.designation}
              label="Reporting Manager"
            />
          </div>
        </div>

        {/* ── Targets ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}><FiTarget size={11} style={{ marginRight: 3 }} />Daily Call Target</label>
            <input type="number" min={0} value={form.dailyCallTarget ?? ""}
              onChange={(e) => set("dailyCallTarget", e.target.value ? Number(e.target.value) : undefined)}
              style={numberInputStyle} />
          </div>
          <div>
            <label style={fieldLabel}><FiTarget size={11} style={{ marginRight: 3 }} />Monthly Sales Target</label>
            <input type="number" min={0} step="0.01" value={form.monthlySalesTarget ?? ""}
              onChange={(e) => set("monthlySalesTarget", e.target.value ? Number(e.target.value) : undefined)}
              style={numberInputStyle} />
          </div>
        </div>

        {/* ── Birthday + Anniversary ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}><FiCalendar size={11} style={{ marginRight: 3 }} />Birthday</label>
            <input type="date" value={form.birthday || ""}
              onChange={(e) => set("birthday", e.target.value || undefined)} style={numberInputStyle} />
          </div>
          <div>
            <label style={fieldLabel}><FiCalendar size={11} style={{ marginRight: 3 }} />Marriage Anniversary</label>
            <input type="date" value={form.marriageAnniversary || ""}
              onChange={(e) => set("marriageAnniversary", e.target.value || undefined)} style={numberInputStyle} />
          </div>
        </div>

        {/* ── KYC & Employment Details ─────────────────────────────────────────── */}
        <div style={{
          background: `${COLORS.lavender}08`, borderRadius: 12,
          padding: "16px 18px", marginBottom: 22,
          border: `1px solid ${COLORS.lavender}30`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: COLORS.mauve,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14,
          }}>
            KYC &amp; Employment Details
          </div>

          {/* Employee Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Employee Type</label>
            <select
              value={form.employeeType ?? "EMPLOYEE"}
              onChange={(e) => set("employeeType", e.target.value as any)}
              style={selectStyle}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="PNL">P&amp;L</option>
              <option value="CHANNEL_PARTNER">Channel Partner</option>
            </select>
          </div>

          {/* Aadhaar + PAN */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={fieldLabel}>Aadhaar Number</label>
              <div style={{
                display: "flex", alignItems: "center",
                border: `1.5px solid ${aadhaarError ? COLORS.danger : COLORS.lavender}60`,
                borderRadius: 10, padding: "0 12px",
                background: aadhaarError ? "#FEF0EF" : "transparent",
              }}>
                <FiUser size={15} color={COLORS.mauve} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={form.aadhaarNumber || ""}
                  placeholder="12-digit Aadhaar"
                  onChange={(e) => set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12) as any)}
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "10px",
                    fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
              {aadhaarError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{aadhaarError}</p>}
            </div>

            <div>
              <label style={fieldLabel}>PAN Number</label>
              <div style={{
                display: "flex", alignItems: "center",
                border: `1.5px solid ${panError ? COLORS.danger : COLORS.lavender}60`,
                borderRadius: 10, padding: "0 12px",
                background: panError ? "#FEF0EF" : "transparent",
              }}>
                <FiUser size={15} color={COLORS.mauve} />
                <input
                  type="text"
                  maxLength={10}
                  value={form.panNumber || ""}
                  placeholder="e.g. ABCDE1234F"
                  onChange={(e) => set("panNumber", e.target.value.toUpperCase().slice(0, 10) as any)}
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "10px",
                    fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px",
                  }}
                />
              </div>
              {panError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{panError}</p>}
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label style={fieldLabel}><FiPhone size={11} style={{ marginRight: 3 }} />Emergency Contact Number</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${emergencyError ? COLORS.danger : COLORS.lavender}60`,
              borderRadius: 10, padding: "0 12px",
              background: emergencyError ? "#FEF0EF" : "transparent",
            }}>
              <FiPhone size={15} color={COLORS.mauve} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.emergencyContact || ""}
                placeholder="10-digit number"
                onChange={(e) => set("emergencyContact", e.target.value.replace(/\D/g, "").slice(0, 10) as any)}
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
            {emergencyError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{emergencyError}</p>}
          </div>
        </div>

        <button type="submit" disabled={isSubmitDisabled} style={{
          width: "100%", padding: 13, borderRadius: 10, border: "none",
          background: isSubmitDisabled
            ? COLORS.lavender
            : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
          color: isSubmitDisabled ? COLORS.mauve : "#fff",
          fontSize: 14, fontWeight: 700,
          cursor: isSubmitDisabled ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: isSubmitDisabled ? "none" : `0 4px 12px ${COLORS.gold}40`,
        }}>
          {isLoading ? "Creating..." : "Create Employee"}
        </button>
      </form>
    </ModalShell>
  );
}

// ─── Edit Employee Modal Loader ───────────────────────────────────────────────

function EditEmployeeModalLoader({
  employeeId, allEmployees, onClose,
}: {
  employeeId: string;
  allEmployees: ScopeEmployee[];
  onClose: () => void;
}) {
  const { data: employee, isLoading } = useGetEmployeeDetailQuery(employeeId);

  if (isLoading || !employee) {
    return (
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: "#fff", borderRadius: 20, padding: 40,
          fontSize: 14, color: COLORS.mauve, fontFamily: "'DM Sans', sans-serif",
        }}>
          Loading employee details...
        </div>
      </div>
    );
  }

  return (
    <EditEmployeeModal
      employee={employee as unknown as ScopeEmployee}
      employees={allEmployees.filter((e) => e.id !== employeeId)}
      onClose={onClose}
    />
  );
}

// ─── EditEmployeeModal ────────────────────────────────────────────────────────

function EditEmployeeModal({
  employee, employees, onClose,
}: {
  employee: ScopeEmployee;
  employees: ScopeEmployee[];
  onClose: () => void;
}) {
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();

  const currentManagerId = (employee as any).reportingManagerId as string | undefined;

  const [form, setForm] = useState({
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    phone: (employee as any).phone || "",
    designation: employee.designation as Designation,
    reportingManagerId: currentManagerId || "",
    dailyCallTarget: (employee as any).dailyCallTarget as number | undefined,
    monthlySalesTarget: (employee as any).monthlySalesTarget as number | undefined,
    birthday: (employee as any).birthday
      ? new Date((employee as any).birthday).toISOString().slice(0, 10)
      : "",
    marriageAnniversary: (employee as any).marriageAnniversary
      ? new Date((employee as any).marriageAnniversary).toISOString().slice(0, 10)
      : "",
    // KYC fields
    aadhaarNumber: (employee as any).aadhaarNumber || "",
    panNumber: (employee as any).panNumber || "",
    emergencyContact: (employee as any).emergencyContact || "",
    employeeType: ((employee as any).employeeType || "EMPLOYEE") as "EMPLOYEE" | "PNL" | "CHANNEL_PARTNER",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // ── Downgrade blocker ─────────────────────────────────────────────────────────
  const designationDowngrading =
    form.designation !== employee.designation &&
    (DESIGNATION_LEVEL[form.designation] ?? 0) < (DESIGNATION_LEVEL[employee.designation as Designation] ?? 0);

  const directReportBlockers: ScopeEmployee[] = designationDowngrading
    ? employees.filter((e) => {
        const isDirectReport = (e as any).reportingManagerId === employee.id;
        if (!isDirectReport) return false;
        const drLevel = DESIGNATION_LEVEL[e.designation as Designation] ?? 0;
        const newLevel = DESIGNATION_LEVEL[form.designation] ?? 0;
        return drLevel >= newLevel;
      })
    : [];

  const hasDowngradeBlocker = directReportBlockers.length > 0;

  // ── Manager validation ────────────────────────────────────────────────────────
  const managerError = validateReportingManager(
    form.designation,
    form.reportingManagerId || undefined,
    employees,
    employee.id,
  );

  const managerChanged = (form.reportingManagerId || "") !== (currentManagerId || "");

  // ── KYC validation ────────────────────────────────────────────────────────────
  const aadhaarError =
    form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)
      ? "Aadhaar must be exactly 12 digits"
      : null;

  const panError =
    form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)
      ? "Invalid PAN format (e.g. ABCDE1234F)"
      : null;

  const emergencyError =
    form.emergencyContact && !/^\d{10}$/.test(form.emergencyContact)
      ? "Emergency contact must be 10 digits"
      : null;

  const hasKycError = !!(aadhaarError || panError || emergencyError);

  const isBlocked = !!managerError || hasDowngradeBlocker || hasKycError;

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (hasDowngradeBlocker) { setError("Reassign the blocked direct reports first."); return; }
    if (managerError) { setError(managerError); return; }
    if (hasKycError) { setError("Please fix the highlighted KYC field errors."); return; }
    setError("");
    setSuccess("");

    const body: Record<string, unknown> = {};

    // Basic fields
    if (form.firstName !== employee.firstName) body.firstName = form.firstName;
    if (form.lastName !== (employee.lastName || "")) body.lastName = form.lastName;
    if (form.phone !== ((employee as any).phone || "")) body.phone = form.phone || null;
    if (form.designation !== employee.designation) body.designation = form.designation;
    if (managerChanged) body.reportingManagerId = form.reportingManagerId || null;
    if (form.dailyCallTarget !== (employee as any).dailyCallTarget) body.dailyCallTarget = form.dailyCallTarget ?? null;
    if (form.monthlySalesTarget !== (employee as any).monthlySalesTarget) body.monthlySalesTarget = form.monthlySalesTarget ?? null;

    const origBday = (employee as any).birthday
      ? new Date((employee as any).birthday).toISOString().slice(0, 10) : "";
    if (form.birthday !== origBday)
      body.birthday = form.birthday ? `${form.birthday}T00:00:00.000Z` : null;

    const origAnni = (employee as any).marriageAnniversary
      ? new Date((employee as any).marriageAnniversary).toISOString().slice(0, 10) : "";
    if (form.marriageAnniversary !== origAnni)
      body.marriageAnniversary = form.marriageAnniversary ? `${form.marriageAnniversary}T00:00:00.000Z` : null;

    // KYC fields
    if (form.aadhaarNumber !== ((employee as any).aadhaarNumber || ""))
      body.aadhaarNumber = form.aadhaarNumber || null;
    if (form.panNumber !== ((employee as any).panNumber || ""))
      body.panNumber = form.panNumber || null;
    if (form.emergencyContact !== ((employee as any).emergencyContact || ""))
      body.emergencyContact = form.emergencyContact || null;
    if (form.employeeType !== ((employee as any).employeeType || "EMPLOYEE"))
      body.employeeType = form.employeeType;

    if (Object.keys(body).length === 0) {
      setSuccess("No changes to save.");
      return;
    }

    try {
      await updateEmployee({ id: employee.id, body: body as any }).unwrap();
      setSuccess("Employee updated successfully!");
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to update employee");
    }
  };

  return (
    <ModalShell
      title={`Edit — ${employee.firstName} ${employee.lastName || ""}`}
      subtitle={`${employee.designation.replace(/_/g, " ")} · Update details, designation or reporting line`}
      onClose={onClose}
    >
      {error && <ValidationBanner message={error} type="error" />}
      {success && <ValidationBanner message={success} type="success" />}

      {/* ── Downgrade blocker banner ── */}
      {hasDowngradeBlocker && (
        <div style={{
          borderRadius: 12, marginBottom: 16, overflow: "hidden",
          border: "1.5px solid #E74C3C40",
        }}>
          <div style={{
            padding: "10px 14px", background: "#FEF0EF",
            borderBottom: "1px solid #E74C3C20",
            display: "flex", alignItems: "center", gap: 8,
            color: "#C0392B", fontSize: 13, fontWeight: 700,
          }}>
            <FiAlertTriangle size={15} />
            Cannot downgrade: direct reports must be reassigned first
          </div>
          <div style={{ padding: "10px 14px", background: "#FFFBFB", fontSize: 12, color: "#7B241C", lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 8px" }}>
              Changing <strong>{employee.firstName}'s</strong> designation from{" "}
              <strong>{employee.designation.replace(/_/g, " ")}</strong> to{" "}
              <strong>{form.designation.replace(/_/g, " ")}</strong> would make the following
              direct reports equal to or more senior. Please reassign them first:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {directReportBlockers.map((b) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", borderRadius: 8,
                  background: "#FEF0EF", border: "1px solid #E74C3C20",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: `${getColor(b.designation)}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: getColor(b.designation),
                  }}>
                    {b.firstName?.[0]}{b.lastName?.[0] || ""}
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: COLORS.darkIndigo }}>
                      {b.firstName} {b.lastName}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: getColor(b.designation), fontWeight: 600 }}>
                      {b.designation.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, color: "#C0392B",
                    background: "#FDECEA", padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                  }}>
                    Needs reassignment
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Manager change notice ── */}
      {managerChanged && !managerError && !hasDowngradeBlocker && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 16,
          background: "#FFF9E6", border: "1px solid #E6A81740",
          color: "#92670A", fontSize: 12, lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Reporting line change:</strong> The subordinate ID cache will be
            rebuilt automatically. This may take a moment.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Name ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}>First Name <span style={{ color: COLORS.danger }}>*</span></label>
            <InputWithIcon icon={FiUser} value={form.firstName} onChange={(v) => set("firstName", v)} required />
          </div>
          <div>
            <label style={fieldLabel}>Last Name</label>
            <InputWithIcon icon={FiUser} value={form.lastName} onChange={(v) => set("lastName", v)} />
          </div>
        </div>

        {/* ── Phone ── */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Phone</label>
          <InputWithIcon icon={FiPhone} value={form.phone} onChange={(v) => set("phone", v)} placeholder="10-digit mobile number" />
        </div>

        {/* ── Designation + Manager ── */}
        <div style={{
          background: hasDowngradeBlocker ? "#FEF8F8" : `${COLORS.lavender}08`,
          borderRadius: 12, padding: "16px 18px", marginBottom: 14,
          border: `1px solid ${hasDowngradeBlocker ? "#E74C3C30" : `${COLORS.lavender}30`}`,
          transition: "all 0.2s",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800,
            color: hasDowngradeBlocker ? "#C0392B" : COLORS.mauve,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14,
          }}>
            Designation &amp; Reporting Structure
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={fieldLabel}>Designation</label>
              <select
                value={form.designation}
                onChange={(e) => {
                  const newDesig = e.target.value as Designation;
                  set("designation", newDesig);
                  if (form.reportingManagerId) {
                    const mgr = employees.find((em) => em.id === form.reportingManagerId);
                    if (mgr) {
                      const mgrLevel = DESIGNATION_LEVEL[mgr.designation as Designation] ?? 0;
                      const newLevel = DESIGNATION_LEVEL[newDesig] ?? 0;
                      if (mgrLevel <= newLevel) set("reportingManagerId", "");
                    }
                  }
                }}
                style={{
                  ...selectStyle,
                  borderColor: hasDowngradeBlocker ? "#E74C3C50" : `${COLORS.lavender}60`,
                  background: hasDowngradeBlocker ? "#FEF0EF" : "#fff",
                }}
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {designationDowngrading && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#C0392B" }}>
                  ↓ Downgrade from {employee.designation.replace(/_/g, " ")}
                </p>
              )}
            </div>

            <div>
              <ManagerSelector
                value={form.reportingManagerId}
                onChange={(v) => set("reportingManagerId", v)}
                employees={employees}
                employeeDesignation={form.designation}
                editingId={employee.id}
                label="Reporting Manager"
              />
            </div>
          </div>

          {currentManagerId && (
            <div style={{ marginTop: 10, fontSize: 12, color: COLORS.mauve, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Current manager:</span>
              {(() => {
                const mgr = employees.find((e) => e.id === currentManagerId);
                return mgr
                  ? <span style={{ color: COLORS.darkIndigo, fontWeight: 600 }}>
                      {mgr.firstName} {mgr.lastName}
                      <span style={{ color: COLORS.mauve, fontWeight: 400, marginLeft: 4 }}>
                        ({mgr.designation.replace(/_/g, " ")})
                      </span>
                    </span>
                  : <span style={{ fontStyle: "italic" }}>Not in scope</span>;
              })()}
            </div>
          )}
        </div>

        {/* ── Targets ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}><FiTarget size={11} style={{ marginRight: 3 }} />Daily Call Target</label>
            <input type="number" min={0} value={form.dailyCallTarget ?? ""}
              onChange={(e) => set("dailyCallTarget", e.target.value ? Number(e.target.value) : undefined)}
              style={numberInputStyle} />
          </div>
          <div>
            <label style={fieldLabel}><FiTarget size={11} style={{ marginRight: 3 }} />Monthly Sales Target</label>
            <input type="number" min={0} step="0.01" value={form.monthlySalesTarget ?? ""}
              onChange={(e) => set("monthlySalesTarget", e.target.value ? Number(e.target.value) : undefined)}
              style={numberInputStyle} />
          </div>
        </div>

        {/* ── Birthday + Anniversary ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fieldLabel}><FiCalendar size={11} style={{ marginRight: 3 }} />Birthday</label>
            <input type="date" value={form.birthday}
              onChange={(e) => set("birthday", e.target.value)} style={numberInputStyle} />
          </div>
          <div>
            <label style={fieldLabel}><FiCalendar size={11} style={{ marginRight: 3 }} />Marriage Anniversary</label>
            <input type="date" value={form.marriageAnniversary}
              onChange={(e) => set("marriageAnniversary", e.target.value)} style={numberInputStyle} />
          </div>
        </div>

        {/* ── KYC & Employment Details ─────────────────────────────────────────── */}
        <div style={{
          background: `${COLORS.lavender}08`, borderRadius: 12,
          padding: "16px 18px", marginBottom: 22,
          border: `1px solid ${COLORS.lavender}30`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: COLORS.mauve,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14,
          }}>
            KYC &amp; Employment Details
          </div>

          {/* Employee Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Employee Type</label>
            <select
              value={form.employeeType}
              onChange={(e) => set("employeeType", e.target.value as typeof form.employeeType)}
              style={selectStyle}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="PNL">P&amp;L</option>
              <option value="CHANNEL_PARTNER">Channel Partner</option>
            </select>
          </div>

          {/* Aadhaar + PAN */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={fieldLabel}>Aadhaar Number</label>
              <div style={{
                display: "flex", alignItems: "center",
                border: `1.5px solid ${aadhaarError ? COLORS.danger : COLORS.lavender}60`,
                borderRadius: 10, padding: "0 12px",
                background: aadhaarError ? "#FEF0EF" : "transparent",
              }}>
                <FiUser size={15} color={COLORS.mauve} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={form.aadhaarNumber}
                  placeholder="12-digit Aadhaar"
                  onChange={(e) => set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "10px",
                    fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
              {aadhaarError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{aadhaarError}</p>}
            </div>

            <div>
              <label style={fieldLabel}>PAN Number</label>
              <div style={{
                display: "flex", alignItems: "center",
                border: `1.5px solid ${panError ? COLORS.danger : COLORS.lavender}60`,
                borderRadius: 10, padding: "0 12px",
                background: panError ? "#FEF0EF" : "transparent",
              }}>
                <FiUser size={15} color={COLORS.mauve} />
                <input
                  type="text"
                  maxLength={10}
                  value={form.panNumber}
                  placeholder="e.g. ABCDE1234F"
                  onChange={(e) => set("panNumber", e.target.value.toUpperCase().slice(0, 10))}
                  style={{
                    flex: 1, border: "none", outline: "none", padding: "10px",
                    fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px",
                  }}
                />
              </div>
              {panError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{panError}</p>}
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label style={fieldLabel}><FiPhone size={11} style={{ marginRight: 3 }} />Emergency Contact Number</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${emergencyError ? COLORS.danger : COLORS.lavender}60`,
              borderRadius: 10, padding: "0 12px",
              background: emergencyError ? "#FEF0EF" : "transparent",
            }}>
              <FiPhone size={15} color={COLORS.mauve} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.emergencyContact}
                placeholder="10-digit number"
                onChange={(e) => set("emergencyContact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
            {emergencyError && <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.danger }}>{emergencyError}</p>}
          </div>
        </div>

        <button type="submit" disabled={isLoading || isBlocked} style={{
          width: "100%", padding: 13, borderRadius: 10, border: "none",
          background: (isLoading || isBlocked)
            ? COLORS.lavender
            : `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          color: (isLoading || isBlocked) ? COLORS.mauve : "#fff",
          fontSize: 14, fontWeight: 700,
          cursor: (isLoading || isBlocked) ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s",
        }}>
          {isLoading
            ? "Saving..."
            : hasDowngradeBlocker
              ? "Reassign direct reports first"
              : "Save Changes"
          }
        </button>
      </form>
    </ModalShell>
  );
}