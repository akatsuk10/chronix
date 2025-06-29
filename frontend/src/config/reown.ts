import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { avalancheFuji } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { createConfig, http } from 'wagmi'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [avalancheFuji] as [AppKitNetwork, ...AppKitNetwork[]]

const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
})

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true
})

export const config = wagmiAdapter.wagmiConfig