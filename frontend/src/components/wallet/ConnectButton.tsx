"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { login, verifySignature, storeTokens } from "@/lib/auth";

export const ConnectButton = () => {
  const { address, isConnected } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      if (!address) return;

      try {
        // 1️⃣ Initial dummy signature → required by backend for login
        const initialSignature = await signMessageAsync({
          message: "Initial authentication attempt",
        });

        // 2️⃣ Call login API → backend will return either { message } or tokens
        const result = await login(address, initialSignature);

        if (result.message) {
          // 3️⃣ If nonce returned → sign it
          const nonceSignature = await signMessageAsync({
            message: result.message,
          });

          const { accessToken, refreshToken } = await verifySignature(address, nonceSignature);
          storeTokens(accessToken, refreshToken);
        } else if (result.accessToken && result.refreshToken) {
          storeTokens(result.accessToken, result.refreshToken);
        } else {
          throw new Error("Unexpected response from server");
        }

        // ✅ Redirect after successful login
        router.push("/dashboard");
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };

    if (isConnected) {
      handleAuth();
    }
  }, [isConnected, address, signMessageAsync, router]);

  return <appkit-button />;
};
