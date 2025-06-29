"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { login, verifySignature, storeTokens, isLoggedIn, clearTokens, refresh, getStoredTokens } from "@/lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthenticated, setAddress, setConnected, setChainId, resetWallet } from "@/store/slices/walletSlice";

export const ConnectButton = () => {
  const { address, isConnected } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const dispatch = useDispatch();
  const prevAddressRef = useRef<string | null>(null);
  const prevIsConnectedRef = useRef<boolean>(false);

  const isAuthenticated = useSelector((state: RootState) => state.wallet.isAuthenticated);

  // Handle refresh token verification for already logged in users
  useEffect(() => {
    const verifyExistingAuth = async () => {
      if (isConnected && address && isLoggedIn() && !isAuthenticated) {
        try {
          const { refreshToken } = getStoredTokens();
          if (refreshToken) {
            const result = await refresh(refreshToken);
            if (result.accessToken) {
              localStorage.setItem('accessToken', result.accessToken);
              dispatch(setAuthenticated(true));
              dispatch(setAddress(address ?? null));
              dispatch(setConnected(!!isConnected));
              dispatch(setChainId(null));
            } else {
              // Refresh failed, clear tokens
              clearTokens();
              dispatch(resetWallet());
            }
          }
        } catch (error) {
          console.error("Refresh token verification failed:", error);
          clearTokens();
          dispatch(resetWallet());
        }
      }
    };

    verifyExistingAuth();
  }, [isConnected, address, isAuthenticated, dispatch]);

  useEffect(() => {
    const handleAuth = async () => {
      if (!address) return;

      try {
        const initialSignature = await signMessageAsync({
          message: "Welcome to Chronix.bet! 🚀\n\nSign this message to authenticate your wallet and access our decentralized prediction platform.\n\nBy signing, you agree to our Terms of Service and Privacy Policy.\n\nNonce: ",
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

  // Handle disconnect - improved logic
  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;
    const wasAddress = prevAddressRef.current;
    
    // Check if wallet was disconnected (either isConnected became false or address became null)
    const isDisconnected = (!isConnected && wasConnected) || 
                          (address === null && wasAddress !== null) ||
                          (!isConnected && isAuthenticated);

    if (isDisconnected && isAuthenticated) {
      console.log("Wallet disconnected, clearing data and redirecting...");
      
      // Clear all localStorage data
      clearTokens();
      localStorage.clear();
      
      // Reset Redux wallet state
      dispatch(resetWallet());
      
      // Redirect to homepage
      router.push("/");
    }

    // Update refs for next comparison
    prevIsConnectedRef.current = isConnected;
    prevAddressRef.current = address ?? null;
  }, [isConnected, address, isAuthenticated, dispatch, router]);

  return <appkit-button label="connect wallet" balance="hide"  />;
};
