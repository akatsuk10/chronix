"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getAllBets, getUserBets, getBetStats, type Bet, type BetStats } from "@/lib/betService";
import { ExternalLink, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";

export const BetHistory = () => {
  const { address } = useSelector((state: RootState) => state.wallet);
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAllBets, setShowAllBets] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch bets
        const betsData = showAllBets 
          ? await getAllBets(page, 10)
          : await getUserBets(address || "", page, 10);
        
        setBets(betsData.bets);
        setTotalPages(betsData.pagination.pages);
        
        // Fetch stats
        const statsData = await getBetStats(showAllBets ? undefined : address || undefined);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching bet data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
    }
  }, [address, page, showAllBets]);

  const formatPrice = (price: string) => {
    try {
      return `$${parseFloat(price) / 1e18}`; // Assuming 8 decimals for price feed
    } catch {
      return price;
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPositionDisplay = (position: number) => {
    if (position === 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
          <ArrowUp className="w-3 h-3 mr-1" />
          Up
        </span>
      );
    } else if (position === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
          <ArrowDown className="w-3 h-3 mr-1" />
          Down
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-gray-300">
          Unknown
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#44FDB3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-stone-800">
            <div className="text-sm text-gray-400">Total Bets</div>
            <div className="text-xl font-bold text-white">{stats.totalBets}</div>
          </div>
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-stone-800">
            <div className="text-sm text-gray-400">Won</div>
            <div className="text-xl font-bold text-green-400">{stats.wonBets}</div>
          </div>
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-stone-800">
            <div className="text-sm text-gray-400">Lost</div>
            <div className="text-xl font-bold text-red-400">{stats.lostBets}</div>
          </div>
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-stone-800">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold text-[#44FDB3]">{stats.winRate}%</div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Bet History</h2>
        <button
          onClick={() => setShowAllBets(!showAllBets)}
          className="px-4 py-2 bg-[#44FDB3] text-black rounded-lg hover:bg-[#3ad6a0] transition-colors"
        >
          {showAllBets ? "My Bets" : "All Bets"}
        </button>
      </div>

      {/* Bets Table */}
      <div className="bg-[#1c1c1c] rounded-lg border border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Position</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Result</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Start Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">End Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {bets.map((bet) => (
                <tr key={bet.id} className="hover:bg-[#2a2a2a] transition-colors">
                  <td className="px-4 py-3 text-sm text-white">
                    {shortenAddress(bet.userAddress)}
                  </td>
                  <td className="px-4 py-3">
                    {getPositionDisplay(bet.position)}
                  </td>
                  <td className="px-4 py-3">
                    {bet.won ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Won
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Lost
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {formatPrice(bet.startPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {formatPrice(bet.endPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(bet.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://testnet.snowtrace.io/tx/${bet.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#44FDB3] hover:text-[#3ad6a0] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}; 