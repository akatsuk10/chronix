"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import NeumorphWrapper from "@/components/ui/nuemorph-wrapper";
import carbonABI from "@/abis/CarbonCredit.json";
import { CONTRACTS } from "@/lib/contract/addresses";

type Holder = {
  address: string;
  amount: string;
};

export default function CarbonDashboardPage() {
  const [totalSupply, setTotalSupply] = useState("0");
  const [avaxUsd, setAvaxUsd] = useState("0");
  const [emchRate, setEmchRate] = useState("0");
  const [gbcPrice, setGbcPrice] = useState("0");
  const [leaderboard, setLeaderboard] = useState<Holder[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {

      const useMockData = true;

      if (useMockData) {
        const mockHolders: Holder[] = Array.from({ length: 10 }).map((_, i) => {
          const randomAmount = (Math.random() * (30 - 0.1) + 0.1).toFixed(4); // between 0.1 and 30
          return {
            address: `0xMockAddress${i.toString().padStart(2, "0")}abcdef1234567890abcdef${i}`,
            amount: randomAmount,
          };
        });

        mockHolders.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

        setLeaderboard(mockHolders);

        const total = mockHolders.reduce((sum, user) => sum + parseFloat(user.amount), 0);
        setTotalSupply(total.toFixed(4));
      }
      if (!window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 43113) {
        await (window.ethereum as any).request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xa869" }],
        });
        return fetchData();
      }

      const contract = new ethers.Contract(CONTRACTS.carbonCredit, carbonABI.abi, provider);
      const [supply, avaxPriceRaw, emchRateRaw] = await Promise.all([
        contract.totalSupply(),
        contract.getAvaxUsd(),
        contract.getEmchRate(),
      ]);

      setAvaxUsd((Number(avaxPriceRaw) / 1e8).toFixed(2));
      setEmchRate((Number(emchRateRaw) / 1e18).toFixed(4));
      setGbcPrice((Number(emchRateRaw) / 1e18).toFixed(2));

      if (!useMockData) {
        setTotalSupply(formatUnits(supply, 18));

        const [addresses, balances] = await contract.getLeaderboard();
        const leaderboardData: Holder[] = addresses.map((addr: string, i: number) => ({
          address: addr,
          amount: formatUnits(balances[i], 18),
        }));

        leaderboardData.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        setLeaderboard(leaderboardData);
      }
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    }
  };

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
          <div className="flex flex-1 gap-2 w-full">
            {/* Scrollable main content */}
            <main className="flex-1 overflow-y-auto p-4">
              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card label="🌱 Total Minted GBC" value={`${totalSupply} GBC`} />
                <Card label="💰 GBC Price" value={`~$${gbcPrice}`} />
                <Card label="AVAX/USD" value={`$${avaxUsd}`} />
                <Card label="EmCH Rate" value={`${emchRate}`} />
              </div>

              {/* Leaderboard */}
              <NeumorphWrapper className="p-4 h-auto text-white">
                <h2 className="text-lg font-bold mb-4 text-green-400">🏆 Leaderboard</h2>
                <div className="divide-y">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.address}
                      className="py-2 flex justify-between text-sm md:text-base"
                    >
                      <span>
                        {index + 1}. {shorten(user.address)}
                      </span>
                      <span>{parseFloat(user.amount).toFixed(2)} GBC</span>
                    </div>
                  ))}
                </div>
              </NeumorphWrapper>
            </main>

            {/* Fixed Sidebar Info */}
            <div className="w-[26%] h-90vh m-4">
              <NeumorphWrapper className="p-4 text-white h-full flex flex-col items-start justify-start">
                <h2 className="text-lg font-bold mb-2 text-green-400">About GBC</h2>
                <p className="text-sm leading-6 text-white">
                  GBC (Green Blockchain Credit) is backed by <strong>EmCH</strong> and priced
                  against AVAX. It’s minted when users win bets on BTC, and a portion of their
                  winnings go to buy carbon credit-backed tokens.
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
