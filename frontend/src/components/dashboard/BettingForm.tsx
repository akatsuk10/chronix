'use client';

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient } from "wagmi";
import VaultABI from '@/abis/Vault.json';
import BTCBettingABI from '@/abis/BTCBetting.json';
import { CONTRACTS } from '@/lib/contract/addresses';
import { useSelector } from "react-redux";

const BET_TIMEOUT = 300;
const BTC_USD_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";

export const BettingForm = () => {
  const { address, isConnected } = useAppKitAccount();
  const publicClient = usePublicClient();
  const wallet = useSelector((state: any) => state.wallet);
  const [vaultBalance, setVaultBalance] = useState<string>('0');
  const [poolBalance, setPoolBalance] = useState<string>('0');
  const [isLoadingLong, setIsLoadingLong] = useState(false);
  const [isLoadingShort, setIsLoadingShort] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [betSuccess, setBetSuccess] = useState(false);
  const [btcPrice, setBTCPrice] = useState<string>("...");
  const [betAmount, setBetAmount] = useState(0.5);
  const [activeBet, setActiveBet] = useState<any>(null);
  const [activeBetTimeLeft, setActiveBetTimeLeft] = useState<number | null>(null);
  const quickAmounts = [0.1, 0.5, 1];

  // Create provider from public client
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
      setVaultBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error('Vault balance error:', err);
    }
  };

  const fetchBTCPrice = async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const priceFeed = new ethers.Contract(
        BTC_USD_FEED,
        ["function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"],
        provider
      );
      const [, price] = await priceFeed.latestRoundData();
      setBTCPrice(parseFloat(ethers.utils.formatUnits(price, 8)).toFixed(2));
    } catch (err) {
      console.error("BTC price fetch error:", err);
    }
  };

  const fetchActiveBet = async () => {
    try {
      const provider = getProvider();
      if (!provider || !address) return;
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const bet = await betting.getBet(address);

      if (bet.settled) {
        setActiveBet(null);
        setActiveBetTimeLeft(null);
        return;
      }
      setActiveBet(bet);
    } catch (err: any) {
      console.error('Fetch active bet error:', err);
      setActiveBet(null);
    }
  };

  useEffect(() => {
    if (address && publicClient) {
      fetchVaultBalance();
      fetchBTCPrice();
      fetchActiveBet();
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const checkUserVaultBalance = async () => {
    try {
      const provider = getProvider();
      if (!provider || !address) return ethers.BigNumber.from(0);
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      return await vault.getAVAXBalance(address);
    } catch {
      return ethers.BigNumber.from(0);
    }
  };

  const checkUserActiveBet = async () => {
    try {
      const provider = getProvider();
      if (!provider || !address) return null;
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const bet = await betting.getBet(address);
      return bet;
    } catch {
      return null;
    }
  };

  const checkPoolBalance = async () => {
    try {
      const provider = getProvider();
      if (!provider) return ethers.BigNumber.from(0);
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const balance = await betting.poolBalance();
      setPoolBalance(ethers.utils.formatEther(balance));
      return balance;
    } catch {
      return ethers.BigNumber.from(0);
    }
  };

  const placeBet = async (position: number) => {
    if (timeLeft > 0) {
      setError('Please wait for the current round to end');
      return;
    }

    if (!isConnected || !address || !betAmount || betAmount <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount.toString()) > parseFloat(vaultBalance)) {
      setError('Insufficient vault balance');
      return;
    }

    setError('');
    setBetSuccess(false);

    // Set loading state based on position
    if (position === 0) setIsLoadingLong(true);
    else setIsLoadingShort(true);

    try {
      const userVaultBalance = await checkUserVaultBalance();
      const betAmountWei = ethers.utils.parseEther(betAmount.toString());

      if (userVaultBalance.lt(betAmountWei)) {
        setError(`Insufficient vault balance`);
        return;
      }

      const active = await checkUserActiveBet();
      if (
        active && !active.settled
      ) {
          setError(`You already have an active bet.`);
          return;
        }
      

      const poolBal = await checkPoolBalance();
      if (poolBal.lt(betAmountWei)) {
        setError(`Pool has insufficient liquidity.`);
        return;
      }

      // Get signer from window.ethereum for transactions
      if (!window.ethereum) {
        setError('No wallet provider found');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, signer);
      const tx = await betting.placeBetFor(address, position, betAmountWei, { gasLimit: 500000 });
      await tx.wait();

      setBetAmount(0.5);
      setTimeLeft(BET_TIMEOUT);
      setBetSuccess(true);
      await fetchVaultBalance();
      await fetchActiveBet();
    } catch (err: any) {
      console.error("Bet error:", err);
      setError(err?.message || 'Failed to place bet');
    } finally {
      setIsLoadingLong(false);
      setIsLoadingShort(false);
    }
  };

  useEffect(() => {
    if (!activeBet?.startTime) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const start = Number(activeBet.startTime);
      const remaining = start + BET_TIMEOUT - now;

      if (remaining <= 0) {
        clearInterval(interval);
        setActiveBetTimeLeft(null);
        fetchActiveBet();
        setActiveBet(null);
      } else {
        setActiveBetTimeLeft(Math.max(0, remaining));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBet]);

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
        <div className="bg-red-700 text-white px-3 py-2 text-sm rounded mb-3">{error}</div>
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
          className={`px-4 py-3 rounded font-medium ${isLoadingLong ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
          onClick={() => placeBet(0)}
          disabled={isLoadingLong || isLoadingShort}
        >
          {isLoadingLong ? 'Processing...' : 'Long'}
        </button>
        <button
          type="button"
          className={`px-4 py-3 rounded font-medium ${isLoadingShort ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
          onClick={() => placeBet(1)}
          disabled={isLoadingShort || isLoadingLong}
        >
          {isLoadingShort ? 'Processing...' : 'Short'}
        </button>
      </div>

      {/* Vault Balance */}
      <div className="mt-6 text-right text-sm text-gray-400">
        Vault Balance: {parseFloat(vaultBalance).toFixed(4)} AVAX
      </div>

      {/* Active Bet */}
      {activeBet && (
        <div className="mt-6 bg-stone-900 border border-stone-800 rounded-lg p-4 text-white">
          <div className="text-md text-gray-400 mb-2">Active Bet</div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-base font-semibold">Amount: <span className="font-light">{ethers.utils.formatEther(activeBet.amount)} AVAX</span></div>
              <div className="text-base text-gray-500">
                Position: <span className={`font-semibold ${activeBet.position === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {activeBet.position === 0 ? 'Long' : 'Short'}
                </span>
              </div>
              <div>
              <div className="text-base text-gray-500">
                Start Price: {activeBet.startPrice ? `$${(Number(activeBet.startPrice) / 1e18).toFixed(2)}` : '-'}
              </div>
              <span className="">
                Remaining Time : {activeBetTimeLeft !== null ? `${activeBetTimeLeft}s` : '-'}
              </span>
            </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
