import { cn } from "@/lib/utils"

const NeumorphWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={cn("relative [box-shadow:0_0_10px_-1px_#00000040] h-full rounded-3xl border border-black/50 after:absolute after:content-[''] after:inset-0 after:rounded-3xl after:border-t-2 after:border-r-2 after:border-[#2A2A2A] after:pointer-events-none bg-[#1c1c1c]",
            className,

        )}>
            {children}
        </div>
    )
}

export default NeumorphWrapper