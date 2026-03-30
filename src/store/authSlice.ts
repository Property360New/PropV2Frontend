import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import type { Employee } from "@/types";

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  employee: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ employee: Employee; accessToken: string; refreshToken: string }>) {
      const { employee, accessToken, refreshToken } = action.payload;
      state.employee = employee;
      state.isAuthenticated = true;
      Cookies.set("accessToken", accessToken, { sameSite: "strict" });
      Cookies.set("refreshToken", refreshToken, { sameSite: "strict" });
    },
    restoreSession(state) {
      const token = Cookies.get("accessToken");
      if (token) {
        state.isAuthenticated = true;
      }
    },
    setEmployee(state, action: PayloadAction<Employee>) {
      state.employee = action.payload;
    },
    clearAuth(state) {
      state.employee = null;
      state.isAuthenticated = false;
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    },
  },
});

export const { setCredentials, restoreSession, setEmployee, clearAuth } = authSlice.actions;
export default authSlice.reducer;
