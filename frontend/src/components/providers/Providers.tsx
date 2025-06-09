"use client"

import { Provider } from "react-redux"
import { store } from "@/store"
import ReownAppKitProvider from "@/providers/AppkitProvider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ReownAppKitProvider>
          {children}
        </ReownAppKitProvider>
      </Provider>
    </QueryClientProvider>
  )
} 