"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: { items: number };
}

export interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency?: string;
  image?: string;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: { name: string; nameAr?: string };
}

export interface Menu {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
  createdAt: string;
  categories: Category[];
}

export interface QRCode {
  id: string;
  tableNumber: string;
  qrCode: string;
  qrCodeImage?: string;
  isActive: boolean;
  isOccupied?: boolean;
  createdAt: string;
  _count: { orders: number };
}

export interface RestaurantQRCode {
  id: string;
  tableNumber: null;
  qrCodeUrl: string;
  qrCodeImage: string;
  isActive: boolean;
}

interface MenuState {
  menu: Menu | null;
  categories: Category[];
  items: MenuItem[];
  qrCodes: QRCode[];
  restaurantQR: RestaurantQRCode | null;
  restaurantCurrency: string;
  loading: boolean;
  loadingItems: boolean;
  error: string | null;
}

const initialState: MenuState = {
  menu: null,
  categories: [],
  items: [],
  qrCodes: [],
  restaurantQR: null,
  restaurantCurrency: "USD",
  loading: false,
  loadingItems: false,
  error: null,
};

// Async Thunks
export const fetchMenu = createAsyncThunk("menu/fetchMenu", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/menu");
    if (response.data.success) return response.data.data;
    throw new Error("Failed to fetch menu");
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch menu");
  }
});

export const fetchCategories = createAsyncThunk("menu/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/menu/categories");
    if (response.data.success) return response.data.data;
    throw new Error("Failed to fetch categories");
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch categories");
  }
});

export const fetchCategoryItems = createAsyncThunk(
  "menu/fetchCategoryItems",
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/categories/${categoryId}/items`);
      if (response.data.success) return { categoryId, ...response.data.data };
      throw new Error("Failed to fetch items");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch items");
    }
  }
);

export const fetchItems = createAsyncThunk(
  "menu/fetchItems",
  async (categoryId: string | undefined, { rejectWithValue }) => {
    try {
      const params = categoryId ? `?categoryId=${categoryId}` : "";
      const response = await api.get(`/menu/items${params}`);
      if (response.data.success) return response.data.data;
      throw new Error("Failed to fetch items");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch items");
    }
  }
);

interface CreateCategoryData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  sortOrder?: number;
}

export const createCategory = createAsyncThunk(
  "menu/createCategory",
  async (data: CreateCategoryData, { rejectWithValue }) => {
    try {
      const response = await api.post("/menu/categories", data);
      if (response.data.success) return response.data.data.category;
      throw new Error("Failed to create category");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create category");
    }
  }
);

export const updateCategory = createAsyncThunk(
  "menu/updateCategory",
  async ({ id, data }: { id: string; data: CreateCategoryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/categories/${id}`, data);
      if (response.data.success) return response.data.data.category;
      throw new Error("Failed to update category");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update category");
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "menu/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/categories/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete category");
    }
  }
);

export const toggleCategoryStatus = createAsyncThunk(
  "menu/toggleCategoryStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/categories/${id}/toggle`);
      if (response.data.success) return response.data.data.category;
      throw new Error("Failed to toggle");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle");
    }
  }
);

export const resetAllCategories = createAsyncThunk(
  "menu/resetAllCategories",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/menu/categories/reset/all");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to reset");
    }
  }
);

interface CreateItemData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency?: string;
  image?: string;
  sortOrder?: number;
  categoryId: string;
  extras?: any;
}

export const createItem = createAsyncThunk(
  "menu/createItem",
  async (data: CreateItemData, { rejectWithValue }) => {
    try {
      const response = await api.post("/menu/items", data);
      if (response.data.success) return response.data.data.menuItem;
      throw new Error("Failed to create item");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create item");
    }
  }
);

export const updateItem = createAsyncThunk(
  "menu/updateItem",
  async ({ id, data }: { id: string; data: CreateItemData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/items/${id}`, data);
      if (response.data.success) return response.data.data.menuItem;
      throw new Error("Failed to update item");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update item");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "menu/deleteItem",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/items/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete item");
    }
  }
);

export const toggleItemStatus = createAsyncThunk(
  "menu/toggleItemStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/items/${id}/toggle`);
      if (response.data.success) return response.data.data.menuItem;
      throw new Error("Failed to toggle");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle");
    }
  }
);

export const updateMenuName = createAsyncThunk(
  "menu/updateMenuName",
  async ({ name, nameAr }: { name: string; nameAr?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put("/menu/name", { name, nameAr });
      if (response.data.success) return { name, nameAr };
      throw new Error("Failed to update");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update");
    }
  }
);

export const applyDiscountToAll = createAsyncThunk(
  "menu/applyDiscountToAll",
  async (discount: number, { rejectWithValue }) => {
    try {
      const response = await api.post("/menu/discount/all", { discount });
      if (response.data.success) return response.data.data;
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const applyDiscountToCategory = createAsyncThunk(
  "menu/applyDiscountToCategory",
  async ({ categoryId, discount }: { categoryId: string; discount: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/menu/discount/category/${categoryId}`, { discount });
      if (response.data.success) return response.data.data;
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const fetchQRCodes = createAsyncThunk("menu/fetchQRCodes", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/qr");
    if (response.data.success) return response.data.data.qrCodes;
    throw new Error("Failed");
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed");
  }
});

export const createQRCode = createAsyncThunk(
  "menu/createQRCode",
  async (tableNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.post("/qr/generate", { tableNumber });
      if (response.data.success) return response.data.data.qrCode;
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const createRestaurantQR = createAsyncThunk(
  "menu/createRestaurantQR",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/qr/restaurant-code");
      if (response.data.success) return response.data.data.qrCode;
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const toggleQRStatus = createAsyncThunk(
  "menu/toggleQRStatus",
  async (qrId: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/qr/${qrId}/toggle`);
      if (response.data.success) return response.data.data?.qrCode || { id: qrId };
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const toggleTableOccupied = createAsyncThunk(
  "menu/toggleTableOccupied",
  async (qrId: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/qr/${qrId}/toggle-occupied`);
      if (response.data.success) {
        const updated = response.data.data?.qrCode;
        return { qrId, isOccupied: updated?.isOccupied };
      }
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const deleteQRCode = createAsyncThunk(
  "menu/deleteQRCode",
  async (qrId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/qr/${qrId}`);
      return qrId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const bulkCreateQRCodes = createAsyncThunk(
  "menu/bulkCreateQRCodes",
  async (tableNumbers: string[], { rejectWithValue }) => {
    try {
      const response = await api.post("/qr/bulk-generate", { tableNumbers });
      if (response.data.success) return response.data.data.qrCodes;
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const bulkCreateSequentialQRCodes = createAsyncThunk(
  "menu/bulkCreateSequentialQRCodes",
  async (count: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/qr/bulk-generate-sequential", { count });
      if (response.data.success) {
        await dispatch(fetchQRCodes());
        return response.data.data.createdQRCodes;
      }
      throw new Error("Failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const bulkDeleteQRCodes = createAsyncThunk(
  "menu/bulkDeleteQRCodes",
  async (qrCodeIds: string[], { rejectWithValue }) => {
    try {
      await api.delete("/qr/bulk-delete", { data: { qrCodeIds } });
      return qrCodeIds;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMenuData: (state) => {
      state.menu = null;
      state.categories = [];
      state.items = [];
      state.restaurantQR = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.menu = action.payload.menu;
        if (action.payload.currency) state.restaurantCurrency = action.payload.currency;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        if (action.payload.currency) state.restaurantCurrency = action.payload.currency;
        state.items = [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategoryItems.pending, (state) => {
        state.loadingItems = true;
        state.error = null;
      })
      .addCase(fetchCategoryItems.fulfilled, (state, action) => {
        state.loadingItems = false;
        const { categoryId, items: categoryItems = [], currency } = action.payload;
        if (currency) state.restaurantCurrency = currency;
        state.items = state.items.filter((i) => i.categoryId !== categoryId).concat(categoryItems);
      })
      .addCase(fetchCategoryItems.rejected, (state, action) => {
        state.loadingItems = false;
        state.error = action.payload as string;
      })
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        if (action.payload.currency) state.restaurantCurrency = action.payload.currency;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.categories[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
        state.items = state.items.filter((i) => i.categoryId !== action.payload);
      })
      .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
        const idx = state.categories.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.categories[idx] = action.payload;
      })
      .addCase(resetAllCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetAllCategories.fulfilled, (state) => {
        state.loading = false;
        state.categories = [];
        state.items = [];
      })
      .addCase(resetAllCategories.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(toggleItemStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(updateMenuName.fulfilled, (state, action) => {
        if (state.menu) {
          state.menu.name = action.payload.name;
          state.menu.nameAr = action.payload.nameAr;
        }
      })
      .addCase(fetchQRCodes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQRCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.qrCodes = action.payload;
      })
      .addCase(fetchQRCodes.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createQRCode.fulfilled, (state, action) => {
        state.qrCodes.push(action.payload);
      })
      .addCase(createRestaurantQR.fulfilled, (state, action) => {
        state.restaurantQR = action.payload;
      })
      .addCase(toggleQRStatus.fulfilled, (state, action) => {
        const qr = action.payload as any;
        const qrId = qr?.id || qr;
        const idx = state.qrCodes.findIndex((q) => q.id === qrId);
        if (idx >= 0 && qr) state.qrCodes[idx] = { ...state.qrCodes[idx], ...qr };
      })
      .addCase(toggleTableOccupied.fulfilled, (state, action) => {
        const { qrId, isOccupied } = action.payload;
        const idx = state.qrCodes.findIndex((q) => q.id === qrId);
        if (idx >= 0) state.qrCodes[idx] = { ...state.qrCodes[idx], isOccupied };
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("qrCodesUpdated"));
      })
      .addCase(deleteQRCode.fulfilled, (state, action) => {
        state.qrCodes = state.qrCodes.filter((q) => q.id !== action.payload);
      })
      .addCase(bulkCreateQRCodes.fulfilled, (state, action) => {
        state.qrCodes.push(...action.payload);
      })
      .addCase(bulkCreateSequentialQRCodes.fulfilled, (state) => {
        // State updated by fetchQRCodes in the thunk
      })
      .addCase(bulkDeleteQRCodes.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.qrCodes = state.qrCodes.filter((q) => !ids.has(q.id));
      });
  },
});

export const { clearError, clearMenuData } = menuSlice.actions;
export default menuSlice.reducer;
