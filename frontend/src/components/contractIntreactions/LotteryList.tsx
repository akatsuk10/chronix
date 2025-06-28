"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Trophy, Users, Clock, RefreshCw, Star } from "lucide-react";
import lotteryABI from "../../../../smartcontract/artifacts/contracts/LotteryContract.sol/Lottery.json";
import { CONTRACTS } from "@/lib/contract/addresses";

export default function LotteryList() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [lotteryPool, setLotteryPool] = useState("5.00");
  const [previousWinners, setPreviousWinners] = useState<string[]>([]);

  const useMockData = true;

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);

    try {
      if (useMockData) {
        const mockParticipants = Array.from({ length: 10 }).map((_, i) => {
          return `0xMockUser${i.toString().padStart(2, "0")}...${(Math.random() * 10000).toFixed(0)}`;
        });
        setParticipants(mockParticipants);
        setTotalParticipants(mockParticipants.length);
        setLotteryPool("5.00");

        // Fake previous winners
        setPreviousWinners([
          "0xWinner01...bEEF",
          "0xWinner02...cAFE",
          "0xWinner03...FADE",
        ]);
        return;
      }

      if (!window.ethereum) {
        setError("Please install MetaMask!");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACTS.lottery, lotteryABI.abi, provider);

      const result = await contract.getParticipants();
      setParticipants(result || []);
      setTotalParticipants(result ? result.length : 0);

      // Add logic here if your contract has previous winners or totalPool
    } catch (err) {
      console.error("Error fetching participants:", err);
      setError("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const formatAddress = (address: string) => {
    return address.slice(0, 8) + "..." + address.slice(-4);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 shadow-lg border border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Weekly Lottery</h3>
            <p className="text-sm text-gray-600">Current participants</p>
          </div>
        </div>
        <button
          onClick={fetchParticipants}
          disabled={loading}
          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Total Participants</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalParticipants}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Draw Time</span>
          </div>
          <p className="text-lg font-semibold text-gray-800 mt-1">Sunday 8PM</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-purple-200 col-span-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Total Pool</span>
          </div>
          <p className="text-lg font-semibold text-green-700 mt-1">{lotteryPool} AVAX</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border border-purple-200 overflow-hidden mb-6">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
          <h4 className="font-medium text-gray-800">Participants Leaderboard</h4>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading participants...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchParticipants}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {participants.map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-700">{formatAddress(participant)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Winners */}
      <div className="bg-white rounded-lg border border-yellow-200 overflow-hidden mb-6">
        <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
          <h4 className="font-medium text-yellow-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-600" />
            Previous Winners
          </h4>
        </div>
        {previousWinners.map((winner, index) => (
          <div
            key={index}
            className="px-4 py-3 border-b border-gray-100 last:border-b-0 flex justify-between items-center text-sm"
          >
            <span className="font-mono text-gray-700">{winner}</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              {["🥇", "🥈", "🥉"][index] || ""}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl">
        Join Lottery (0.05 AVAX)
      </button>
    </div>
  );
}
