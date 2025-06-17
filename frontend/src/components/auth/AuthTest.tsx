"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { getNonce, verifySignature } from "@/lib/auth";

export function AuthTest() {
  const { address } = useAccount();
  const [message, setMessage] = useState<string>("");
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [error, setError] = useState<string>("");

  const { signMessageAsync } = useSignMessage();

  const handleAuth = async () => {
    if (!address) return;
    
    try {
      setError("");
      // Get nonce
      const { message: nonceMessage } = await getNonce(address);
      setMessage(nonceMessage);

      // Sign message
      const signature = await signMessageAsync({ message: nonceMessage });

      // Verify signature
      const result = await verifySignature(address, signature);
      setTokens(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Authentication Test</h2>
      
      {message && (
        <div className="p-2 bg-gray-100 rounded">
          <p className="text-sm">Message to sign:</p>
          <p className="font-mono text-xs break-all">{message}</p>
        </div>
      )}

      {tokens && (
        <div className="p-2 bg-green-100 rounded">
          <p className="text-sm">Authentication successful!</p>
          <p className="font-mono text-xs break-all">Access Token: {tokens.accessToken}</p>
          <p className="font-mono text-xs break-all">Refresh Token: {tokens.refreshToken}</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-100 rounded">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleAuth}
        disabled={!address}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {address ? "Authenticate" : "Connect wallet first"}
      </button>
    </div>
  );
} 