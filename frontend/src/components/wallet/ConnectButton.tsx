 'use client'

 import { useAppKitAccount, useWalletInfo } from '@reown/appkit/react'
export const ConnectButton = () => {
    const {address, caipAddress, isConnected, embeddedWalletInfo} = useAppKitAccount();
    const walletInfo = useWalletInfo()

  return (
    <>
    <div >
        <appkit-button />
    </div>
    {isConnected && (
    <div>
        <p>Address: {address}</p>
        <p>Connected Wallet Name : {walletInfo.walletInfo?.name?.toString()}</p>
        <p>Connected Wallet Address : {walletInfo.walletInfo?.address?.toString()}</p>
        <p>Connected Wallet Chain : {walletInfo.walletInfo?.chain?.toString()}</p>
    </div>
    )}
    </>
  )
}