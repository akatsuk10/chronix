import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient } from "wagmi";
import VaultABI from '@/abis/Vault.json';
import { CONTRACTS } from '@/lib/contract/addresses';
import { setVaultBalance } from '@/store/slices/walletSlice';

export const useVaultBalance = () => {
  const { address, isConnected } = useAppKitAccount();
  const publicClient = usePublicClient();
  const dispatch = useDispatch();
  const vaultBalance = useSelector((state: any) => state.wallet.vaultBalance);

  const getProvider = () => {
    if (!publicClient) return null;
    return new ethers.providers.Web3Provider(publicClient as any);
  };

  const fetchVaultBalance = async () => {
    const provider = getProvider();
    if (!provider || !address) return;
    
    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const bal = await vault.getAVAXBalance(address);
      dispatch(setVaultBalance(ethers.utils.formatEther(bal)));
    } catch (err) {
      console.error('Vault balance error:', err);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchVaultBalance();
    }
  }, [isConnected, address]);

  return {
    vaultBalance,
    fetchVaultBalance,
    isLoading: !isConnected || !address
  };
}; 