"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  selectUser,
  selectAuthLoading,
  selectIsAuthenticated,
  setUser,
  setLoading,
  logout as logoutAction,
} from "../slices/authSlice";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import type { User } from "../slices/authSlice";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "OWNER" | "CASHIER";
  restaurantName?: string;
  restaurantNameAr?: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") {
      dispatch(setLoading(false));
      return;
    }

    const currentPath = pathname || window.location.pathname;
    const isPublicPage =
      currentPath === "/" ||
      currentPath.startsWith("/menu/") ||
      currentPath.startsWith("/order/") ||
      currentPath.startsWith("/auth/login") ||
      currentPath.startsWith("/auth/register") ||
      currentPath.startsWith("/kitchen/login") ||
      currentPath === "/contact" ||
      currentPath.startsWith("/contact");

    if (
      user &&
      (currentPath.startsWith("/auth/login") ||
        currentPath.startsWith("/auth/register"))
    ) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.restaurant) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      dispatch(setLoading(false));
      return;
    }

    const isProtectedPage =
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/dashboard") ||
      currentPath.startsWith("/kitchen");

    if (!isProtectedPage) {
      dispatch(setLoading(false));
      return;
    }

    try {
      const response = await api.get("/auth/me");
      const fetchedUser = response.data.data.user;
      dispatch(setUser(fetchedUser));

      if (fetchedUser.role === "ADMIN" && !currentPath.startsWith("/admin")) {
        if (
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/order/") ||
          isProtectedPage
        ) {
          router.push("/admin");
        }
      } else if (
        fetchedUser.role === "OWNER" &&
        currentPath.startsWith("/admin")
      ) {
        router.push("/dashboard");
      } else if (
        isProtectedPage &&
        fetchedUser.role === "OWNER" &&
        !fetchedUser.restaurant &&
        !currentPath.startsWith("/onboarding")
      ) {
        router.push("/onboarding");
      }
    } catch (error: any) {
      dispatch(setUser(null));
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      if (isProtectedPage) {
        if (currentPath.startsWith("/admin")) {
          router.push("/auth/login");
        } else if (currentPath.startsWith("/dashboard")) {
          router.push("/auth/login");
        } else if (currentPath.startsWith("/kitchen")) {
          router.push("/kitchen/login");
        }
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [pathname, router, dispatch]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(setLoading(true));
        const response = await api.post("/auth/login", { email, password });
        const { user: loggedInUser } = response.data.data;
        dispatch(setUser(loggedInUser));
        toast.success("Login successful");

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/kitchen/login")
        ) {
          setTimeout(() => {
            if (loggedInUser.role === "ADMIN") {
              router.push("/admin");
            } else if (loggedInUser.restaurant) {
              router.push("/dashboard");
            } else {
              router.push("/onboarding");
            }
          }, 100);
        }
      } catch (error: any) {
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, router]
  );

  const loginWithToken = useCallback(
    async (token: string, userData: User) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        dispatch(setLoading(true));
        const response = await api.post("/auth/register", data);
        const { user: newUser } = response.data.data;
        dispatch(setUser(newUser));
        toast.success("Registration successful");
        router.push("/dashboard");
      } catch (error: any) {
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, router]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/auth/login");
  }, [dispatch, router]);

  const updateProfile = useCallback(
    async (data: UpdateProfileData) => {
      try {
        const response = await api.put("/auth/profile", data);
        dispatch(setUser(response.data.data.user));
      } catch (error: any) {
        throw error;
      }
    },
    [dispatch]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      dispatch(setUser(response.data.data.user));
    } catch (error) {
      dispatch(setUser(null));
      throw error;
    }
  }, [dispatch]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    loginWithToken,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };
}
