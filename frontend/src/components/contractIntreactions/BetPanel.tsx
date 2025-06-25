"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CONTRACTS } from "@/lib/contract/addresses";
import bettingABI from "../../../../smartcontract/artifacts/contracts/VaultBetting.sol/BTCBetting.json";
import { ethers } from "ethers";
import { RootState } from "@/store";
import { TrendingUp, TrendingDown, Coins, AlertCircle } from "lucide-react";

export default function BetPanel() {
  const { address } = useSelector((state: RootState) => state.wallet);
  const [position, setPosition] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(false);
  const [betAmount, setBetAmount] = useState("0.1");
  const [vaultBalance, setVaultBalance] = useState<string>("0");

  const fetchVaultBalance = async () => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(CONTRACTS.vaultBetting, bettingABI.abi, provider);
      const balance = await contract.getAVAXBalance(address);
      setVaultBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error("Vault balance error:", err);
    }
  };

  useEffect(() => {
    fetchVaultBalance();
  }, [address]);

  const placeBet = async () => {
    if (!address) {
      alert("Please connect your wallet first!");
      return;
    }

    if (Number(betAmount) <= 0) {
      alert("Bet amount must be greater than 0");
      return;
    }

    if (Number(betAmount) > Number(vaultBalance)) {
      alert("Insufficient balance in Vault. Please deposit first.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.vaultBetting, bettingABI.abi, signer);

      const tx = await contract.placeBetFromVault(
        ethers.utils.parseEther(betAmount),
        position
      );
      await tx.wait();

      alert("Bet placed successfully from Vault!");
      fetchVaultBalance();
    } catch (error) {
      console.error("Bet error:", error);
      alert(
        `Failed: ${error instanceof Error ? error.message : "Transaction failed"}`
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">BTC Price Betting</h3>
          <p className="text-sm text-gray-600">
            Predict BTC price movement using your Vault funds
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Vault Balance */}
        <div className="text-sm text-gray-700">
          <span className="font-medium">Vault Balance:</span>{" "}
          <span className="text-indigo-600 font-semibold">
            {vaultBalance} AVAX
          </span>
        </div>

        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPosition(0)}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                position === 0
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Long</span>
            </button>
            <button
              onClick={() => setPosition(1)}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                position === 1
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-red-300"
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">Short</span>
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (AVAX)
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.1"
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            You are placing a bet using your Vault balance. Make sure you’ve deposited enough AVAX.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={placeBet}
          disabled={loading || !address}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            loading || !address
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Placing Bet...
            </div>
          ) : !address ? (
            "Connect Wallet to Bet"
          ) : (
            `Place ${betAmount} AVAX Bet`
          )}
        </button>
      </div>
    </div>
  );
}
