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
