import { Request, Response } from "express";
import { verifySignature } from "../utils/verifySignature.util";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import prisma from "../lib/prisma";
import { ethers } from "ethers";
import crypto from "crypto";

const MESSAGE = "Log in to MyDapp";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { walletAddress, signature } = req.body as {
    walletAddress: string;
    signature?: string;
  };

  if (!walletAddress) {
    res.status(400).json({ error: "Missing wallet address" });
    return;
  }

  const normalizedAddress = walletAddress.toLowerCase();

  try {
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    // Case 1: No user → create with nonce & nonceSigned = false
    if (!user) {
      const nonce = crypto.randomBytes(16).toString("hex");
      const message = `Sign this message to authenticate: ${nonce}`;

      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          nonce,
          nonceSigned: false,
        },
      });

      res.status(200).json({ message });
      return;
    }

    // Case 2: User exists but nonce not signed → regenerate nonce & send message
    if (user.nonceSigned === false) {
      const nonce = crypto.randomBytes(16).toString("hex");
      const message = `Sign this message to authenticate: ${nonce}`;

      await prisma.user.update({
        where: { walletAddress: normalizedAddress },
        data: { nonce, nonceSigned: false },
      });

      res.status(200).json({ message });
      return;
    }

    // Case 3: nonceSigned == true → expect signature → verify
    if (!signature) {
      res.status(400).json({ error: "Missing signature for verification" });
      return;
    }

    if (!user.nonce) {
      res.status(400).json({ error: "Nonce not found. Please request a new nonce." });
      return;
    }

    const isValid = verifySignature(MESSAGE, signature, walletAddress);
    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    

    // Signature verified → login success → generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.session.create({
      data: {
        refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Reset nonce & nonceSigned after successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { nonce: null, nonceSigned: false },
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
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

    // Update nonceSigned to true once the signature is valid
    await prisma.user.update({
      where:{
        walletAddress:walletAddress.toLowerCase()
      },
      data :{
          nonceSigned :true
      }
    })

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
