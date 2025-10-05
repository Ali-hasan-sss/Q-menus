import { cookies } from "next/headers";
import { api } from "./api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "CASHIER" | "ADMIN";
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

export interface Session {
  user: User;
  token: string;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // Make API call to get user profile
    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      user: response.data.data.user,
      token,
    };
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export async function requireRole(roles: string[]): Promise<Session> {
  const session = await requireAuth();

  if (!roles.includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }

  return session;
}

export async function requireRestaurant(): Promise<Session> {
  const session = await requireAuth();

  if (!session.user.restaurant) {
    throw new Error("Restaurant access required");
  }

  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(["ADMIN"]);
}
