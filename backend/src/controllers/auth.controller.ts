import { Request, Response } from "express";
import { verifySignature } from "../utils/verifySignature.util";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import prisma from "../lib/prisma";
import { ethers } from "ethers";
import crypto from "crypto";

const MESSAGE = "Log in to MyDapp";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { address, signature } = req.body as { address: string; signature: string };

  if (!address || !signature) {
    res.status(400).json({ error: "Missing address or signature" });
    return;
  }

  const isValid = verifySignature(MESSAGE, signature, address);
  if (!isValid) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  try {
    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress: address.toLowerCase() },
      update: {},
      create: { walletAddress: address.toLowerCase() }
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken) {
    res.status(400).json({ error: "Missing refresh token" });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as { userId: string };
    
    // Verify token exists and is not expired
    const token = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!token) {
      res.status(403).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

export const getNonce = async (req: Request, res: Response): Promise<void> => {
  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    res.status(400).json({ error: "Missing or invalid wallet address" });
    return;
  }

  try {
    // Generate a random 16-byte hex nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    const message = `Sign this message to authenticate: ${nonce}`;

    // Upsert user with the new nonce
    await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { nonce },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce
      }
    });

    res.json({ message });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyWalletSignature = async (req: Request, res: Response): Promise<void> => {
  const { walletAddress, signature } = req.body;

  if (!walletAddress || !signature) {
    res.status(400).json({ error: "Missing wallet address or signature" });
    return;
  }

  try {
    // Get user and their nonce
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!user || !user.nonce) {
      res.status(401).json({ error: "Invalid wallet address or nonce expired" });
      return;
    }

    const message = `Sign this message to authenticate: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Clear the nonce after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { nonce: null }
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
