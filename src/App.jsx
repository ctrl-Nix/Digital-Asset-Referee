import * as React from "react"
import { Routes, Route } from "react-router-dom"
import { motion } from "framer-motion"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Footer } from "@/components/ui/footer"

// Pages
import DetectionPortal from "@/pages/detection-portal"
import DetectionResult from "@/pages/result-page"
import AdminLogin from "@/pages/admin-login-page"
import AdminDashboard from "@/pages/admin-dashboard"
import AdminRegister from "@/pages/admin-register"
import BatchMonitor from "@/pages/batch-monitor"

function App() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen flex flex-col bg-background font-sans relative overflow-hidden"
    >
      <BackgroundPaths />

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tighter text-foreground">
              DIGITAL ASSET PROTECTOR
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative z-10 w-full">
        <Routes>
          <Route path="/" element={<DetectionPortal />} />
          <Route path="/result/:id" element={<DetectionResult />} />
          <Route path="/batch" element={<BatchMonitor />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/register" element={<AdminRegister />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <Footer />
    </motion.div>
  )
}

export default App
