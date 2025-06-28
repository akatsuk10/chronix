"use client";

import { Input } from "./ui/input";
import Link from "next/link";
import { ConnectButton } from "./wallet/ConnectButton";
import NeumorphWrapper from "./ui/nuemorph-wrapper";
import { VaultModal } from "./VaultModal";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ethers } from "ethers";
import VaultABI from "@/abis/Vault.json";
import { CONTRACTS } from "@/lib/contract/addresses";

export function SiteHeader() {
  const wallet = useSelector((state: RootState) => state.wallet);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [vaultOpen, setVaultOpen] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const fetchVaultBalance = async () => {
      if (!wallet.address || typeof window === "undefined" || !window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setSigner(signer);

      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const balance = await vault.getAVAXBalance(wallet.address);
      setVaultBalance(ethers.utils.formatEther(balance));
    };

    fetchVaultBalance();
  }, [wallet.address, vaultOpen]); // refetch on modal close

  return (
    <header className="flex bg-[#1c1c1c] h-[70px] shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 text-white">
        {/* Logo */}
        <NeumorphWrapper className="w-10 h-10 relative rounded-lg [box-shadow:0_0_10px_-1px_#00000040] border border-black/50 after:absolute after:content-[''] after:inset-0 after:rounded-lg after:border-t-2 after:border-r-2 after:border-[#2A2A2A] after:pointer-events-none bg-[#1c1c1c]">
          <img src="/chronix.png" alt="Chronix Logo" />
        </NeumorphWrapper>

        <h1 className="text-lg font-medium tracking-tight">Chronix</h1>

        <div className="ml-10 flex items-center gap-8 text-sm">
          <Link href="/dashboard" className="hover:text-[#44FDB3] transition-colors">Dashboard</Link>
          <Link href="/carbon-credits" className="hover:text-[#44FDB3] transition-colors">Carbon Credit</Link>
          <Link href="/lottery" className="hover:text-[#44FDB3] transition-colors">Lottery</Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center text-white text-sm bg-stone-900 px-3 py-2 rounded-full border border-stone-700">
              {parseFloat(vaultBalance).toFixed(3)} AVAX
              <button
                onClick={() => setVaultOpen(true)}
                className="ml-2 w-6 h-6 rounded-full bg-[#44FDB3] text-black font-bold text-sm leading-none flex items-center justify-center"
              >
                +
              </button>
            </div>

          {/* Connect */}
          <div className="bg-[#44FDB3] rounded-full">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Vault Modal */}
      <VaultModal isOpen={vaultOpen} onClose={() => setVaultOpen(false)} signer={signer} />
    </header>
  );
}
