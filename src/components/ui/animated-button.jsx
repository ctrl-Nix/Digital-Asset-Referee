import * as React from "react"
import { cn } from "@/lib/utils"

export const AnimatedButton = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("relative flex items-center justify-center group w-full", className)}>
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-[var(--radius)] blur-[3px] 
                      before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-60
                      before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:transition-all before:duration-[2000ms]
                      group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
      </div>
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-[var(--radius)] blur-[3px] 
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                      before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-[2000ms]
                      group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
      </div>
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-[var(--radius)] blur-[2px] 
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                      before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-140
                      before:transition-all before:duration-[2000ms] group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
      </div>

      <button
        ref={ref}
        className="relative bg-card/95 backdrop-blur-sm border border-border/50 w-full h-10 rounded-[var(--radius)] text-foreground px-4 text-sm font-medium focus:outline-none transition-colors hover:text-primary"
        {...props}
      >
        {children}
      </button>
    </div>
  )
})
AnimatedButton.displayName = "AnimatedButton"
