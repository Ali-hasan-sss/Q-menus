"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: {
    items: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  image?: string;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: {
    name: string;
    nameAr?: string;
  };
}

interface Menu {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
  createdAt: string;
  categories: Category[];
}

interface QRCode {
  id: string;
  tableNumber: string;
  qrCode: string;
  qrCodeImage?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface RestaurantQRCode {
  id: string;
  tableNumber: null;
  qrCodeUrl: string;
  qrCodeImage: string;
  isActive: boolean;
}

interface MenuContextType {
  // State
  menu: Menu | null;
  categories: Category[];
  items: MenuItem[];
  qrCodes: QRCode[];
  restaurantQR: RestaurantQRCode | null;
  restaurantCurrency: string;
  loading: boolean;
  loadingItems: boolean;
  error: string | null;

  // Actions
  fetchMenu: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchItems: (categoryId?: string) => Promise<void>;
  fetchCategoryItems: (categoryId: string) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;
  resetAllCategories: () => Promise<void>;
  createItem: (data: CreateItemData) => Promise<MenuItem>;
  updateItem: (id: string, data: UpdateItemData) => Promise<MenuItem>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemStatus: (id: string) => Promise<void>;
  updateMenuName: (name: string, nameAr?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  applyDiscountToAll: (discount: number) => Promise<{ updatedCount: number }>;
  applyDiscountToCategory: (
    categoryId: string,
    discount: number,
  ) => Promise<{ updatedCount: number }>;

  // Excel Import Actions
  downloadExcelTemplate: (lang: string) => Promise<Blob>;
  importExcelFile: (file: File) => Promise<{
    categoriesCreated: number;
    itemsCreated: number;
  }>;

  // QR Code Actions
  fetchQRCodes: () => Promise<void>;
  createQRCode: (tableNumber: string) => Promise<QRCode>;
  createRestaurantQR: () => Promise<RestaurantQRCode>;
  toggleQRStatus: (qrId: string) => Promise<void>;
  toggleTableOccupied: (qrId: string) => Promise<void>;
  deleteQRCode: (qrId: string) => Promise<void>;
  bulkCreateQRCodes: (tableNumbers: string[]) => Promise<QRCode[]>;
  bulkCreateSequentialQRCodes: (count: number) => Promise<QRCode[]>;
  bulkDeleteQRCodes: (qrCodeIds: string[]) => Promise<void>;
}

interface CreateCategoryData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  sortOrder?: number;
}

interface UpdateCategoryData extends CreateCategoryData {}

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

interface UpdateItemData extends CreateItemData {}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [restaurantQR, setRestaurantQR] = useState<RestaurantQRCode | null>(
    null,
  );
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu data
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/menu");
      if (response.data.success) {
        setMenu(response.data.data.menu);
        // Update currency if provided
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch menu");
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories only (without items for better performance)
  const fetchCategories = useCallback(async () => {
    try {
      console.log("🔄 Fetching categories...");
      setLoading(true);
      setError(null);
      const response = await api.get("/menu/categories");
      console.log("📦 Categories response:", response.data);
      if (response.data.success) {
        // Only set categories, items will be loaded separately
        setCategories(response.data.data.categories);
        // Update currency if provided
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        }
        console.log(
          "✅ Categories loaded:",
          response.data.data.categories.length,
        );
        // Clear items to ensure clean state
        setItems([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching categories:", error);
      setError(error.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items
  const fetchItems = useCallback(async (categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = categoryId ? `?categoryId=${categoryId}` : "";
      const response = await api.get(`/menu/items${params}`);
      if (response.data.success) {
        setItems(response.data.data.items);
        // Update currency if provided
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch items");
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items for a specific category
  const fetchCategoryItems = useCallback(async (categoryId: string) => {
    try {
      setLoadingItems(true);
      setError(null);
      const response = await api.get(`/menu/categories/${categoryId}/items`);
      if (response.data.success) {
        const categoryItems = response.data.data.items;

        // Update currency if provided
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        }

        // Add items to the global items state
        setItems((prevItems) => {
          // Remove existing items for this category first
          const filteredItems = prevItems.filter(
            (item) => item.categoryId !== categoryId,
          );
          // Add new items
          return [...filteredItems, ...categoryItems];
        });
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to fetch category items",
      );
      console.error("Error fetching category items:", error);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Create category
  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category> => {
      try {
        setError(null);
        const response = await api.post("/menu/categories", data);
        if (response.data.success) {
          const newCategory = response.data.data.category;
          setCategories((prev) => [...prev, newCategory]);
          return newCategory;
        }
        throw new Error("Failed to create category");
      } catch (error: any) {
        // Don't set error state for plan limit errors - let the UI handle them
        if (
          !error.response?.data?.message?.includes(
            "maximum number of categories",
          )
        ) {
          const errorMessage =
            error.response?.data?.message || "Failed to create category";
          setError(errorMessage);
        }
        throw error; // Re-throw the original error to preserve response data
      }
    },
    [],
  );

  // Update category
  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryData): Promise<Category> => {
      try {
        setError(null);
        const response = await api.put(`/menu/categories/${id}`, data);
        if (response.data.success) {
          const updatedCategory = response.data.data.category;
          setCategories((prev) =>
            prev.map((cat) => (cat.id === id ? updatedCategory : cat)),
          );
          return updatedCategory;
        }
        throw new Error("Failed to update category");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update category";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Delete category
  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await api.delete(`/menu/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete category";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Toggle category status
  const toggleCategoryStatus = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const response = await api.put(`/menu/categories/${id}/toggle`);
        if (response.data.success) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === id ? { ...cat, isActive: !cat.isActive } : cat,
            ),
          );
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to toggle category status";
        setError(errorMessage);
        console.error("Error toggling category status:", error);
      }
    },
    [],
  );

  // Create item
  const createItem = useCallback(
    async (data: CreateItemData): Promise<MenuItem> => {
      try {
        setError(null);
        const response = await api.post("/menu/items", data);
        if (response.data.success) {
          const newItem = response.data.data.menuItem;
          setItems((prev) => [...prev, newItem]);
          return newItem;
        }
        throw new Error("Failed to create item");
      } catch (error: any) {
        // Don't set error state for plan limit errors - let the UI handle them
        if (
          !error.response?.data?.message?.includes("maximum number of items")
        ) {
          const errorMessage =
            error.response?.data?.message || "Failed to create item";
          setError(errorMessage);
        }
        throw error; // Re-throw the original error to preserve response data
      }
    },
    [],
  );

  // Update item
  const updateItem = useCallback(
    async (id: string, data: UpdateItemData): Promise<MenuItem> => {
      try {
        setError(null);
        const response = await api.put(`/menu/items/${id}`, data);
        if (response.data.success) {
          const updatedItem = response.data.data.menuItem;
          setItems((prev) =>
            prev.map((item) => (item.id === id ? updatedItem : item)),
          );
          return updatedItem;
        }
        throw new Error("Failed to update item");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update item";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await api.delete(`/menu/items/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete item";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Toggle item status
  const toggleItemStatus = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const response = await api.put(`/menu/items/${id}/toggle`);
      if (response.data.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isAvailable: !item.isAvailable } : item,
          ),
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to toggle item status";
      setError(errorMessage);
      console.error("Error toggling item status:", error);
    }
  }, []);

  // Reset all categories and items
  const resetAllCategories = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await api.delete("/menu/categories/reset/all");
      // Clear all categories and items from state
      setCategories([]);
      setItems([]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset menu";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update menu name
  const updateMenuName = useCallback(
    async (name: string, nameAr?: string): Promise<void> => {
      try {
        setError(null);
        const response = await api.put("/menu/name", { name, nameAr });
        if (response.data.success) {
          setMenu((prev) => (prev ? { ...prev, name, nameAr } : null));
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update menu name";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Apply discount to all menu items
  const applyDiscountToAll = useCallback(
    async (discount: number): Promise<{ updatedCount: number }> => {
      const response = await api.post("/menu/discount/all", { discount });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Failed to apply discount");
    },
    [],
  );

  // Apply discount to category items
  const applyDiscountToCategory = useCallback(
    async (
      categoryId: string,
      discount: number,
    ): Promise<{ updatedCount: number }> => {
      const response = await api.post(`/menu/discount/category/${categoryId}`, {
        discount,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Failed to apply discount");
    },
    [],
  );

  // QR Code functions
  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/qr");
      if (response.data.success) {
        setQrCodes(response.data.data.qrCodes);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch QR codes");
      console.error("Error fetching QR codes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createQRCode = useCallback(
    async (tableNumber: string): Promise<QRCode> => {
      try {
        setError(null);
        const response = await api.post("/qr/generate", { tableNumber });
        if (response.data.success) {
          const newQRCode = response.data.data.qrCode;
          setQrCodes((prev) => [...prev, newQRCode]);
          return newQRCode;
        }
        throw new Error("Failed to create QR code");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to create QR code";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  const createRestaurantQR =
    useCallback(async (): Promise<RestaurantQRCode> => {
      try {
        setError(null);
        const response = await api.post("/qr/restaurant-code");
        if (response.data.success) {
          const newRestaurantQR = response.data.data.qrCode;
          setRestaurantQR(newRestaurantQR);
          return newRestaurantQR;
        }
        throw new Error("Failed to create restaurant QR code");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to create restaurant QR code";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    }, []);

  const toggleQRStatus = useCallback(async (qrId: string): Promise<void> => {
    try {
      setError(null);
      const response = await api.put(`/qr/${qrId}/toggle`);
      if (response.data.success) {
        setQrCodes((prev) =>
          prev.map((qr) =>
            qr.id === qrId ? { ...qr, isActive: !qr.isActive } : qr,
          ),
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to toggle QR status";
      setError(errorMessage);
      console.error("Error toggling QR status:", error);
    }
  }, []);

  const toggleTableOccupied = useCallback(
    async (qrId: string): Promise<void> => {
      try {
        console.log(`🔄 [Frontend] Toggling table occupied - QR ID: ${qrId}`);
        setError(null);
        const response = await api.put(`/qr/${qrId}/toggle-occupied`);
        console.log(`✅ [Frontend] Toggle response:`, response.data);
        if (response.data.success) {
          const updatedQRCode = response.data.data?.qrCode;
          const newIsOccupied =
            updatedQRCode?.isOccupied ??
            !(qrCodes.find((qr) => qr.id === qrId) as any)?.isOccupied;

          console.log(
            `✅ [Frontend] Updating QR code state - QR ID: ${qrId}, New isOccupied: ${newIsOccupied}`,
          );

          setQrCodes((prev) =>
            prev.map((qr) =>
              qr.id === qrId ? { ...qr, isOccupied: newIsOccupied } : qr,
            ),
          );

          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent("qrCodesUpdated"));
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to toggle table occupied status";
        setError(errorMessage);
        console.error(
          "❌ [Frontend] Error toggling table occupied status:",
          error,
        );
      }
    },
    [qrCodes],
  );

  const deleteQRCode = useCallback(async (qrId: string): Promise<void> => {
    try {
      setError(null);
      await api.delete(`/qr/${qrId}`);
      setQrCodes((prev) => prev.filter((qr) => qr.id !== qrId));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete QR code";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const bulkCreateQRCodes = useCallback(
    async (tableNumbers: string[]): Promise<QRCode[]> => {
      try {
        setError(null);
        const response = await api.post("/qr/bulk-generate", {
          tableNumbers,
        });
        if (response.data.success) {
          const newQRCodes = response.data.data.qrCodes;
          setQrCodes((prev) => [...prev, ...newQRCodes]);
          return newQRCodes;
        }
        throw new Error("Failed to create bulk QR codes");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to create bulk QR codes";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  const bulkCreateSequentialQRCodes = useCallback(
    async (count: number): Promise<QRCode[]> => {
      try {
        setError(null);
        const response = await api.post("/qr/bulk-generate-sequential", {
          count,
        });
        if (response.data.success) {
          const newQRCodes = response.data.data.createdQRCodes;
          // إعادة جلب جميع الأكواد لضمان الترتيب الصحيح
          await fetchQRCodes();
          return newQRCodes;
        }
        throw new Error("Failed to create sequential QR codes");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to create sequential QR codes";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchQRCodes],
  );

  const bulkDeleteQRCodes = useCallback(
    async (qrCodeIds: string[]): Promise<void> => {
      try {
        setError(null);
        const response = await api.delete("/qr/bulk-delete", {
          data: { qrCodeIds },
        });
        if (response.data.success) {
          setQrCodes((prev) => prev.filter((qr) => !qrCodeIds.includes(qr.id)));
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to delete QR codes";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Refresh all data (categories only for better performance)
  const refreshData = useCallback(async () => {
    console.log("🔄 Refreshing data...");
    try {
      await Promise.all([fetchMenu(), fetchCategories()]);
      console.log("✅ Data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    }
    // Items will be loaded separately when needed
  }, [fetchMenu, fetchCategories]);

  // Initial data fetch - only run once on mount
  useEffect(() => {
    // Only fetch data if user is authenticated
    const token = localStorage.getItem("token");
    console.log("🔐 Token check:", token ? "✅ Found" : "❌ Not found");
    if (token) {
      console.log("🚀 Starting initial data fetch...");
      refreshData();
    }
  }, []); // Empty dependency array to run only once

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      if (token) {
        refreshData();
      } else {
        // Clear data when logged out
        setMenu(null);
        setCategories([]);
        setItems([]);
        setRestaurantQR(null);
      }
    };

    // Listen for storage changes (login/logout)
    window.addEventListener("storage", handleAuthChange);

    // Also listen for custom auth events
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, [refreshData]);

  // Excel Import Functions
  const downloadExcelTemplate = async (lang: string): Promise<Blob> => {
    try {
      const response = await api.get(`/excel-import/template?lang=${lang}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const importExcelFile = async (
    file: File,
  ): Promise<{ categoriesCreated: number; itemsCreated: number }> => {
    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const response = await api.post("/excel-import/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh categories and items after successful import
      await fetchCategories();

      return response.data.summary;
    } catch (error: any) {
      throw error;
    }
  };

  const value = {
    // State
    menu,
    categories,
    items,
    qrCodes,
    restaurantQR,
    restaurantCurrency,
    loading,
    loadingItems,
    error,

    // Actions
    fetchMenu,
    fetchCategories,
    fetchItems,
    fetchCategoryItems,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    resetAllCategories,
    createItem,
    updateItem,
    deleteItem,
    toggleItemStatus,
    updateMenuName,
    refreshData,
    applyDiscountToAll,
    applyDiscountToCategory,

    // Excel Import Actions
    downloadExcelTemplate,
    importExcelFile,

    // QR Code Actions
    fetchQRCodes,
    createQRCode,
    createRestaurantQR,
    toggleQRStatus,
    toggleTableOccupied,
    deleteQRCode,
    bulkCreateQRCodes,
    bulkCreateSequentialQRCodes,
    bulkDeleteQRCodes,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
