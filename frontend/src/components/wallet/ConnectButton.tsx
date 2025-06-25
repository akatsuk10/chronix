"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { login, verifySignature, storeTokens, isLoggedIn } from "@/lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthenticated, setAddress, setConnected, setChainId } from "@/store/slices/walletSlice";

export const ConnectButton = () => {
  const { address, isConnected } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.wallet.isAuthenticated);

  useEffect(() => {
    const handleAuth = async () => {
      if (!address) return;

      try {
        const initialSignature = await signMessageAsync({
          message: "Initial authentication attempt",
        });

        const result = await login(address, initialSignature);

        if (result.message) {
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

        dispatch(setAuthenticated(true)); // ✅ Set Redux authenticated
        dispatch(setAddress(address ?? null));
        dispatch(setConnected(!!isConnected));
        dispatch(setChainId(null));
        router.push("/dashboard");
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };

    // ✅ Skip if already authenticated (from tokens in localStorage or Redux)
    if (isConnected && !isAuthenticated && !isLoggedIn()) {
      handleAuth();
    } else if (isLoggedIn()) {
      dispatch(setAuthenticated(true)); // Already logged in → just update Redux
      dispatch(setAddress(address ?? null));
      dispatch(setConnected(!!isConnected));
      dispatch(setChainId(null));
    }
  }, [isConnected, address, isAuthenticated, dispatch, router, signMessageAsync]);

  return <appkit-button label="connect wallet" balance="hide"  />;
};
