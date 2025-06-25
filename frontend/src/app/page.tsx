"use client"

import { ActionButtonList } from "@/components/wallet/ActionButtonList";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { InfoList } from "@/components/wallet/InfoList";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      Welcome
      <div className="flex flex-col gap-4">
        <div>
          <ConnectButton />
        </div>
        <div>
        </div>
        <div>
          <ActionButtonList />
        </div>
      </div>
    </div>
  );
}
