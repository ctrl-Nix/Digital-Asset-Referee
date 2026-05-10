import { useCallback, useEffect, useState } from "react"
import { listRecentAutoScans } from "@/services/api"

const DEFAULT_POLL_INTERVAL_MS = 12000 // Balanced for near-real-time updates without overwhelming the API.

export function useAutoScanListener({ intervalMs = DEFAULT_POLL_INTERVAL_MS, limit = 20 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchRecent = useCallback(async () => {
    setError("")
    try {
      const response = await listRecentAutoScans(limit)
      setResults(response.data?.results || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to fetch auto-scan data.")
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    setLoading(true)
    fetchRecent()
    const timer = setInterval(fetchRecent, intervalMs)
    return () => clearInterval(timer)
  }, [fetchRecent, intervalMs])

  return {
    results,
    loading,
    error,
    refresh: fetchRecent,
  }
}
