import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { Input } from "./ui/input"

export function SiteHeader() {
  return (
    <header className="bg-stone-900 flex h-[70px] shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 text-white">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#44FDB3]">
          <div className="rounded-full bg-black w-5 h-5"/>
        </div>
        <h1 className="text-lg font-medium tracking-tight">Chronix</h1>
        <div className="ml-10 flex items-center gap-8 text-sm">
          <Link href={"#"}>
            Sports
          </Link>
          <Link href={"#"}>
            Casino
          </Link>
          <Link href={"#"}>
            Slots
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
        <div className="mr-3">
          <Input className="border border-stone-600 bg-stone-950 h-[50px]" placeholder="Search for teams"/>
        </div>
        <button
        type="button"
        className="px-6 tracking-tight py-3 rounded-xl bg-[#2fffa0] text-black font-semibold shadow-md hover:bg-[#24d88a] transition-colors"
      >
        Connect wallet
      </button>
        </div>
      </div>
    </header>
  )
}
