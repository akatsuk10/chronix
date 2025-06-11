import { BettingForm } from "@/components/dashboard/BettingForm";
import { TradingViewWidget } from "@/components/dashboard/TradingWidgetBTC";
import { TradingViewWidgetETH } from "@/components/dashboard/TradingWidgetETH";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      <main className="flex-1 h-full p-4">
        <Tabs defaultValue="BTC" className="h-full">
          <TabsList>
            <TabsTrigger value="BTC">BTC</TabsTrigger>
            <TabsTrigger value="ETH">ETH</TabsTrigger>
          </TabsList>

          <TabsContent value="BTC" className="h-full flex gap-4">
            <div className="w-[70%] h-[60vh] rounded-lg overflow-hidden shadow-lg">
              <TradingViewWidget />
            </div>
            <div className="w-[30%] h-full">
              <BettingForm />
            </div>
          </TabsContent>

          <TabsContent value="ETH" className="h-full flex gap-4">
            <div className="w-[70%] h-[60vh] rounded-lg overflow-hidden shadow-lg">
              <TradingViewWidgetETH />
            </div>
            <div className="w-[30%] h-full">
              <BettingForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
