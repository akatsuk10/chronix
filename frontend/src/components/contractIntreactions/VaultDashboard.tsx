import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { CONTRACTS } from '@/lib/contract/addresses';
import bettingABI from "../../../../smartcontract/artifacts/contracts/VaultBetting.sol/BTCBetting.json";
import { RootState } from '@/store';
import { Wallet, TrendingUp, Shield, ArrowUpRight } from 'lucide-react';

export default function VaultDashboard() {
  const { address } = useSelector((state: RootState) => state.wallet);
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("0.05");
  const [loading, setLoading] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState("0");
  const [apy, setApy] = useState("12.5");

  const fetchBalance = async () => {
    if (!address || !window.ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const vault = new ethers.Contract(CONTRACTS.vaultBetting, bettingABI.abi, provider);
      const userBalance = await vault.getAVAXBalance(address);
      setBalance(ethers.utils.formatEther(userBalance));
      setTotalDeposits("1,234.56"); // optional mock
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const deposit = async () => {
    if (!address || !window.ethereum) return;

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const vault = new ethers.Contract(CONTRACTS.vaultBetting, bettingABI.abi, signer);

      const tx = await vault.depositAVAX({
        value: ethers.utils.parseEther(amount),
      });
      await tx.wait();
      fetchBalance();
    } catch (error) {
      console.error("Deposit error:", error);
      alert(`Deposit failed: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);


  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-6 shadow-lg border border-emerald-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Vault Dashboard</h3>
          <p className="text-sm text-gray-600">Secure your AVAX with high yields</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-600">Your Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{balance} AVAX</p>
          <p className="text-xs text-gray-500 mt-1">Available for withdrawal</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-600">APY Rate</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{apy}%</p>
          <p className="text-xs text-gray-500 mt-1">Annual percentage yield</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-600">Total Deposits</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalDeposits} AVAX</p>
          <p className="text-xs text-gray-500 mt-1">Across all users</p>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="bg-white rounded-lg p-6 border border-emerald-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Deposit AVAX</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Deposit (AVAX)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.05"
                min="0.01"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-sm">AVAX</span>
              </div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {["0.1", "0.5", "1.0", "5.0"].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className="px-3 py-1 text-sm border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
              >
                {quickAmount}
              </button>
            ))}
          </div>

          {/* Estimated Returns */}
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Annual Return:</span>
              <span className="text-sm font-medium text-emerald-700">
                {(parseFloat(amount) * parseFloat(apy) / 100).toFixed(4)} AVAX
              </span>
            </div>
          </div>

          {/* Deposit Button */}
          <button
            onClick={deposit}
            disabled={loading || !address}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              loading || !address
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Depositing...
              </>
            ) : !address ? (
              <>
                <Wallet className="w-4 h-4" />
                Connect Wallet to Deposit
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Deposit {amount} AVAX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Security</span>
          </div>
          <p className="text-xs text-blue-700">
            Your funds are secured by smart contracts and audited by leading security firms.
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">High Yields</span>
          </div>
          <p className="text-xs text-purple-700">
            Earn competitive APY through DeFi strategies and yield farming.
          </p>
        </div>
      </div>
    </div>
  );
}