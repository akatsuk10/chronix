import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getAllBets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, userAddress } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = userAddress ? {
      userAddress: (userAddress as string).toLowerCase()
    } : {};

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
        include: {
          userRelation: {
            select: {
              walletAddress: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.bet.count({ where: whereClause })
    ]);

    res.json({
      bets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching bets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserBets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where: {
          userAddress: userAddress.toLowerCase()
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.bet.count({
        where: {
          userAddress: userAddress.toLowerCase()
        }
      })
    ]);

    res.json({
      bets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching user bets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBetStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.query;
    const whereClause = userAddress ? {
      userAddress: (userAddress as string).toLowerCase()
    } : {};

    const [totalBets, wonBets, lostBets] = await Promise.all([
      prisma.bet.count({ where: whereClause }),
      prisma.bet.count({ where: { ...whereClause, won: true } }),
      prisma.bet.count({ where: { ...whereClause, won: false } })
    ]);

    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    res.json({
      totalBets,
      wonBets,
      lostBets,
      winRate: Math.round(winRate * 100) / 100
    });
  } catch (error) {
    console.error("Error fetching bet stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPositionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.query;
    const whereClause = userAddress ? {
      userAddress: (userAddress as string).toLowerCase()
    } : {};

    // Get stats for Up bets (position = 1)
    const upBets = await prisma.bet.count({ 
      where: { ...whereClause, position: 1 } 
    });
    const upWon = await prisma.bet.count({ 
      where: { ...whereClause, position: 1, won: true } 
    });
    const upWinRate = upBets > 0 ? (upWon / upBets) * 100 : 0;

    // Get stats for Down bets (position = 0)
    const downBets = await prisma.bet.count({ 
      where: { ...whereClause, position: 0 } 
    });
    const downWon = await prisma.bet.count({ 
      where: { ...whereClause, position: 0, won: true } 
    });
    const downWinRate = downBets > 0 ? (downWon / downBets) * 100 : 0;

    // Get stats for unknown position bets (position = -1)
    const unknownBets = await prisma.bet.count({ 
      where: { ...whereClause, position: -1 } 
    });
    const unknownWon = await prisma.bet.count({ 
      where: { ...whereClause, position: -1, won: true } 
    });
    const unknownWinRate = unknownBets > 0 ? (unknownWon / unknownBets) * 100 : 0;

    res.json({
      up: {
        total: upBets,
        won: upWon,
        lost: upBets - upWon,
        winRate: Math.round(upWinRate * 100) / 100
      },
      down: {
        total: downBets,
        won: downWon,
        lost: downBets - downWon,
        winRate: Math.round(downWinRate * 100) / 100
      },
      unknown: {
        total: unknownBets,
        won: unknownWon,
        lost: unknownBets - unknownWon,
        winRate: Math.round(unknownWinRate * 100) / 100
      }
    });
  } catch (error) {
    console.error("Error fetching position stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecentBets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    const bets = await prisma.bet.findMany({
      orderBy: { timestamp: 'desc' },
      take: limitNum,
      include: {
        userRelation: {
          select: {
            walletAddress: true
          }
        }
      }
    });

    res.json({ bets });
  } catch (error) {
    console.error("Error fetching recent bets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 