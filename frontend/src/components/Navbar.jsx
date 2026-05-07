import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function Navbar() {
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 h-16 w-full bg-[#0C0F14]/90 backdrop-blur-xl border-b border-white/[0.07]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Side: Brand */}
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#00E5A0]" strokeWidth={1.5} />
          <div className="flex flex-col">
            <Link to="/" className="font-display font-bold text-xl tracking-wide text-[#EEF1F6] leading-none hover:opacity-90 transition-opacity">
              D.A.<span className="text-[#00E5A0]">R</span>
            </Link>
            <span className="font-mono text-[10px] text-[#8A9BB0] tracking-widest mt-0.5">
              DIGITAL ASSET REFEREE
            </span>
          </div>
        </div>
        
        {/* Right Side: Actions */}
        <div className="flex items-center gap-6">
          <Link
            to="/batch"
            className="font-mono text-xs text-[#8A9BB0] hover:text-[#00E5A0] transition-colors"
          >
            Batch Monitor
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5A0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5A0]"></span>
              </span>
              <span className="font-mono text-[10px] text-[#8A9BB0] uppercase hidden sm:block">System Online</span>
            </div>
            
            <Link
              to="/admin"
              className="font-display text-sm font-semibold border border-[#00E5A0] text-[#00E5A0] rounded-md px-4 py-2 hover:bg-[#00E5A0] hover:text-[#050709] transition-all duration-200"
            >
              Rights Holder Login
            </Link>
          </div>
        </div>

      </div>
    </motion.nav>
  )
}
