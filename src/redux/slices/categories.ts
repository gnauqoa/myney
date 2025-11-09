import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Category } from "@/types/recording";
import {
  getCategories,
  saveCategory,
  updateCategory as updateCategoryStorage,
  deleteCategory as deleteCategoryStorage,
  generateCategoryId,
  initializeDefaultCategories,
} from "@/lib/category-storage";
import mapKeys from "lodash/mapKeys";

initializeDefaultCategories();

interface CategoriesState {
  categories: Category[];
  mappedCategoriesByName: Record<string, Category>;
  mappedCategoriesById: Record<string, Category>;
  categoryNames: string[];
}

const storageCategories = getCategories();
const initialState: CategoriesState = {
  categories: storageCategories,
  mappedCategoriesByName: mapKeys(storageCategories, "name"),
  mappedCategoriesById: mapKeys(storageCategories, "id"),
  categoryNames: storageCategories.map((c) => c.name),
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<{ name: string }>) => {
      const newCategory: Category = {
        id: generateCategoryId(),
        name: action.payload.name,
      };
      state.categories.push(newCategory);
      state.mappedCategoriesByName[newCategory.name] = newCategory;
      state.mappedCategoriesById[newCategory.id] = newCategory;
      state.categoryNames.push(newCategory.name);
      saveCategory(newCategory);
    },
    updateCategory: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Category> }>
    ) => {
      const index = state.categories.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = {
          ...state.categories[index],
          ...action.payload.updates,
        };
        state.mappedCategoriesByName[state.categories[index].name] =
          state.categories[index];
        state.mappedCategoriesById[state.categories[index].id] =
          state.categories[index];
        updateCategoryStorage(action.payload.id, action.payload.updates);
        state.categoryNames = state.categories.map((c) => c.name);
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (c) => c.id !== action.payload
      );
      deleteCategoryStorage(action.payload);
      delete state.mappedCategoriesByName[
        state.categories.find((c) => c.id === action.payload)?.name || ""
      ];
      delete state.mappedCategoriesById[
        state.categories.find((c) => c.id === action.payload)?.id || ""
      ];
      state.categoryNames = state.categories.map((c) => c.name);
    },
    loadCategories: (state) => {
      state.categories = getCategories();
      state.mappedCategoriesByName = mapKeys(state.categories, "name");
      state.mappedCategoriesById = mapKeys(state.categories, "id");
      state.categoryNames = state.categories.map((c) => c.name);
    },
  },
});

export const { addCategory, updateCategory, deleteCategory, loadCategories } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
