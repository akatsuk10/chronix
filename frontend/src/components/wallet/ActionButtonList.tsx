'use client'
import { useDisconnect, useAppKit, useAppKitNetwork  } from '@reown/appkit/react'
import { networks } from '@/config/reown'

export const ActionButtonList = () => {
    const { disconnect } = useDisconnect();
    const { switchNetwork } = useAppKitNetwork();

    const handleDisconnect = async () => {
      try {
        await disconnect();
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }
  return (
    <div className='flex flex-row gap-4'>
        <button className='bg-red-500 text-white p-2 rounded-md' onClick={handleDisconnect}>Disconnect</button>
        <button className='bg-green-500 text-white p-2 rounded-md' onClick={() => switchNetwork(networks[1]) }>Switch</button>
    </div>
  )
}