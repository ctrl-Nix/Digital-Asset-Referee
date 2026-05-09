import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders"
import { cn } from "@/lib/utils"

export const AnimatedBlock = React.forwardRef(({ className, children, ...props }, ref) => {
  const [isHovered, setIsHovered] = useState(false)
  const shaderRef = useRef(null)
  const shaderMount = useRef(null)

  useEffect(() => {
    const styleId = "shader-canvas-style-block"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = `
        .shader-container-block canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 1.5rem !important; /* matches rounded-3xl */
        }
      `
      document.head.appendChild(style)
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy()
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.3,
              u_shiftBlue: 0.3,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.0
          )
        }
      } catch (error) {
        console.error("Failed to load shader:", error)
      }
    }

    loadShader()

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy()
        shaderMount.current = null
      }
    }
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    shaderMount.current?.setSpeed?.(1.5)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    shaderMount.current?.setSpeed?.(0.0)
  }

  return (
    <div 
      className={cn("relative flex items-center justify-center w-full group", className)} 
      ref={ref} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        className="absolute inset-0 z-[-1] rounded-3xl overflow-hidden bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-900 dark:to-black"
        style={{
          boxShadow: "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          ref={shaderRef}
          className={cn(
            "shader-container-block absolute inset-0 w-full h-full rounded-3xl transition-opacity duration-700 dark:mix-blend-screen mix-blend-multiply",
            isHovered ? "opacity-30 dark:opacity-40" : "opacity-0"
          )}
        />
      </div>

      <div 
        className="relative bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/5 w-full h-full rounded-3xl transition-shadow duration-500 shadow-inner"
      >
        {children}
      </div>
    </div>
  )
})
AnimatedBlock.displayName = "AnimatedBlock"
