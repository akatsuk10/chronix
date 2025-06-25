import { ethers } from "ethers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function login(walletAddress: string, signature: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature }),
  });

  if (!response.ok) throw new Error("Authentication failed");
    return response.json(); // Could be { message } or { accessToken, refreshToken }
}


export async function verifySignature(walletAddress: string, signature: string) {
  const response = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature }),
  });
  if (!response.ok) throw new Error("Failed to verify signature");
  return response.json();
}

export async function signMessage(message: string, signer: ethers.Signer) {
  return signer.signMessage(message);
}

// Checks Logic on logged In or not
export function isLoggedIn() {
  return !!localStorage.getItem('accessToken'); // true if access token exists
}



// Store tokens in localStorage
export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

// Get stored tokens
export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  };
}

// Clear stored tokens
export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}