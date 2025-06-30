import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: string | null;
  error: string | null;
  isAuthenticated: boolean; // ✅ ← NEW
  vaultBalance: string; // ✅ ← NEW: Add vault balance to state
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  chainId: null,
  error: null,
  isAuthenticated: false, // ✅ ← NEW
  vaultBalance: '0', // ✅ ← NEW: Initialize vault balance
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload;
    },
    setChainId: (state, action: PayloadAction<string | null>) => {
      state.chainId = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setVaultBalance: (state, action: PayloadAction<string>) => {
      state.vaultBalance = action.payload; // ✅ ← NEW: Set vault balance
    },
    resetWallet: () => initialState,
  },
});

export const {
  setConnecting,
  setConnected,
  setAddress,
  setChainId,
  setError,
  setAuthenticated, // ✅ ← export this
  setVaultBalance, // ✅ ← NEW: Export vault balance action
  resetWallet,
} = walletSlice.actions;

export default walletSlice.reducer;
