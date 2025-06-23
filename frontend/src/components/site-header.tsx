import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { Input } from "./ui/input"

export function SiteHeader() {
  return (
    <header className="bg-stone-900 flex h-[70px] shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 text-white">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 shadow-inner shadow-[#A3EC66]/30">
          <img src="chronix.png" alt="" />
        </div>
        <h1 className="text-lg font-medium tracking-tight">Chronix</h1>
        <div className="ml-10 flex items-center gap-8 text-sm">
          <Link href={"#"}>
            Leaderboard
          </Link>
          <Link href={"#"}>
            Casino
          </Link>
          <Link href={"#"}>
            Slots
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
        <button
        type="button"
        className="px-6 tracking-tight py-3 text-sm rounded-full bg-gradient-to-b from-[#e6e6e6] via-[#c0c0c0] to-[#a0a0a0] text-black font-semibold shadow-inner shadow-white/80 border-b border-b-white/30 border-b-[1.5px] hover:from-[#f8f8f8] hover:to-[#b0b0b0] transition-colors relative overflow-hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:w-full before:bg-gradient-to-r before:from-white/80 before:via-white/40 before:to-transparent before:opacity-80 before:blur-[1.5px] before:rounded-b-full"
      >
        Connect wallet
      </button>
        </div>
      </div>
    </header>
  )
}
