"use client"
import { SiteHeader } from "@/components/site-header"
import { BettingForm } from "@/components/dashboard/BettingForm";
import { TradingViewWidget } from "@/components/dashboard/TradingWidgetBTC";
import { TradingViewWidgetETH } from "@/components/dashboard/TradingWidgetETH";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import  Deposit  from "@/components/deposit/Deposit"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"
import NeumorphWrapper from "@/components/ui/nuemorph-wrapper";

export default function Page() {
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
            <div className="h-[60vh] w-full rounded-lg overflow-hidden shadow-lg">
              <TradingViewWidgetETH />
            </div>
          </TabsContent>
        </Tabs>
        <Deposit/>
      </main>
      <div className="w-[26%] h-screen m-4">
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
