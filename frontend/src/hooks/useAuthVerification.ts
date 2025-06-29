import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { refresh, getStoredTokens, clearTokens } from "@/lib/auth";
import { setAuthenticated, resetWallet } from "@/store/slices/walletSlice";

export const useAuthVerification = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { accessToken, refreshToken } = getStoredTokens();
        
        if (!accessToken || !refreshToken) {
          // No tokens found, user needs to login
          setIsVerifying(false);
          setIsAuthenticated(false);
          dispatch(resetWallet());
          return;
        }

        // Try to refresh the access token
        const result = await refresh(refreshToken);
        
        if (result.accessToken) {
          // Store the new access token
          localStorage.setItem('accessToken', result.accessToken);
          setIsAuthenticated(true);
          dispatch(setAuthenticated(true));
        } else {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          setIsAuthenticated(false);
          dispatch(resetWallet());
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // Clear tokens on error
        clearTokens();
        setIsAuthenticated(false);
        dispatch(resetWallet());
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [dispatch]);

  return { isVerifying, isAuthenticated };
}; 