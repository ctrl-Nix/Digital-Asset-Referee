import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const CHARS = "!@#$%^&*()_+-=[]{}|;:',.<>?/ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export function TextScramble({ text, className }) {
  const [displayText, setDisplayText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)

  const scramble = () => {
    if (isScrambling) return
    setIsScrambling(true)
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        prev
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index]
            }
            if (text[index] === " ") return " "
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join("")
      )
      
      if (iteration >= text.length) {
        clearInterval(interval)
        setDisplayText(text)
        setIsScrambling(false)
      }
      iteration += 1 / 3
    }, 30)
  }

  useEffect(() => {
    scramble()
  }, []) // Trigger on mount

  return (
    <motion.span
      className={cn("inline-block", className)}
    >
      {displayText}
    </motion.span>
  )
}
