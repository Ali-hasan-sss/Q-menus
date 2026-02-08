"use client";

import { createSlice } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "CASHIER" | "ADMIN";
  emailVerified: boolean;
  restaurant?: {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive: boolean;
    subscription?: {
      id: string;
      status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
      startDate: string;
      endDate: string;
      plan: {
        id: string;
        name: string;
        nameAr?: string;
        type: "BASIC" | "PREMIUM" | "ENTERPRISE";
        price: number;
        currency: string;
        duration: number;
        maxTables: number;
        maxMenus: number;
        features: string[];
      };
    };
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: { payload: User | null }) => {
      state.user = action.payload;
    },
    setLoading: (state, action: { payload: boolean }) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, setLoading, logout } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.user;

export default authSlice.reducer;
