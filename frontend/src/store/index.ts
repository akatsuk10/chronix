import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import walletReducer from './slices/walletSlice'
import userReducer from './slices/userSlice'

// Example: import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    user: userReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
