import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ExternalLink, Shield } from 'lucide-react'

export default function AssetTable({ assets }) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(assets.length / pageSize))
  const pageAssets = assets.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-[#12171F] border border-white/[0.07] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1A2130] border-b border-white/[0.07]">
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Thumbnail</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Content ID</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Owner</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Sport</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Uploaded</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Detections</th>
              <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.07]">
            <AnimatePresence mode="popLayout">
              {pageAssets.map((asset, index) => (
                <motion.tr
                  key={asset.content_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-[#1A2130] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="w-11 h-11 rounded bg-[#1A2130] border border-white/10 overflow-hidden flex items-center justify-center">
                      {asset.file_url ? (
                        <img src={asset.file_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-4 h-4 text-brand-neutral opacity-20" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-brand-neutral truncate max-w-[120px] block" title={asset.content_id}>
                      {asset.content_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-white">{asset.owner_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 border border-brand-primary/30 rounded font-mono text-[10px] text-brand-primary uppercase">
                      {asset.sport_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-brand-neutral">
                    {asset.upload_timestamp ? new Date(asset.upload_timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-sm font-bold ${asset.detection_count > 0 ? 'text-brand-secondary' : 'text-brand-neutral'}`}>
                      {asset.detection_count ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-2 font-mono text-[11px] text-brand-primary hover:opacity-80 transition-opacity uppercase tracking-widest">
                      View <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {assets.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                   <div className="flex flex-col items-center gap-3 opacity-30">
                      <Shield className="w-12 h-12 text-brand-neutral" />
                      <span className="font-mono text-xs uppercase tracking-widest">No assets registered in terminal</span>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-[#1A2130] px-6 py-4 flex items-center justify-between border-t border-white/[0.07]">
        <div className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-2 border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-2 border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

