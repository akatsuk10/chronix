"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { ethers } from "ethers";
import { CONTRACTS } from "@/lib/contract/addresses";
import VaultABI from "@/abis/Vault.json";
import { X } from "lucide-react";

export function VaultModal({
  isOpen,
  onClose,
  signer,
}: {
  isOpen: boolean;
  onClose: () => void;
  signer: ethers.Signer | null;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");

  const handleAction = async () => {
    if (!signer || parseFloat(amount) <= 0) return;
    const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, signer);

    try {
      setLoading(true);
      const parsedAmount = ethers.utils.parseEther(amount);

      const tx =
        action === "deposit"
          ? await vault.depositAVAX({ value: parsedAmount })
          : await vault.withdrawAVAX(parsedAmount);

      await tx.wait();
      onClose();
    } catch (err) {
      console.error("Vault action error:", err);
    } finally {
      setLoading(false);
      setAmount("");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative z-50 bg-[#1c1c1c] border border-stone-700 w-[360px] rounded-xl p-6 text-white shadow-xl">
        <button
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <Dialog.Title className="text-xl font-semibold text-center mb-6">
          {action === "deposit" ? "Deposit to Vault" : "Withdraw from Vault"}
        </Dialog.Title>

        {/* Action Switcher */}
        <div className="flex gap-2 mb-5">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              action === "deposit"
                ? "bg-green-500 text-black"
                : "bg-stone-800 text-white hover:bg-stone-700"
            }`}
            onClick={() => setAction("deposit")}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              action === "withdraw"
                ? "bg-red-500 text-black"
                : "bg-stone-800 text-white hover:bg-stone-700"
            }`}
            onClick={() => setAction("withdraw")}
          >
            Withdraw
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-5">
          <label className="block text-sm mb-2 text-stone-300">Amount (AVAX)</label>
          <input
            className="w-full p-3 bg-stone-900 text-white rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            type="number"
            placeholder="e.g. 1.25"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleAction}
          className="w-full py-3 rounded-lg font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-black transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing..." : action === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      </div>
    </Dialog>
  );
}
