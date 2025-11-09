// Local storage utilities for categories
import type { Category } from "@/types/recording";
import { DEFAULT_CATEGORIES } from "./constants";

const STORAGE_KEY = "myney_categories";
const SEED_FLAG_KEY = "myney_categories_seed_flag";

// Get all categories from local storage
export const getCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const categories = JSON.parse(data);

    // Convert IDs to strings for backward compatibility and normalize
    const normalizedCategories: Category[] = categories.map((category: Category | { id: string | number; name: string }) => ({
      ...category,
      id: String(category.id),
    }));

    // Remove duplicates by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const uniqueCategories = normalizedCategories.filter((category: Category) => {
      if (seenIds.has(category.id)) {
        console.warn(
          `Duplicate category ID found: ${category.id}, removing duplicate`
        );
        return false;
      }
      seenIds.add(category.id);
      return true;
    });

    // If we found duplicates or needed normalization, save the cleaned version
    if (uniqueCategories.length !== categories.length || 
        categories.some((c: Category | { id: string | number; name: string }) => typeof c.id !== 'string')) {
      saveCategoriesToStorage(uniqueCategories);
    }

    return uniqueCategories;
  } catch (error) {
    console.error("Error loading categories:", error);
    return [];
  }
};

// Save categories array to storage (used by Redux)
export const saveCategoriesToStorage = (categories: Category[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("Error saving categories:", error);
  }
};

// Save a new category
export const saveCategory = (category: Category): void => {
  try {
    const categories = getCategories();
    categories.push(category);
    saveCategoriesToStorage(categories);
  } catch (error) {
    console.error("Error saving category:", error);
  }
};

// Update a category by ID
export const updateCategory = (
  id: string,
  updates: Partial<Category>
): void => {
  try {
    const categories = getCategories();
    const category = categories.find((c) => c.id === id);
    if (category) {
      const updatedCategory = { ...category, ...updates };
      saveCategoriesToStorage(
        categories.map((c) => (c.id === id ? updatedCategory : c))
      );
    }
  } catch (error) {
    console.error("Error updating category:", error);
  }
};

// Delete a category by ID
export const deleteCategory = (id: string): void => {
  try {
    const categories = getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    saveCategoriesToStorage(filtered);
  } catch (error) {
    console.error("Error deleting category:", error);
  }
};

// Generate a new category ID (increments from the highest existing ID)
export const generateCategoryId = (): string => {
  try {
    const categories = getCategories();
    if (categories.length === 0) return "1";
    const numericIds = categories.map((c) => {
      const num = parseInt(c.id, 10);
      return isNaN(num) ? 0 : num;
    });
    const maxId = Math.max(...numericIds);
    return String(maxId + 1);
  } catch (error) {
    console.error("Error generating category ID:", error);
    return String(Date.now()); // Fallback to timestamp if error
  }
};

export const initializeDefaultCategories = (): void => {
  if (localStorage.getItem(SEED_FLAG_KEY)) return;
  try {
    localStorage.setItem(SEED_FLAG_KEY, "true");
    const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(
      (name, index) => ({
        id: String(index + 1),
        name,
      })
    );

    saveCategoriesToStorage(defaultCategories);
    console.log("Default categories initialized");
  } catch (error) {
    console.error("Error initializing default categories:", error);
  }
};
