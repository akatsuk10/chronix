"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import NeumorphWrapper from "@/components/ui/nuemorph-wrapper";
import lotteryABI from "@/abis/Lottery.json";
import { CONTRACTS } from "@/lib/contract/addresses";

export default function LotteryDashboardPage() {
  const useMockData = true;

  const [participants, setParticipants] = useState<string[]>([]);
  const [points, setPoints] = useState<{ [user: string]: number }>({});
  const [totalPool, setTotalPool] = useState<string>("0");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (useMockData) {
      const mockUsers = Array.from({ length: 10 }).map((_, i) => {
        return `0xUser${i.toString().padStart(2, "0")}...${(Math.random() * 10000).toFixed(0)}`;
      });

      const mockPoints: { [user: string]: number } = {};
      for (const user of mockUsers) {
        mockPoints[user] = Math.floor(Math.random() * 15) + 1; // 1–15 pts
      }

      setParticipants(mockUsers);
      setPoints(mockPoints);
      setTotalPool((3.5 + Math.random() * 2).toFixed(2)); // 3.5 – 5.5 AVAX
      setTimeRemaining(Math.floor(Math.random() * 3600 * 24 * 3)); // Up to 3 days
      return;
    }

    try {
      if (!window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const lottery = new ethers.Contract(CONTRACTS.lottery, lotteryABI.abi, provider);

      const users: string[] = await lottery.getParticipants();
      setParticipants(users);

      const pointsMap: { [user: string]: number } = {};
      for (const user of users) {
        const userPoints = await lottery.getPoints(user);
        pointsMap[user] = Number(userPoints);
      }
      setPoints(pointsMap);

      const pool = await provider.getBalance(CONTRACTS.lottery);
      setTotalPool(formatEther(pool));

      const time = await lottery.getTimeRemaining();
      setTimeRemaining(Number(time));
    } catch (err) {
      console.error("Error loading lottery data:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const now = Math.floor(Date.now() / 1000); // current UNIX time
    const end = now + seconds;
    const endDate = new Date(end * 1000);

    const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
    const days = Math.floor((seconds % (7 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (weeks) parts.push(`${weeks}w`);
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (secs || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  };

  const sortedParticipants = [...participants].sort(
    (a, b) => (points[b] || 0) - (points[a] || 0)
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-var(--header-height))]">
          <div className="flex flex-1 w-full">
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card label="💰 Prize Pool" value={`${totalPool} AVAX`} />
                <Card label="⏰ Time Remaining" value={formatTime(timeRemaining)} />
              </div>

              {/* Past Winners (future feature) */}
              <div className="my-6">
                <NeumorphWrapper className="p-4 text-white">
                  <h2 className="text-lg font-bold mb-2 text-pink-400">🏆 Past Winners</h2>
                  <ul className="list-disc pl-5 text-sm text-white/80">
                    <li>0xWinner01...beef (40%)</li>
                    <li>0xWinner02...fade (30%)</li>
                    <li>0xWinner03...dead (20%)</li>
                  </ul>
                </NeumorphWrapper>
              </div>

              {/* Leaderboard */}
              <NeumorphWrapper className="p-4 h-auto text-white">
                <h2 className="text-lg font-bold mb-4 text-yellow-300">🏅 Lottery Leaderboard</h2>
                <div className="divide-y">
                  {sortedParticipants.map((user, index) => (
                    <div
                      key={user}
                      className="py-2 flex justify-between text-sm md:text-base"
                    >
                      <span>
                        {index + 1}. {shorten(user)}
                      </span>
                      <span>{points[user]} pts</span>
                    </div>
                  ))}
                </div>
              </NeumorphWrapper>
            </main>

            {/* Sidebar Info */}
            <div className="w-[26%] h-90vh m-4">
              <NeumorphWrapper className="p-4 text-white h-full flex flex-col items-start justify-start">
                <h2 className="text-lg font-bold mb-2 text-yellow-300">How it works</h2>
                <p className="text-sm leading-6 text-white">
                  When you win BTC bets, you’re entered into the weekly lottery. The more you win,
                  the more <strong>points</strong> you earn, increasing your chance of being picked
                  as one of 3 lucky winners. Pool prize is auto-distributed using Chainlink VRF +
                  Automation.
                </p>
              </NeumorphWrapper>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <NeumorphWrapper className="p-4 text-white h-full flex flex-col items-start justify-start">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </NeumorphWrapper>
  );
}

function shorten(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}
