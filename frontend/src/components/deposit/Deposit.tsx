import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/index"; // 👈 adjust path
import { deposit, fetchVaultBalance } from "@/store/slices/vaultSlice";

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, lastTxHash, balance } = useSelector((state: RootState) => state.vault);
  const account = useSelector((state: RootState) => state.wallet.address);

  useEffect(() => {
    if (account) dispatch(fetchVaultBalance(account));
  }, [account, dispatch]);

  const handleDeposit = async () => {
    if (amount) {
      await dispatch(deposit(amount));
      if (account) await dispatch(fetchVaultBalance(account));
      setAmount("");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-xl shadow bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Deposit AVAX to Vault</h2>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.01"
        className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
      />

      <button
        onClick={handleDeposit}
        disabled={loading || !amount}
        className="w-full p-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700"
      >
        {loading ? "Depositing..." : "Deposit"}
      </button>

      {lastTxHash && (
        <div className="mt-3 text-green-400 text-sm break-all">
          ✅ Tx Confirmed:{" "}
          <a
            href={`https://testnet.snowtrace.io/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on SnowTrace
          </a>
        </div>
      )}
      {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}

      {account && (
        <div className="mt-4 text-sm text-gray-300">
          <strong>Your Vault Balance:</strong> {balance} AVAX
        </div>
      )}
    </div>
  );
};

export default Deposit;
