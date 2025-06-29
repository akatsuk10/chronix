"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useAppKitAccount } from "@reown/appkit/react";
import { RootState } from "@/store";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import NeumorphWrapper from "@/components/ui/nuemorph-wrapper";

export default function LandingPage() {
  const { isConnected, address } = useAppKitAccount();
  const isAuthenticated = useSelector((state: RootState) => state.wallet.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is connected and authenticated
    if (isConnected && address && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isConnected, address, isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-[#121212] text-white font-sans flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#1C1C1C] shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            {/* Logo */}
            <NeumorphWrapper className="w-10 h-10 relative rounded-lg [box-shadow:0_0_10px_-1px_#00000040] border border-black/50 after:absolute after:content-[''] after:inset-0 after:rounded-lg after:border-t-2 after:border-r-2 after:border-[#2A2A2A] after:pointer-events-none bg-[#1c1c1c]">
              <img src="/chronix.png" alt="Chronix Logo" />
            </NeumorphWrapper>

            <h1 className="text-lg font-medium tracking-tight">Chronix</h1>



          </div>
          <div className="ml-10 flex items-center gap-4 text-sm">
            <Link href="/carbon-credits" className="hover:text-[#44FDB3] transition-colors">Carbon Credit</Link>
            <Link href="/lottery" className="hover:text-[#44FDB3] transition-colors">Lottery</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
          <Link href={"/dashboard"} className="text-sm text-[#44FDB3] hover:text-[#5FFDBB] transition-colors">
            <button className="ml-4 bg-[#44FDB3] text-black px-4 py-2 rounded-lg hover:bg-[#3ad6a0] transition-colors">
              Get Started
            </button>
          </Link>
        </div>

      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-20">
        <img
          src="/chronix2.png"
          alt="chronix"
          className="w-60 h-60 sm:w-80 sm:h-80 lg:w-[250px] lg:h-[250px]"
        />
        <h1 className="text-gray-400 text-3xl max-w-2xl">
          predict. profit. plant the future.
        </h1>
      </section>

      {/* Features Section */}
      <section id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 md:py-8">
        {features.map((f, i) => (
          <NeumorphWrapper key={i}>
            <div
              className="bg-[#1C1C1C] text-white p-6 rounded-2xl transform transition-all"
            >
              <div className="text-3xl mb-4 text-[#5FFDBB]">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          </NeumorphWrapper>
        ))}
      </section>

      {/* Footer */}
      <footer id="about" className="bg-[#1C1C1C] text-center py-6 text-gray-500 text-sm border-t border-[#2A2A2A]">
        <p>Chronix © 2025. Built for a greener Web3 future. 💚</p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: "📈",
    title: "Predict & Earn",
    desc: "Make price predictions on BTC and earn up to 1.9x your bet.",
  },
  {
    icon: "🌿",
    title: "Mint Carbon Tokens",
    desc: "Win bets and automatically mint carbon credit-backed GBC tokens.",
  },
  {
    icon: "🎰",
    title: "Weekly Lottery",
    desc: "Top predictors enter a Chainlink-powered lottery with big rewards.",
  },
];