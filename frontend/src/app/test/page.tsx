// "use client"
// import BetPanel from "@/components/contractIntreactions/BetPanel";
// import LotteryList from "@/components/contractIntreactions/LotteryList";
// import VaultDashboard from "@/components/contractIntreactions/VaultDashboard";
// import { ConnectButton } from "@/components/wallet/ConnectButton";
// import { Wallet, Zap, Trophy, Shield } from "lucide-react";
// import ReportFetcher from "@/components/contractIntreactions/GettingData";

// export default function Test() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Header */}
//       <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
//                 <Zap className="w-6 h-6 text-white" />
//               </div>
//               <h1 className="text-xl font-bold text-gray-800">Chronix DeFi Platform</h1>
//             </div>
//             <ConnectButton />
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Welcome Section */}
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">
//             Welcome to Chronix
//           </h2>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Experience the future of decentralized finance with our comprehensive suite of DeFi tools including betting, lotteries, and yield vaults.
//           </p>
//         </div>

//         {/* Features Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
//           <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 text-center">
//             <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
//               <Zap className="w-6 h-6 text-blue-600" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">BTC Betting</h3>
//             <p className="text-gray-600 text-sm">
//               Predict BTC price movements and earn rewards with our decentralized betting platform.
//             </p>
//           </div>
          
//           <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 text-center">
//             <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
//               <Trophy className="w-6 h-6 text-purple-600" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">Weekly Lottery</h3>
//             <p className="text-gray-600 text-sm">
//               Join our weekly lottery for a chance to win big prizes with transparent smart contracts.
//             </p>
//           </div>
          
//           <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 text-center">
//             <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
//               <Shield className="w-6 h-6 text-emerald-600" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">Yield Vault</h3>
//             <p className="text-gray-600 text-sm">
//               Earn competitive yields on your AVAX with our secure and audited vault contracts.
//             </p>
//           </div>
//         </div>

//         {/* Components Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
//           {/* Betting Panel */}
//           <div className="lg:col-span-1">
//             <BetPanel />
//           </div>
          
//           {/* Lottery List */}
//           <div className="lg:col-span-1">
//             <LotteryList />
//           </div>
          
//           {/* Vault Dashboard */}
//           <div className="lg:col-span-1 xl:col-span-1">
//             <VaultDashboard />
//           </div>
//           <div className="lg:col-span-1 xl:col-span-1">
//             <ReportFetcher/>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="mt-16 text-center">
//           <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to get started?</h3>
//             <p className="text-gray-600 mb-4">
//               Connect your wallet and start exploring our DeFi ecosystem
//             </p>
//             <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
//               <Wallet className="w-4 h-4" />
//               <span>Make sure you have MetaMask installed</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }