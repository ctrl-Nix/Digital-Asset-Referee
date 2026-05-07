import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export function useAnomalyListener(ownerName) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 86400000))
    const q = query(
      collection(db, 'official_media'),
      where('owner_name', '==', ownerName),
      where('detection_count', '>=', 5),
      where('upload_timestamp', '>=', cutoff)   // proxy — replace with last_detected_at
    )
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => d.data()))
    })
    return unsub
  }, [ownerName])

  return alerts
}
