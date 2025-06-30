const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface Bet {
  id: string;
  user: string;
  won: boolean;
  startPrice: string;
  endPrice: string;
  position: number; // 0 for down, 1 for up, -1 for unknown
  txHash: string;
  blockNumber: number;
  timestamp: string;
  userAddress: string;
  userRelation?: {
    walletAddress: string;
    createdAt: string;
  };
}

export interface BetStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BetsResponse {
  bets: Bet[];
  pagination: PaginationInfo;
}

// Get all bets with pagination
export async function getAllBets(page: number = 1, limit: number = 20, userAddress?: string): Promise<BetsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (userAddress) {
    params.append('userAddress', userAddress);
  }

  const response = await fetch(`${API_URL}/api/bets?${params}`);
  if (!response.ok) throw new Error("Failed to fetch bets");
  return response.json();
}

// Get bets for a specific user
export async function getUserBets(userAddress: string, page: number = 1, limit: number = 20): Promise<BetsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(`${API_URL}/api/bets/user/${userAddress}?${params}`);
  if (!response.ok) throw new Error("Failed to fetch user bets");
  return response.json();
}

// Get betting statistics
export async function getBetStats(userAddress?: string): Promise<BetStats> {
  const params = userAddress ? new URLSearchParams({ userAddress }) : '';
  const response = await fetch(`${API_URL}/api/bets/stats?${params}`);
  if (!response.ok) throw new Error("Failed to fetch bet stats");
  return response.json();
}

// Get recent bets
export async function getRecentBets(limit: number = 10): Promise<{ bets: Bet[] }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${API_URL}/api/bets/recent?${params}`);
  if (!response.ok) throw new Error("Failed to fetch recent bets");
  return response.json();
} 