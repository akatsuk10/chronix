'use client';

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import VaultABI from '@/abis/Vault.json';
import { CONTRACTS } from '@/lib/contract/addresses';
import { useSelector } from "react-redux";

const BET_TIMEOUT = 300;
const BTC_USD_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";

export const BettingForm = () => {
  const wallet = useSelector((state: any) => state.wallet);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [betSuccess, setBetSuccess] = useState(false);
  const [btcPrice, setBTCPrice] = useState<string>("...");
  const [betAmount, setBetAmount] = useState(0.5);
  const quickAmounts = [0.1, 0.5, 1];

  // Setup provider and signer
  useEffect(() => {
    const setup = async () => {
      if (window.ethereum) {
        const p = new ethers.providers.Web3Provider(window.ethereum);
        await p.send("eth_requestAccounts", []);
        setProvider(p);
        setSigner(p.getSigner());
      }
    };
    setup();
  }, []);

  // Fetch vault balance
  const fetchVaultBalance = async () => {
    if (!provider || !wallet.address) return;
    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const bal = await vault.getAVAXBalance(wallet.address);
      setVaultBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error('Vault balance error:', err);
    }
  };

  // Fetch BTC price
  const fetchBTCPrice = async () => {
    if (!provider) return;
    try {
      const priceFeed = new ethers.Contract(
        BTC_USD_FEED,
        ["function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"],
        provider
      );
      const [, price] = await priceFeed.latestRoundData();
      const formatted = parseFloat(ethers.utils.formatUnits(price, 8)).toFixed(2);
      setBTCPrice(formatted);
    } catch (err) {
      console.error("BTC price fetch error:", err);
    }
  };

  // Fetch on load and wallet changes
  useEffect(() => {
    if (wallet.address && provider) {
      fetchVaultBalance();
      fetchBTCPrice();
    }
  }, [wallet.address, provider]);

  // Handle cooldown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Place bet
  const placeBet = async (position: number) => {
    if (timeLeft > 0) {
      setError('Wait for current round to end');
      return;
    }

    if (!signer || !betAmount || betAmount <= 0) {
      setError('Invalid bet amount');
      return;
    }

    if (betAmount > parseFloat(vaultBalance)) {
      setError('Insufficient vault balance');
      return;
    }

    setIsLoading(true);
    setError('');
    setBetSuccess(false);

    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, signer);
      const tx = await vault.placeBetFromVault(
        ethers.utils.parseEther(betAmount.toString()),
        position,
        { gasLimit: 500000 }
      );
      await tx.wait();
      setBetAmount(0.5);
      setTimeLeft(BET_TIMEOUT);
      setBetSuccess(true);
      fetchVaultBalance();
    } catch (err: any) {
      console.error('Bet error:', err);
      setError(err.reason || err.message || 'Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      {/* BTC Price */}
      <div className="bg-[#1c1c1c] border border-stone-800 rounded-lg p-4 mb-4">
        <div className="text-xs text-gray-400 mb-1">BTC / USDT</div>
        <div className="border-b border-stone-700 mb-2" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Current Price</div>
            <div className="text-lg font-semibold text-white">${btcPrice}</div>
          </div>
          <div className="text-white text-base font-medium">5m Interval</div>
        </div>
      </div>

      {/* Quick Amounts */}
      <div className="mb-4">
        <div className="flex gap-3 mb-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              type="button"
              className={`px-4 py-1 rounded-full text-white border border-stone-800 transition-colors ${betAmount === amount ? 'bg-stone-800 border-stone-600' : ''}`}
              onClick={() => setBetAmount(amount)}
            >
              {amount} AVAX
            </button>
          ))}
          <button
            type="button"
            className="px-4 py-1 rounded-full text-white border border-stone-800"
            onClick={() => setBetAmount(parseFloat(vaultBalance))}
          >
            Max
          </button>
        </div>

        <input
          type="number"
          step="0.01"
          min="0"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          placeholder="Enter custom amount in AVAX"
          className="w-full px-3 py-2 bg-stone-900 text-white border border-stone-700 rounded-md outline-none"
        />
      </div>

      {/* Summary */}
      <div className="mb-6">
        <div className="bg-stone-950/40 rounded-lg px-4 py-3 flex items-center justify-between border border-stone-800">
          <span className="text-gray-400 text-sm">Bet amount</span>
          <span className="text-white text-lg font-semibold">{betAmount.toFixed(2)} AVAX</span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-700 text-white px-3 py-2 text-sm rounded mb-3">
          {error}
        </div>
      )}
      {timeLeft > 0 && (
        <div className="text-center text-yellow-400 mb-3 text-sm">
          Waiting for round: {timeLeft}s
        </div>
      )}
      {betSuccess && (
        <div className="bg-green-700 text-white px-3 py-2 text-sm rounded mb-3">
          Bet placed successfully!
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={`px-4 py-3 rounded font-medium ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
          onClick={() => placeBet(0)}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Long'}
        </button>
        <button
          type="button"
          className={`px-4 py-3 rounded font-medium ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
          onClick={() => placeBet(1)}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Short'}
        </button>
      </div>

      {/* Vault Balance */}
      <div className="mt-6 text-right text-sm text-gray-400">
        Vault Balance: {parseFloat(vaultBalance).toFixed(4)} AVAX
      </div>
    </div>
  );
};
