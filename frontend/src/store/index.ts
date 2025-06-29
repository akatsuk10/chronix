import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import walletReducer from './slices/walletSlice';
import userReducer from './slices/userSlice';
//import vaultReducer from './slices/vaultSlice'

export const store = configureStore({
  reducer: {
    wallet: walletReducer, // ✅ Has isConnected, isAuthenticated, address, etc.
    user: userReducer,   
//    vault: vaultReducer,  // ✅ User-related details if needed
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ Use these in components for type-safe dispatch/select
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
