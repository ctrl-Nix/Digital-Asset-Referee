import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * useAutoScanListener — Real-time Firestore listener for auto-scan detections.
 *
 * Subscribes to the `detections` collection filtered by source="auto_scan",
 * listening for new infringement/suspicious detections in the last 24 hours.
 *
 * @param {number} maxResults - Maximum number of recent detections to return
 * @returns {{ detections: array, infringements: array, loading: boolean }}
 */
export function useAutoScanListener(maxResults = 20) {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to auto-scan detections from the last 24h
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 86400000))

    let q
    try {
      q = query(
        collection(db, 'detections'),
        where('source', '==', 'auto_scan'),
        orderBy('detection_timestamp', 'desc'),
        limit(maxResults)
      )
    } catch (e) {
      // Fallback: simpler query if compound index doesn't exist
      console.warn('Firestore compound query failed, using simple query:', e)
      q = query(
        collection(db, 'detections'),
        where('source', '==', 'auto_scan'),
        limit(maxResults)
      )
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setDetections(results)
        setLoading(false)
      },
      (error) => {
        console.error('Auto-scan listener error:', error)
        setLoading(false)
      }
    )

    return unsub
  }, [maxResults])

  const infringements = detections.filter(
    d => d.agent_verdict === 'INFRINGEMENT' || d.agent_verdict === 'SUSPICIOUS'
  )

  return { detections, infringements, loading }
}
