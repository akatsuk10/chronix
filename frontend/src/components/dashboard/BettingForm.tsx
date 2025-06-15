import { useState } from "react";

export const BettingForm = () => {
  const [selectedTab, setSelectedTab] = useState("Single Bet");
  const [betAmount, setBetAmount] = useState(50);
  const quickAmounts = [20, 50, 100];

  return (
    <div className="p-2 w-full max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex mb-4 bg-stone-950/80 border border-stone-800 rounded-full overflow-hidden p-1">
        {['Single Bet', 'Parlay', 'System'].map(tab => (
          <button
            key={tab}
            className={`flex-1 py-2 text-sm rounded-full font-medium transition-colors ${selectedTab === tab ? 'bg-stone-800 text-white`' : 'bg-transparent text-gray-400'}`}
            onClick={() => setSelectedTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bet Details Card */}
      <div className="bg-stone-800 border border-stone-800 rounded-lg p-4 mb-4">
        <div className="text-xs text-gray-400 mb-1">Arsenal x Real Madrid</div>
        <div className="border-b border-stone-700 mb-2"></div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Full-time result</div>
            <div className="text-lg font-semibold text-white">Real Madrid</div>
          </div>
          <div className="text-white text-base font-medium">1.24</div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-3 mb-4">
        {quickAmounts.map(amount => (
          <button
            key={amount}
            type="button"
            className={`px-4 py-1 rounded-full text-white border border-stone-800 transition-colors ${betAmount === amount ? 'bg-stone-800 border-stone-600' : ''}`}
            onClick={() => setBetAmount(amount)}
          >
            {amount}
          </button>
        ))}
        <button
          type="button"
          className={`px-4 py-1 rounded-full text-white border border-stone-800 transition-colors ${betAmount === 9999 ? 'bg-stone-800 border-stone-600' : ''}`}
          onClick={() => setBetAmount(9999)}
        >
          Max
        </button>
      </div>

      {/* Bet Amount Input */}
      <div className="mb-6">
        <div className="bg-stone-950/40 rounded-lg px-4 py-3 flex items-center justify-between border border-stone-800">
          <span className="text-gray-400 text-sm">Bet amount</span>
          <span className="text-white text-lg font-semibold">{betAmount.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Bet Now Button */}
      <button
        type="button"
        className="w-full py-3 rounded-xl bg-[#2fffa0] text-black text-lg font-semibold shadow-md hover:bg-[#24d88a] transition-colors"
      >
        Bet now
      </button>
    </div>
  );
}