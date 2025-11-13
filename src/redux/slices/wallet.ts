import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getWallets,
  saveWallet as saveToStorage,
  saveWalletsToStorage,
  deleteWallet as deleteFromStorage,
  initializeDefaultWallet,
} from "@/lib/wallet-storage";
import type { Wallet } from "@/types/wallet";

initializeDefaultWallet();

interface WalletsState {
  wallets: Wallet[];
}

const initialState: WalletsState = {
  wallets: getWallets(),
};

const walletsSlice = createSlice({
  name: "wallets",
  initialState,
  reducers: {
    addWallet: (state, action: PayloadAction<Wallet>) => {
      state.wallets.push(action.payload);
      saveToStorage(action.payload);
    },

    removeWallet: (state, action: PayloadAction<string>) => {
      state.wallets = state.wallets.filter((w) => w.id !== action.payload);
      deleteFromStorage(action.payload);
    },

    updateWallet: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Wallet> }>
    ) => {
      const index = state.wallets.findIndex(
        (w) => w.id === action.payload.id
      );
      if (index !== -1) {
        state.wallets[index] = {
          ...state.wallets[index],
          ...action.payload.updates,
        };
        saveWalletsToStorage(state.wallets);
      }
    },

    loadWallets: (state) => {
      state.wallets = getWallets();
    },

    clearWallets: (state) => {
      state.wallets = [];
      saveWalletsToStorage([]);
    },
  },
});

export const {
  addWallet,
  removeWallet,
  updateWallet,
  loadWallets,
  clearWallets,
} = walletsSlice.actions;

export default walletsSlice.reducer;

