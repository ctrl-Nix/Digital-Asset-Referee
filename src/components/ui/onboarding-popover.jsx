import * as React from "react"
import { Popover, PopoverAnchor, PopoverContent } from "./popover"
import { ArrowRight, X } from "lucide-react"

export function OnboardingPopover({ isOpen, title, description, children, onNext, onSkip, isLast, side = "top" }) {
  return (
    <>
      {children}
      <Popover open={isOpen}>
        <PopoverAnchor className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none" />
        <PopoverContent 
          side="bottom" 
          align="center" 
          sideOffset={0} 
          className="w-[260px] p-4 shadow-2xl z-[100] border-border/40 bg-card/95 backdrop-blur-xl"
        >
        <div className="space-y-3 relative">
          <button 
            onClick={onSkip} 
            className="absolute -top-1 -right-1 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="space-y-1.5 pr-6">
            <p className="text-[13px] font-semibold tracking-tight text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
          <div className="flex items-center justify-between pt-3">
            <button onClick={onSkip} className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-white/5">
              Skip Tour
            </button>
            <button 
              onClick={onNext} 
              className="text-[11px] flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 font-medium transition-colors shadow-sm"
            >
              {isLast ? "Done" : "Next"} {!isLast && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </>
  )
}
