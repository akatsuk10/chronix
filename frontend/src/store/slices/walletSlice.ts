import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WalletState {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  chainId: string | null
  error: string | null
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  chainId: null,
  error: null
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    setAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload
    },
    setChainId: (state, action: PayloadAction<string | null>) => {
      state.chainId = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    resetWallet: (state) => {
      return initialState
    }
  }
})

export const {
  setConnecting,
  setConnected,
  setAddress,
  setChainId,
  setError,
  resetWallet
} = walletSlice.actions

export default walletSlice.reducer 