"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import carbonABI from "@/abis/CarbonCredit.json";
import { CONTRACTS } from "@/lib/contract/addresses";
import { formatUnits, parseUnits } from "ethers/lib/utils";

type Holder = {
  address: string;
  amount: string;
};

export default function CarbonPage() {
  const [totalSupply, setTotalSupply] = useState("0");
  const [avaxUsd, setAvaxUsd] = useState("0");
  const [emchRate, setEmchRate] = useState("0");
  const [gbcPrice, setGbcPrice] = useState("0");
  const [leaderboard, setLeaderboard] = useState<Holder[]>([]);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState("");

  const fetchData = async () => {
    try {
      if (!window.ethereum) throw new Error("Install MetaMask");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("user newtwork", network);

      if (network.chainId !== 43113) {
        console.warn("Not on Fuji. Switching...");
        await (window.ethereum as any).request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xa869" }],
        });
        return fetchData();
      }

      const signer = provider.getSigner();
      const user = await signer.getAddress();
      setUserAddress(user);

      const contract = new ethers.Contract(CONTRACTS.carbonCredit, carbonABI.abi, provider);

      const [supply, avaxPriceRaw, emchRateRaw] = await Promise.all([
        contract.totalSupply(),
        contract.getAvaxUsd(),
        contract.getEmchRate(),
      ]);

      const avaxUsdFormatted = Number(avaxPriceRaw) / 1e8;
      const emchRateFormatted = Number(emchRateRaw) / 1e18;
      const gbcCalculatedPrice = emchRateFormatted;

      setTotalSupply(formatUnits(supply, 18));
      setAvaxUsd(avaxUsdFormatted.toFixed(2));
      setEmchRate(emchRateFormatted.toFixed(4));
      setGbcPrice(gbcCalculatedPrice.toFixed(2));

      const [addresses, balances] = await contract.getLeaderboard();
      const leaderboardData: Holder[] = addresses.map((addr: string, i: number) => ({
        address: addr,
        amount: formatUnits(balances[i], 18),
      }));

      leaderboardData.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error("Error:", err);
    }
  };

  const handleTestMint = async () => {
    if (!window.ethereum || !mintAmount || !userAddress) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.carbonCredit, carbonABI.abi, signer);

      const tx = await contract.testMint(userAddress, parseUnits(mintAmount, 18));
      await tx.wait();
      setMintAmount("");
      fetchData(); // refresh leaderboard + totals
    } catch (err) {
      console.error("Mint error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-green-600">🌿 Carbon Credit Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card label="🌱 Total Minted GBC" value={`${totalSupply} GBC`} />
        <Card label="💰 GBC Price" value={`~$${gbcPrice}`} />
        <Card label="AVAX/USD" value={`$${avaxUsd}`} />
        <Card label="EmCH Rate" value={`${emchRate}`} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6 text-black">
        <h2 className="text-xl font-semibold mb-2">🧪 Test Mint</h2>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <input
            type="number"
            step="0.1"
            placeholder="Amount in GBC"
            className="p-2 border rounded w-full md:w-1/2"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <button
            onClick={handleTestMint}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Mint GBC
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">🏆 Leaderboard</h2>
      <div className="bg-white text-black rounded-xl shadow divide-y overflow-hidden">
        {leaderboard.map((user, index) => (
          <div key={user.address} className="px-4 py-3 flex justify-between">
            <span>
              {index + 1}. {shorten(user.address)}
            </span>
            <span>{parseFloat(user.amount).toFixed(2)} GBC</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white text-black p-4 rounded-xl shadow flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function shorten(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}
