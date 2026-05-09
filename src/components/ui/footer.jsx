import * as React from "react"
import { cn } from "@/lib/utils"

export function Footer({ className }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn("w-full bg-transparent mt-auto relative z-20", className)}>
      <div className="container mx-auto px-6 py-6 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center md:text-left">
          © {currentYear} Digital Asset Protector. All rights reserved.
        </p>
        
        <nav className="flex items-center justify-center gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
            About
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
