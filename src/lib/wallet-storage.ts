// Local storage utilities for wallets
import type { Wallet } from "@/types/wallet";
import { SEED_FLAG_KEY, STORAGE_WALLETS_KEY } from "./constants";

// Get all wallets from local storage
export const getWallets = (): Wallet[] => {
  try {
    const data = localStorage.getItem(STORAGE_WALLETS_KEY);
    if (!data) return [];
    const wallets = JSON.parse(data);

    // Convert IDs to strings for backward compatibility
    const normalizedWallets: Wallet[] = wallets.map(
      (wallet: Wallet | { id: string | number; name: string }) => ({
        ...wallet,
        id: String(wallet.id),
      })
    );

    // Remove duplicates by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const uniqueWallets = normalizedWallets.filter((wallet: Wallet) => {
      if (seenIds.has(wallet.id)) {
        console.warn(
          `Duplicate wallet ID found: ${wallet.id}, removing duplicate`
        );
        return false;
      }
      seenIds.add(wallet.id);
      return true;
    });

    // If we found duplicates or needed normalization, save the cleaned version
    if (
      uniqueWallets.length !== wallets.length ||
      wallets.some(
        (w: Wallet | { id: string | number; name: string }) =>
          typeof w.id !== "string"
      )
    ) {
      saveWalletsToStorage(uniqueWallets);
    }

    return uniqueWallets;
  } catch (error) {
    console.error("Error loading wallets:", error);
    return [];
  }
};

// Save wallets array to storage (used by Redux)
export const saveWalletsToStorage = (wallets: Wallet[]): void => {
  try {
    localStorage.setItem(STORAGE_WALLETS_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error("Error saving wallets:", error);
  }
};

// Save a new wallet
export const saveWallet = (wallet: Wallet): void => {
  try {
    const wallets = getWallets();
    wallets.push(wallet);
    saveWalletsToStorage(wallets);
  } catch (error) {
    console.error("Error saving wallet:", error);
  }
};

// Update a wallet by ID
export const updateWallet = (id: string, updates: Partial<Wallet>): void => {
  try {
    const wallets = getWallets();
    const wallet = wallets.find((w) => w.id === id);
    if (wallet) {
      const updatedWallet = { ...wallet, ...updates };
      saveWalletsToStorage(
        wallets.map((w) => (w.id === id ? updatedWallet : w))
      );
    }
  } catch (error) {
    console.error("Error updating wallet:", error);
  }
};

// Delete a wallet by ID
export const deleteWallet = (id: string): void => {
  try {
    const wallets = getWallets();
    const filtered = wallets.filter((w) => w.id !== id);
    saveWalletsToStorage(filtered);
  } catch (error) {
    console.error("Error deleting wallet:", error);
  }
};

// Generate a new wallet ID (increments from the highest existing ID)
export const generateWalletId = (): string => {
  try {
    const wallets = getWallets();
    if (wallets.length === 0) return "1";
    const numericIds = wallets.map((w) => {
      const num = parseInt(w.id, 10);
      return isNaN(num) ? 0 : num;
    });
    const maxId = Math.max(...numericIds);
    return String(maxId + 1);
  } catch (error) {
    console.error("Error generating wallet ID:", error);
    return String(Date.now()); // Fallback to timestamp if error
  }
};

export const initializeDefaultWallet = (): void => {
  if (localStorage.getItem(SEED_FLAG_KEY)) return;
  try {
    localStorage.setItem(SEED_FLAG_KEY, "true");
    const defaultWallet: Wallet = {
      id: "1",
      name: "Cash",
    };

    saveWalletsToStorage([defaultWallet]);
    console.log("Default wallet initialized");
  } catch (error) {
    console.error("Error initializing default wallet:", error);
  }
};
