import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL

// Detection portal
export const detectMedia = (formData) =>
  axios.post(`${BASE}/detect`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getDetection = (id) => axios.get(`${BASE}/detections/${id}`)

export const getReportUrl = (id) => `${BASE}/detections/${id}/report`

export const batchDetect = (urls) => axios.post(`${BASE}/batch-detect`, { urls })

// Admin portal
export const registerAsset = (formData, idToken) =>
  axios.post(`${BASE}/register`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${idToken}`,
    },
  })

export const getAssets = (idToken) =>
  axios.get(`${BASE}/assets`, {
    headers: { Authorization: `Bearer ${idToken}` },
  })

// --- Auto-Detection Scheduler ---
export const startScheduler = (config = {}) =>
  axios.post(`${BASE}/monitor/start`, config)

export const stopScheduler = () =>
  axios.post(`${BASE}/monitor/stop`)

export const getSchedulerStatus = () =>
  axios.get(`${BASE}/monitor/status`)

export const triggerManualScan = (config = {}) =>
  axios.post(`${BASE}/monitor/scan`, config)

export const getRecentScans = (limit = 20) =>
  axios.get(`${BASE}/monitor/recent?limit=${limit}`)

// --- SSE Detection Stream ---
export const getDetectionStreamUrl = (id) =>
  `${BASE}/detect/stream/${id}`

// --- AI Chat ---
export const chatWithAI = (message) =>
  axios.post(`${BASE}/chat`, {
    message,
  })
