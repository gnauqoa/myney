import { configureStore } from "@reduxjs/toolkit";
import recordingsReducer from "./slices/recordings";
import categoriesReducer from "./slices/categories";

export const store = configureStore({
  reducer: {
    recordings: recordingsReducer,
    categories: categoriesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const selectRecordings = (state: RootState) => state.recordings;
export const selectCategories = (state: RootState) => state.categories;
