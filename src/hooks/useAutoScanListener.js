import { useCallback, useEffect, useState } from "react"
import { listRecentAutoScans } from "@/services/api"

const DEFAULT_POLL_INTERVAL_MS = 12000 // Intentionally throttled to balance freshness with API load.

export function useAutoScanListener({ intervalMs = DEFAULT_POLL_INTERVAL_MS, limit = 20, enabled = true } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchRecent = useCallback(async () => {
    if (!enabled) return
    setError("")
    try {
      const response = await listRecentAutoScans(limit)
      setResults(response.data?.results || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to fetch auto-scan data.")
    } finally {
      setLoading(false)
    }
  }, [limit, enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchRecent()
    const timer = setInterval(fetchRecent, intervalMs)
    return () => clearInterval(timer)
  }, [fetchRecent, intervalMs, enabled])

  return {
    results,
    loading,
    error,
    refresh: fetchRecent,
  }
}
