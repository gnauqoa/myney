import { configureStore } from "@reduxjs/toolkit";
import recordingsReducer from "./slices/recordings";
import categoriesReducer from "./slices/categories";
import walletsReducer from "./slices/wallet";

export const store = configureStore({
  reducer: {
    recordings: recordingsReducer,
    categories: categoriesReducer,
    wallets: walletsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const selectRecordings = (state: RootState) => state.recordings;
export const selectCategories = (state: RootState) => state.categories;
export const selectWallets = (state: RootState) => state.wallets;
