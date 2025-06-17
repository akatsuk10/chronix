'use client'

import { useAppKitAccount, useWalletInfo } from '@reown/appkit/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getNonce, verifySignature, storeTokens } from '@/lib/auth'

interface WalletSigner {
    signMessage: (params: { message: string; account: string }) => Promise<string>;
}

export const ConnectButton = () => {
    const { address, caipAddress, isConnected, embeddedWalletInfo } = useAppKitAccount();
    const { walletInfo } = useWalletInfo()
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            if (!address || !walletInfo) return;

            try {
                // Get nonce
                const { message } = await getNonce(address);

                // Sign message using Reown's signMessage
                const signature = await (walletInfo as unknown as WalletSigner).signMessage({
                    message,
                    account: address
                });

                // Verify signature and get tokens
                const { accessToken, refreshToken } = await verifySignature(address, signature);

                // Store tokens
                storeTokens(accessToken, refreshToken);

                // Redirect to dashboard or home
                router.push('/dashboard');
            } catch (error) {
                console.error('Authentication failed:', error);
            }
        };

        if (isConnected) {
            handleAuth();
        }
    }, [isConnected, address, walletInfo, router]);

    return (
        <div>
            <appkit-button />
        </div>
    )
}