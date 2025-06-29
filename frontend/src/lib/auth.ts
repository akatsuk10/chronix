import { ethers } from "ethers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function login(walletAddress: string, signature: string) {

  console.log(walletAddress,signature)
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature }),
  });


  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Authentication failed");
  }
  
  return response.json(); // Could be { message } or { accessToken, refreshToken }
}


export async function verifySignature(walletAddress: string, signature: string) {
  const response = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to verify signature");
  }
  return response.json();
}

export async function signMessage(message: string, signer: ethers.Signer) {
  return signer.signMessage(message);
}

export async function refresh(refreshToken: string) {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to refresh access token");
  }
  return response.json();
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

// Verify and refresh tokens if needed
export async function verifyAndRefreshTokens(): Promise<boolean> {
  try {
    const { accessToken, refreshToken } = getStoredTokens();
    
    if (!accessToken || !refreshToken) {
      return false;
    }

    // Try to refresh the token
    const result = await refresh(refreshToken);
    
    if (result.accessToken) {
      // Store the new access token
      localStorage.setItem('accessToken', result.accessToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid tokens
    clearTokens();
    return false;
  }
}