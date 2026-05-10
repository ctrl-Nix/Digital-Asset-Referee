import { useCallback, useEffect, useState } from "react"
import { listRecentAutoScans } from "@/services/api"

export function useAutoScanListener({ intervalMs = 12000, limit = 20 } = {}) {
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
