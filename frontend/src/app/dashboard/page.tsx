"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuthVerification } from "@/hooks/useAuthVerification";
import LoadingScreen from "@/components/ui/loading-screen";
import { SiteHeader } from "@/components/site-header"
import { BettingForm } from "@/components/dashboard/BettingForm";
import { TradingViewWidget } from "@/components/dashboard/TradingWidgetBTC";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import NeumorphWrapper from "@/components/ui/nuemorph-wrapper";

export default function Page() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const isAuthenticated = useSelector((state: RootState) => state.wallet.isAuthenticated);
  const { isVerifying, isAuthenticated: isTokenValid } = useAuthVerification();

  useEffect(() => {
    // Check if wallet is connected and authenticated
    if (!isVerifying && (!isConnected || !address || !isTokenValid)) {
      console.log("User not authenticated, redirecting to homepage...");
      router.push("/");
    }
  }, [isConnected, address, isTokenValid, isVerifying, router]);

  // Show loading screen while verifying tokens
  if (isVerifying) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  // Don't render dashboard if not authenticated
  if (!isConnected || !address || !isTokenValid) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 gap-2">
          <main className="flex-1 h-full w-full p-4">
        <Tabs defaultValue="BTC" className="h-full">
          <TabsList>
            <TabsTrigger value="BTC">BTC</TabsTrigger>
            <TabsTrigger value="ETH">ETH</TabsTrigger>
            <TabsTrigger value="SOL">SOL</TabsTrigger>
            <TabsTrigger value="TRON">TRON</TabsTrigger>
          </TabsList>

          <TabsContent value="BTC" className="h-full flex gap-4">
            <div className="h-[60vh] w-full rounded-lg overflow-hidden shadow-lg">
              <TradingViewWidget />
            </div>
          </TabsContent>

          <TabsContent value="ETH" className="h-full flex gap-4">
            <div>
               You will get the chance. We are buildingit 
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <div className="w-[26%] h-90vh m-4">
        <NeumorphWrapper className="p-4">
              <BettingForm />
        </NeumorphWrapper>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
