"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import lotteryABI from "@/abis/Lottery.json";
import { CONTRACTS } from "@/lib/contract/addresses"; // your deployed addresses
import { formatEther } from "ethers/lib/utils";

export default function LotteryPage() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [points, setPoints] = useState<{ [user: string]: number }>({});
  const [totalPool, setTotalPool] = useState<string>("0");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [winners, setWinners] = useState<{ users: string[]; prizes: string[] }[]>([]);

  const loadContractData = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found. Please install MetaMask.");
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const lottery = new ethers.Contract(CONTRACTS.lottery, lotteryABI.abi, provider);

      const participantsList: string[] = await lottery.getParticipants();
      setParticipants(participantsList);

      const pointsMap: { [user: string]: number } = {};
      for (let user of participantsList) {
        const userPoints = await lottery.getPoints(user);
        pointsMap[user] = Number(userPoints);
      }
      setPoints(pointsMap);

      const pool = await provider.getBalance(CONTRACTS.lottery);
      setTotalPool(formatEther(pool));

      const time = await lottery.getTimeRemaining();
      setTimeRemaining(Number(time));
    } catch (err) {
      console.error("Error loading contract data:", err);
    }
  };

  useEffect(() => {
    loadContractData();

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const sortedParticipants = [...participants].sort(
    (a, b) => (points[b] || 0) - (points[a] || 0)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🎲 Chainlink Lottery</h1>

      <div className="mb-6 bg-gray-900 p-4 rounded-xl text-white shadow-md">
        <p><strong>⏰ Time Remaining:</strong> {formatTime(timeRemaining)}</p>
        <p><strong>💰 Prize Pool:</strong> {totalPool} AVAX</p>
      </div>

      <h2 className="text-2xl font-semibold mb-2">🏅 Leaderboard</h2>
      <ul className="bg-white rounded-xl shadow divide-y overflow-hidden">
        {sortedParticipants.map((user, index) => (
          <li key={user} className="px-4 py-3 flex justify-between">
            <span>{index + 1}. {user.slice(0, 6)}...{user.slice(-4)}</span>
            <span>{points[user]} pts</span>
          </li>
        ))}
      </ul>

      {/* You can load past winners from subgraph/logs/etc if needed */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">🏆 Past Winners</h2>
        <p className="text-sm text-gray-500">[Coming soon: via backend or events]</p>
      </div>
    </div>
  );
}
