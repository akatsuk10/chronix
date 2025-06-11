'use client'

import { useAppKitAccount, useWalletInfo } from '@reown/appkit/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const ConnectButton = () => {
    const {address, caipAddress, isConnected, embeddedWalletInfo} = useAppKitAccount();
    const walletInfo = useWalletInfo()
    const router = useRouter()

    useEffect(() => {
        if (isConnected) {
            router.push('/userform')
        }
    }, [isConnected, router])

    return (
        <div>
            <appkit-button />
        </div>
    )
}