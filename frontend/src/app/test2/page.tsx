'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import VaultABI from '@/abis/Vault.json';
import CarbonABI from '@/abis/CarbonCredit.json';
import LotteryABI from '@/abis/Lottery.json';
import BTCBettingABI from '@/abis/BTCBetting.json';
import { CONTRACTS } from "@/lib/contract/addresses";
import { setAddress, setConnected } from '@/store/slices/walletSlice';

const BET_TIMEOUT = 300;

export default function Dashboard() {
  const wallet = useSelector((state: any) => state.wallet);
  const dispatch = useDispatch();
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [vaultDepositAmount, setVaultDepositAmount] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [vaultBalance, setVaultBalance] = useState('0');
  const [carbonBalance, setCarbonBalance] = useState('0');
  const [lotteryPool, setLotteryPool] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [activeBet, setActiveBet] = useState<any>(null);
  const [bettingVaultAddress, setBettingVaultAddress] = useState<string>('');
  const [vaultBettingContract, setVaultBettingContract] = useState<string>('');
  const [poolBalance, setPoolBalance] = useState<string>('0');
  const [userActiveBet, setUserActiveBet] = useState<any>(null);
  const [vaultWithdrawAmount, setVaultWithdrawAmount] = useState('');

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          // Use the correct ethers.js syntax for v5
          const p = new ethers.providers.Web3Provider(window.ethereum);
          await p.send("eth_requestAccounts", []);  // prompts wallet connect
          setProvider(p);
          setSigner(p.getSigner());
          
          // Get the connected address
          const accounts = await p.listAccounts();
          if (accounts.length > 0) {
            const address = accounts[0];
            setConnectedAddress(address);
            setDebugInfo(`Connected: ${address}`);
            
            // Update Redux state
            dispatch(setAddress(address));
            dispatch(setConnected(true));
          }
        } catch (err) {
          console.error('Failed to connect wallet:', err);
          setError('Failed to connect wallet');
        }
      }
    };
    initProvider();
  }, [dispatch]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const fetchBalances = async () => {
    console.log('Fetching balances...');
    console.log('Wallet address:', wallet.address);
    console.log('Connected address:', connectedAddress);
    console.log('Provider:', provider);
    console.log('Contract address:', CONTRACTS.vault);
    
    // Use connected address as fallback if Redux wallet address is not set
    const addressToUse = wallet.address || connectedAddress;
    
    if (!addressToUse || !provider) {
      console.log('Missing wallet address or provider');
      setDebugInfo(`Wallet: ${addressToUse}, Provider: ${!!provider}`);
      return;
    }
    
    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const carbon = new ethers.Contract(CONTRACTS.carbonCredit, CarbonABI.abi, provider);
      const lottery = new ethers.Contract(CONTRACTS.lottery, LotteryABI.abi, provider);

      console.log('Contracts created, fetching balances for address:', addressToUse);

      const [vaultBal, carbonBal, lotteryBal] = await Promise.all([
        vault.getAVAXBalance(addressToUse),
        carbon.getUserHolding(addressToUse),
        provider.getBalance(CONTRACTS.lottery)
      ]);

      console.log('Raw balances:', { vaultBal: vaultBal.toString(), carbonBal: carbonBal.toString(), lotteryBal: lotteryBal.toString() });

      const formattedVaultBalance = ethers.utils.formatEther(vaultBal);
      const formattedCarbonBalance = ethers.utils.formatUnits(carbonBal, 18);
      const formattedLotteryBalance = ethers.utils.formatEther(lotteryBal);

      console.log('Formatted balances:', { formattedVaultBalance, formattedCarbonBalance, formattedLotteryBalance });

      setVaultBalance(formattedVaultBalance);
      setCarbonBalance(formattedCarbonBalance);
      setLotteryPool(formattedLotteryBalance);
      
      setDebugInfo(`Balances updated - Vault: ${formattedVaultBalance} AVAX`);
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch balances');
      setDebugInfo(`Error: ${err.message}`);
    }
  };

  const depositToVault = async () => {
    if (!signer || !vaultDepositAmount || parseFloat(vaultDepositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, signer);
      const tx = await vault.depositAVAX({ value: ethers.utils.parseEther(vaultDepositAmount) });
      await tx.wait();
      setVaultDepositAmount('');
      await fetchBalances();
      alert('Successfully deposited to vault!');
    } catch (err: any) {
      setError(err.message || 'Failed to deposit to vault');
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFromVault = async () => {
    if (!signer || !vaultWithdrawAmount || parseFloat(vaultWithdrawAmount) <= 0) {
      setError('Please enter a valid amount to withdraw');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, signer);
      const tx = await vault.withdrawAVAX(ethers.utils.parseEther(vaultWithdrawAmount));
      await tx.wait();
      setVaultWithdrawAmount('');
      await fetchBalances();
      alert('Successfully withdrew from vault!');
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw from vault');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveBet = async () => {
    try {
      if (!provider || !(wallet.address || connectedAddress)) {
        setError('Wallet not connected');
        return;
      }
      const addressToUse = wallet.address || connectedAddress;
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const bet = await betting.getBet(addressToUse);
      setActiveBet(bet);
    } catch (err: any) {
      console.error('Error fetching active bet:', err);
      setError(err.message || 'Failed to fetch active bet');
      setActiveBet(null);
    }
  };

  const checkBettingVaultAddress = async () => {
    try {
      if (!provider) {
        setError('Provider not connected');
        return;
      }
      
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const vaultAddress = await betting.vault();
      setBettingVaultAddress(vaultAddress);
      
      const isSameVault = vaultAddress.toLowerCase() === CONTRACTS.vault.toLowerCase();
      setDebugInfo(`Betting contract vault: ${vaultAddress}, Our vault: ${CONTRACTS.vault}, Match: ${isSameVault ? 'YES' : 'NO'}`);
    } catch (err: any) {
      console.error('Error fetching betting vault address:', err);
      setError(err.message || 'Failed to fetch betting vault address');
      setBettingVaultAddress('');
    }
  };

  const checkVaultConfiguration = async () => {
    try {
      if (!provider) {
        setError('Provider not connected');
        return;
      }
      
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const bettingContractAddress = await vault.bettingContract();
      setVaultBettingContract(bettingContractAddress);
      
      const isCorrectBettingContract = bettingContractAddress.toLowerCase() === CONTRACTS.betting.toLowerCase();
      setDebugInfo(`Vault betting contract: ${bettingContractAddress}, Expected: ${CONTRACTS.betting}, Match: ${isCorrectBettingContract ? 'YES' : 'NO'}`);
    } catch (err: any) {
      console.error('Error checking vault configuration:', err);
      setError(err.message || 'Failed to check vault configuration');
      setVaultBettingContract('');
    }
  };

  const checkUserVaultBalance = async () => {
    try {
      if (!provider || !(wallet.address || connectedAddress)) {
        setError('Wallet not connected');
        return;
      }
      
      const addressToUse = wallet.address || connectedAddress;
      const vault = new ethers.Contract(CONTRACTS.vault, VaultABI.abi, provider);
      const userBalance = await vault.getAVAXBalance(addressToUse);
      
      console.log('User vault balance:', ethers.utils.formatEther(userBalance), 'AVAX');
      setDebugInfo(`User vault balance: ${ethers.utils.formatEther(userBalance)} AVAX`);
      return userBalance;
    } catch (err: any) {
      console.error('Error checking user vault balance:', err);
      setError(err.message || 'Failed to check user vault balance');
      return ethers.BigNumber.from(0);
    }
  };

  const checkPoolBalance = async () => {
    try {
      if (!provider) {
        setError('Provider not connected');
        return;
      }
      
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const balance = await betting.poolBalance();
      const formattedBalance = ethers.utils.formatEther(balance);
      setPoolBalance(formattedBalance);
      
      console.log('Pool balance:', formattedBalance, 'AVAX');
      setDebugInfo(`Pool balance: ${formattedBalance} AVAX`);
      return balance;
    } catch (err: any) {
      console.error('Error checking pool balance:', err);
      setError(err.message || 'Failed to check pool balance');
      return ethers.BigNumber.from(0);
    }
  };

  const checkUserActiveBet = async () => {
    try {
      if (!provider || !(wallet.address || connectedAddress)) {
        setError('Wallet not connected');
        return;
      }
      
      const addressToUse = wallet.address || connectedAddress;
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, provider);
      const bet = await betting.getBet(addressToUse);
      setUserActiveBet(bet);
      
      console.log('User active bet:', bet);
      if (bet.amount && bet.amount.toString() !== '0' && !bet.settled) {
        setDebugInfo(`Active bet found: ${ethers.utils.formatEther(bet.amount)} AVAX, Position: ${bet.position === 0 ? 'Long' : 'Short'}, Settled: ${bet.settled}`);
      } else {
        setDebugInfo('No active bet found');
      }
      return bet;
    } catch (err: any) {
      console.error('Error checking user active bet:', err);
      setError(err.message || 'Failed to check user active bet');
      setUserActiveBet(null);
      return null;
    }
  };

  const placeBet = async (position: number) => {
    if (timeLeft > 0) {
      setError('Please wait for the current round to end');
      return;
    }
    if (!signer || !betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }
    if (parseFloat(betAmount) > parseFloat(vaultBalance)) {
      setError('Insufficient vault balance');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Check vault config, user balance, active bet, pool balance
      await checkVaultConfiguration();
      const userVaultBalance = await checkUserVaultBalance();
      const betAmountWei = ethers.utils.parseEther(betAmount);
      if (userVaultBalance.lt(betAmountWei)) {
        setError(`Insufficient vault balance. You have ${ethers.utils.formatEther(userVaultBalance)} AVAX but trying to bet ${betAmount} AVAX`);
        setIsLoading(false);
        return;
      }
      const activeBet = await checkUserActiveBet();
      if (activeBet && activeBet.amount && activeBet.amount.toString() !== '0' && !activeBet.settled) {
        setError(`You already have an active bet of ${ethers.utils.formatEther(activeBet.amount)} AVAX. Please wait for it to be settled.`);
        setIsLoading(false);
        return;
      }
      const poolBal = await checkPoolBalance();
      if (poolBal.lt(betAmountWei)) {
        setError(`Insufficient pool balance. Pool has ${ethers.utils.formatEther(poolBal)} AVAX but you're trying to bet ${betAmount} AVAX`);
        setIsLoading(false);
        return;
      }
      // Place bet
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, signer);
      const userAddress = wallet.address || connectedAddress;
      const tx = await betting.placeBetFor(userAddress, position, betAmountWei, { gasLimit: 500000 });
      await tx.wait();
      setBetAmount('');
      setTimeLeft(BET_TIMEOUT);
      await fetchBalances();
      alert(`Bet placed successfully! Position: ${position === 0 ? 'Long' : 'Short'}`);
    } catch (err: any) {
      if (err.message.includes('Active bet exists')) {
        setError('You already have an active bet. Please wait for it to be settled.');
      } else if (err.message.includes('Insufficient Vault balance')) {
        setError('Insufficient balance in your vault. Please deposit more AVAX.');
      } else if (err.message.includes('Insufficient pool')) {
        setError('Insufficient pool balance. The betting pool needs more funds.');
      } else if (err.message.includes('Invalid position')) {
        setError('Invalid position. Use 0 for Long or 1 for Short.');
      } else if (err.message.includes('Amount zero')) {
        setError('Bet amount must be greater than 0.');
      } else {
        setError(err.message || 'Failed to place bet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fundBettingPool = async () => {
    if (!signer || !fundAmount || parseFloat(fundAmount) <= 0) {
      setError('Please enter a valid amount to fund the pool');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const betting = new ethers.Contract(CONTRACTS.betting, BTCBettingABI.abi, signer);
      const tx = await betting.fundPool({ value: ethers.utils.parseEther(fundAmount) });
      await tx.wait();
      setFundAmount('');
      await fetchBalances();
      alert('Betting pool funded!');
    } catch (err: any) {
      setError(err.message || 'Failed to fund betting pool');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((wallet.address || connectedAddress) && provider) {
      console.log('Wallet address or provider changed, fetching balances...');
      fetchBalances();
      fetchActiveBet();
      checkBettingVaultAddress();
      checkVaultConfiguration();
      checkPoolBalance();
      checkUserActiveBet();
    }
  }, [wallet.address, connectedAddress, provider]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">GreenBet Dashboard</h1>

      {/* Debug Info */}
      <div className="bg-gray-700 p-4 rounded mb-4 text-sm">
        <p><strong>Debug Info:</strong> {debugInfo}</p>
        <p><strong>Redux Wallet Address:</strong> {wallet.address || 'Not connected'}</p>
        <p><strong>Connected Address:</strong> {connectedAddress || 'Not connected'}</p>
        <p><strong>Provider:</strong> {provider ? 'Connected' : 'Not connected'}</p>
        <p><strong>Our Vault Address:</strong> {CONTRACTS.vault}</p>
        <p><strong>Betting Contract Vault:</strong> {bettingVaultAddress || 'Not fetched'}</p>
        <p><strong>Vault Addresses Match:</strong> {bettingVaultAddress && CONTRACTS.vault ? 
          (bettingVaultAddress.toLowerCase() === CONTRACTS.vault.toLowerCase() ? '✅ YES' : '❌ NO') : 'Unknown'}</p>
        <p><strong>Vault Betting Contract:</strong> {vaultBettingContract || 'Not fetched'}</p>
        <p><strong>Betting Contract Match:</strong> {vaultBettingContract && CONTRACTS.betting ? 
          (vaultBettingContract.toLowerCase() === CONTRACTS.betting.toLowerCase() ? '✅ YES' : '❌ NO') : 'Unknown'}</p>
        <p><strong>Pool Balance:</strong> {parseFloat(poolBalance).toFixed(4)} AVAX</p>
        <p><strong>User Active Bet:</strong> {userActiveBet && userActiveBet.amount && userActiveBet.amount.toString() !== '0' && !userActiveBet.settled ? 
          `${ethers.utils.formatEther(userActiveBet.amount)} AVAX (${userActiveBet.position === 0 ? 'Long' : 'Short'})` : 'None'}</p>
      </div>

      {/* Active Bet Section */}
      <div className="bg-gray-800 p-6 rounded shadow mb-6">
        <h2 className="text-xl mb-4 font-semibold">Your Active Bet</h2>
        {activeBet && activeBet.amount && activeBet.amount.toString() !== '0' ? (
          <div className="space-y-2">
            <div><span className="text-gray-300">Amount:</span> <span className="font-bold">{ethers.utils.formatEther(activeBet.amount)} AVAX</span></div>
            <div><span className="text-gray-300">Position:</span> <span className="font-bold">{activeBet.position === 0 ? 'Long' : 'Short'}</span></div>
            <div><span className="text-gray-300">Start Time:</span> <span className="font-bold">{activeBet.startTime ? new Date(Number(activeBet.startTime) * 1000).toLocaleString() : '-'}</span></div>
            <div><span className="text-gray-300">Settled:</span> <span className="font-bold">{activeBet.settled ? 'Yes' : 'No'}</span></div>
            <div><span className="text-gray-300">Start Price:</span> <span className="font-bold">{activeBet.startPrice ? `$${(Number(activeBet.startPrice) / 100000000).toFixed(2)}` : '-'}</span></div>
            <div><span className="text-gray-300">End Price:</span> <span className="font-bold">{activeBet.endPrice ? `$${(Number(activeBet.endPrice) / 100000000).toFixed(2)}` : '-'}</span></div>
          </div>
        ) : (
          <div className="text-gray-400">No active bet found.</div>
        )}
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vault Deposit Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Deposit to Vault</h2>
          <div className="space-y-4">
            <input
              className="p-3 bg-gray-700 rounded w-full border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Amount in AVAX"
              value={vaultDepositAmount}
              onChange={(e) => setVaultDepositAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
            <button
              className={`w-full px-4 py-3 rounded font-medium ${
                isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={depositToVault}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Deposit to Vault'}
            </button>
          </div>
        </div>

        {/* Fund Betting Pool Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Fund Betting Pool</h2>
          <div className="space-y-4">
            <input
              className="p-3 bg-gray-700 rounded w-full border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Amount in AVAX"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
            <button
              className={`w-full px-4 py-3 rounded font-medium ${
                isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
              onClick={fundBettingPool}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Fund Pool'}
            </button>
          </div>
        </div>

        {/* Betting Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Place Bet</h2>
          {timeLeft > 0 ? (
            <div className="text-center">
              <p className="text-yellow-400 text-lg mb-2">Waiting for next round...</p>
              <p className="text-2xl font-bold text-yellow-400">{timeLeft}s</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                className="p-3 bg-gray-700 rounded w-full border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Bet amount in AVAX"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`px-4 py-3 rounded font-medium ${
                    isLoading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                  onClick={() => placeBet(0)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Long'}
                </button>
                <button
                  className={`px-4 py-3 rounded font-medium ${
                    isLoading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={() => placeBet(1)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Short'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Balances Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Your Balances</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Vault AVAX:</span>
              <span className="font-bold">{parseFloat(vaultBalance).toFixed(4)} AVAX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Carbon Credits:</span>
              <span className="font-bold">{parseFloat(carbonBalance).toFixed(4)} GBC</span>
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            onClick={fetchBalances}
          >
            Refresh Balances
          </button>
        </div>

        {/* Lottery Pool Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Lottery Pool</h2>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {parseFloat(lotteryPool).toFixed(4)} AVAX
            </p>
            <p className="text-gray-400 mt-2">Total Pool Size</p>
          </div>
        </div>

        {/* Vault Address Check Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Vault Address Check</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Our Vault:</span>
              <span className="font-mono text-sm">{CONTRACTS.vault}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Betting Contract Vault:</span>
              <span className="font-mono text-sm">{bettingVaultAddress || 'Not fetched'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`font-bold ${bettingVaultAddress && CONTRACTS.vault ? 
                (bettingVaultAddress.toLowerCase() === CONTRACTS.vault.toLowerCase() ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}`}>
                {bettingVaultAddress && CONTRACTS.vault ? 
                  (bettingVaultAddress.toLowerCase() === CONTRACTS.vault.toLowerCase() ? '✅ MATCH' : '❌ MISMATCH') : '⏳ CHECKING'}
              </span>
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={checkBettingVaultAddress}
          >
            Check Vault Address
          </button>
        </div>

        {/* Vault Configuration Check Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Vault Configuration</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Vault Betting Contract:</span>
              <span className="font-mono text-sm">{vaultBettingContract || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Expected Betting Contract:</span>
              <span className="font-mono text-sm">{CONTRACTS.betting}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`font-bold ${vaultBettingContract && CONTRACTS.betting ? 
                (vaultBettingContract.toLowerCase() === CONTRACTS.betting.toLowerCase() ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}`}>
                {vaultBettingContract && CONTRACTS.betting ? 
                  (vaultBettingContract.toLowerCase() === CONTRACTS.betting.toLowerCase() ? '✅ CONFIGURED' : '❌ MISCONFIGURED') : '⏳ CHECKING'}
              </span>
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            onClick={checkVaultConfiguration}
          >
            Check Configuration
          </button>
        </div>

        {/* Pool Balance Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Betting Pool</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Pool Balance:</span>
              <span className="font-bold text-yellow-400">{parseFloat(poolBalance).toFixed(4)} AVAX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`font-bold ${parseFloat(poolBalance) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(poolBalance) > 0 ? '✅ FUNDED' : '❌ EMPTY'}
              </span>
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
            onClick={checkPoolBalance}
          >
            Check Pool Balance
          </button>
        </div>

        {/* User Active Bet Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Your Active Bet</h2>
          {userActiveBet && userActiveBet.amount && userActiveBet.amount.toString() !== '0' && !userActiveBet.settled ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Amount:</span>
                <span className="font-bold">{ethers.utils.formatEther(userActiveBet.amount)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Position:</span>
                <span className="font-bold">{userActiveBet.position === 0 ? 'Long' : 'Short'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Start Time:</span>
                <span className="font-bold">{userActiveBet.startTime ? new Date(Number(userActiveBet.startTime) * 1000).toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className="font-bold text-yellow-400">⏳ ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400">No active bet</p>
              <p className="text-sm text-gray-500 mt-2">You can place a new bet</p>
            </div>
          )}
          <button
            className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            onClick={checkUserActiveBet}
          >
            Check Active Bet
          </button>
        </div>

        {/* Vault Withdraw Section */}
        <div className="bg-gray-800 p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Withdraw from Vault</h2>
          <div className="space-y-4">
            <input
              className="p-3 bg-gray-700 rounded w-full border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Amount in AVAX"
              value={vaultWithdrawAmount}
              onChange={(e) => setVaultWithdrawAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
            <button
              className={`w-full px-4 py-3 rounded font-medium ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
              onClick={withdrawFromVault}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Withdraw from Vault'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
