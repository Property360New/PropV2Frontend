"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/store/expenses.api";
import type { Expense, ExpenseCategory, ExpenseSubCategory } from "@/types";
import {
  FiPlus, FiX, FiCalendar, FiFileText,
  FiChevronLeft, FiChevronRight, FiTrash2,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

const CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: "PERSONAL", label: "Personal", color: "#3498DB" },
  { value: "OFFICE", label: "Office", color: COLORS.gold },
];

export const SUBCATEGORIES: Record<
  ExpenseCategory,
  { value: ExpenseSubCategory; label: string; color: string }[]
> = {
  PERSONAL: [
    { value: "FAMILY", label: "Family", color: "#007BFF" },
    { value: "GROCERY", label: "Grocery", color: "#007BFF" },
    { value: "VEGETABLES_FRUITS", label: "Vegetables & Fruits", color: "#28A745" },
    { value: "MAINTENANCE", label: "Maintenance", color: "#17A2B8" },
    { value: "RECHARGE", label: "Recharge", color: "#FFC107" },
    { value: "IGL", label: "IGL", color: "#6F42C1" },
    { value: "CLOTHS", label: "Cloths", color: "#DC3545" },
    { value: "MEDICAL", label: "Medical", color: "#28A745" },
    { value: "EMI", label: "EMI", color: "#343A40" },
    { value: "MAID", label: "Maid", color: "#F08080" },
    { value: "VEHICLE", label: "Vehicle", color: "#17A2B8" },
    { value: "GIFTS", label: "Gifts", color: "#007BFF" },
    { value: "TRAVELS", label: "Travels", color: "#FF6F61" },
    { value: "INVESTMENT", label: "Investment", color: "#6610F2" },
    { value: "LIC", label: "LIC", color: "#6C757D" },
    { value: "PERSONAL_OTHER", label: "Other", color: "#343A40" },
  ],
  OFFICE: [
    { value: "SALARY", label: "Salary", color: "#4CAF50" },
    { value: "MARKETING", label: "Marketing", color: "#FF9800" },
    { value: "INCENTIVE", label: "Incentive", color: "#FF5722" },
    { value: "STATIONERY", label: "Stationery", color: "#7b61ff" },
    { value: "MISCELLANEOUS", label: "Miscellaneous", color: "#9E9E9E" },
    { value: "MOBILE_RECHARGE", label: "Mobile Recharge", color: "#FF4081" },
    { value: "WIFI_RECHARGE", label: "WiFi Recharge", color: "#3F51B5" },
    { value: "OFFICE_EXPENSE", label: "Office Expense", color: "#00BCD4" },
    { value: "CONVEYANCE", label: "Conveyance", color: "#8BC34A" },
    { value: "ELECTRICITY", label: "Electricity", color: "#FFC107" },
    { value: "OFFICE_MAINTENANCE", label: "Maintenance", color: "#9C27B0" },
    { value: "OFFICE_OTHER", label: "Other", color: "#607D8B" },
  ],
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function getSubCategoryInfo(subCategory?: string) {
  if (!subCategory) return null;
  for (const subs of Object.values(SUBCATEGORIES)) {
    const found = subs.find((s) => s.value === subCategory);
    if (found) return found;
  }
  return null;
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [subCategory, setSubCategory] = useState<ExpenseSubCategory | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteExpense] = useDeleteExpenseMutation();

  const availableSubCategories = category ? SUBCATEGORIES[category] : [];

  const { data, isLoading } = useGetExpensesQuery({
    page, limit,
    category: category || undefined,
    subCategory: subCategory || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const expenses: Expense[] = data?.data || [];
  const meta = data?.meta;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await deleteExpense(id).unwrap(); } catch { alert("Failed to delete expense."); }
  };

  return (
    <>
      <TopBar title="Expenses" subtitle="Track and manage company expenses" >
      <TutorialButton videoUrl={TUTORIALS.expenses} />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>
        {/* Summary Cards */}
        {meta && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{
              background: COLORS.white, borderRadius: 14, padding: "18px 20px",
              border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: `${COLORS.gold}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${COLORS.gold}20`,
              }}>
                <TbCurrencyRupee size={20} color={COLORS.gold} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.darkIndigo }}>
                  {formatCurrency(meta.totalAmount || 0)}
                </div>
                <div style={{ fontSize: 12, color: COLORS.mauve, fontWeight: 600 }}>Total Amount</div>
              </div>
            </div>
            <div style={{
              background: COLORS.white, borderRadius: 14, padding: "18px 20px",
              border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: `${COLORS.mauve}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${COLORS.mauve}20`,
              }}>
                <FiFileText size={20} color={COLORS.mauve} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.darkIndigo }}>{meta.total}</div>
                <div style={{ fontSize: 12, color: COLORS.mauve, fontWeight: 600 }}>Total Entries</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "12px 24px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 12px ${COLORS.gold}40`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <FiPlus size={16} /> Add Expense
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ExpenseCategory | "");
              setSubCategory("");
              setPage(1);
            }}
            style={{
              padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
              fontSize: 13, background: COLORS.white, color: COLORS.darkIndigo, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {/* SubCategory filter — only shown when a category is selected */}
          {category && (
            <select
              value={subCategory}
              onChange={(e) => { setSubCategory(e.target.value as ExpenseSubCategory | ""); setPage(1); }}
              style={{
                padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
                fontSize: 13, background: COLORS.white, color: COLORS.darkIndigo, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <option value="">All Sub-categories</option>
              {availableSubCategories.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <FiCalendar size={14} color={COLORS.mauve} />
            <input
              type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{
                padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
                fontSize: 12, background: COLORS.white, color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <span style={{ color: COLORS.mauve, fontSize: 12 }}>to</span>
            <input
              type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{
                padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
                fontSize: 12, background: COLORS.white, color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: COLORS.white, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
                  {["Title", "Category", "Sub-category", "Amount", "Date", "Created By", "Description", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading">
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Loading expenses...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>No expenses found.</td>
                  </tr>
                ) : (
                  expenses.map((exp, i) => {
                    const catInfo = CATEGORIES.find((c) => c.value === exp.category);
                    const subCatInfo = getSubCategoryInfo(exp.subCategory);
                    return (
                      <tr
                        key={exp.id}
                        style={{
                          borderBottom: `1px solid ${COLORS.lavender}20`,
                          background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                        }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.darkIndigo }}>{exp.title}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            color: catInfo?.color || COLORS.mauve,
                            background: `${catInfo?.color || COLORS.mauve}12`,
                            border: `1px solid ${catInfo?.color || COLORS.mauve}25`,
                          }}>
                            {catInfo?.label || exp.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {subCatInfo ? (
                            <span style={{
                              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              color: subCatInfo.color,
                              background: `${subCatInfo.color}12`,
                              border: `1px solid ${subCatInfo.color}25`,
                            }}>
                              {subCatInfo.label}
                            </span>
                          ) : (
                            <span style={{ color: COLORS.mauve, fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: COLORS.darkIndigo }}>
                          {formatCurrency(exp.amount)}
                        </td>
                        <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12, whiteSpace: "nowrap" }}>
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td style={{ padding: "12px 16px", color: COLORS.darkIndigo, fontSize: 12 }}>
                          {exp.createdBy ? `${exp.createdBy.firstName} ${exp.createdBy.lastName}` : "—"}
                        </td>
                        <td style={{
                          padding: "12px 16px", color: COLORS.mauve, fontSize: 12,
                          maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {exp.description || "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            title="Delete"
                            style={{
                              background: `${COLORS.danger}10`, border: `1px solid ${COLORS.danger}25`,
                              borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                              color: COLORS.danger, display: "flex", alignItems: "center",
                            }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderTop: `1px solid ${COLORS.lavender}20`,
              fontSize: 13, color: COLORS.mauve,
            }}>
              <span>
                {meta.total > 0 ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}` : "0 results"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>
                  <FiChevronLeft size={14} />
                </button>
                <span style={{ padding: "6px 12px", fontWeight: 700, color: COLORS.darkIndigo }}>{meta.page} / {meta.totalPages}</span>
                <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page >= meta.totalPages ? "not-allowed" : "pointer", opacity: page >= meta.totalPages ? 0.4 : 1 }}>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

// ─── Create Expense Modal ───────────────────────────────────
function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  const [createExpense, { isLoading }] = useCreateExpenseMutation();
  const [form, setForm] = useState({
    category: "PERSONAL" as ExpenseCategory,
    subCategory: "" as ExpenseSubCategory | "",
    title: "",
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const currentSubCategories = SUBCATEGORIES[form.category] || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.subCategory) { setError("Please select a sub-category"); return; }
    try {
      await createExpense({
        category: form.category,
        subCategory: form.subCategory as ExpenseSubCategory,
        title: form.title,
        amount: Number(form.amount),
        description: form.description || undefined,
        expenseDate: form.expenseDate,
      }).unwrap();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Failed to create expense";
      setError(msg);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: 32, width: 440,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}>
          <FiX size={20} />
        </button>

        <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo }}>
          Add Expense
        </h2>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: COLORS.dangerLight, color: COLORS.danger, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category toggle */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>
              Category <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value} type="button"
                  onClick={() => { set("category", c.value); set("subCategory", ""); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
                    border: form.category === c.value ? `2px solid ${c.color}` : `1.5px solid ${COLORS.lavender}50`,
                    background: form.category === c.value ? `${c.color}10` : "#fff",
                    color: form.category === c.value ? c.color : COLORS.mauve,
                    fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-category dropdown */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>
              Sub-category <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                required
                value={form.subCategory}
                onChange={(e) => set("subCategory", e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
                  background: "#fff", color: form.subCategory ? COLORS.darkIndigo : COLORS.mauve,
                  fontFamily: "'DM Sans', sans-serif", appearance: "none", cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select sub-category...</option>
                {currentSubCategories.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {/* Show colored dot for selected sub-category */}
              {form.subCategory && (() => {
                const info = currentSubCategories.find((s) => s.value === form.subCategory);
                return info ? (
                  <span style={{
                    position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)",
                    width: 10, height: 10, borderRadius: "50%", background: info.color,
                  }} />
                ) : null;
              })()}
            </div>
            {/* Chips preview */}
            {form.subCategory && (() => {
              const info = currentSubCategories.find((s) => s.value === form.subCategory);
              return info ? (
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    color: info.color, background: `${info.color}12`, border: `1px solid ${info.color}25`,
                  }}>
                    {info.label}
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>
              Title <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px" }}>
              <FiFileText size={15} color={COLORS.mauve} />
              <input
                required value={form.title} onChange={(e) => set("title", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>
                Amount <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px" }}>
                <TbCurrencyRupee size={15} color={COLORS.mauve} />
                <input
                  type="number" required min={1} step="0.01"
                  value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>
                Date <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <input
                type="date" required value={form.expenseDate}
                onChange={(e) => set("expenseDate", e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
                  background: "#fff", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4 }}>Description</label>
            <textarea
              value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3}
              style={{
                width: "100%", border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10,
                padding: "10px 12px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit" disabled={isLoading}
            style={{
              width: "100%", padding: 13, borderRadius: 10, border: "none",
              background: isLoading ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: isLoading ? "none" : `0 4px 12px ${COLORS.gold}40`,
            }}
          >
            {isLoading ? "Creating..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}