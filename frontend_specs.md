# Frontend Specs — Digital Asset Protection MVP

## Stack
- React 18 + Vite
- React Router v6 (client-side routing)
- TailwindCSS (styling)
- Firebase JS SDK v9+ (Auth + Firestore + Storage)
- Axios (API calls to FastAPI backend)

---

## Pages & Routing/                    → DetectionPortal (public, default landing)
/result/:id          → DetectionResult (public)
/admin               → AdminLogin
/admin/dashboard     → AdminDashboard (protected)
/admin/register      → AdminRegister (protected)

Protected routes redirect to `/admin` if no Firebase Auth session exists.

---

## Page: DetectionPortal (`/`)

### Purpose
Public-facing page where anyone submits a file or URL for piracy detection.

### UI Elements
- Navbar with logo + "Admin Login" link (top right)
- Hero heading: "Is this content stolen?"
- Subheading: "Submit a link or upload a file to check against our official media registry"
- **UploadZone component** (primary input):
  - Drag-and-drop area (dashed border, accepts image/*, video/*)
  - "Or paste a URL" text input below the drop zone
  - Accepted formats label: JPG, PNG, MP4, MOV, WebM — max 200MB
  - "Detect" submit button (disabled until file or URL provided)
- On submit:
  - Show loading spinner with status text cycling through:
    "Normalizing media..." → "Generating fingerprint..." → "Matching against registry..." → "Analyzing with Gemini..."
  - POST to `/detect` endpoint
  - On success: navigate to `/result/:detection_id`
  - On error: show inline error message

### State
```jsconst [file, setFile] = useState(null)
const [url, setUrl] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

---

## Page: DetectionResult (`/result/:id`)

### Purpose
Display the full detection result for a given detection_id.

### Data Fetching
- On mount: GET `/detections/{id}` to fetch result object
- Show skeleton loader while fetching

### UI Elements

#### ResultCard component (top)
- Large verdict badge:
  - "PIRATED" — red background
  - "SUSPICIOUS" — amber background
  - "ORIGINAL" — green background
  - "UNKNOWN" — gray background
- Confidence score: large number "92%" with circular progress ring
- Matched asset info (if match found):
  - Owner name, sport category, upload date
  - Thumbnail of original asset

#### ComparisonView component (middle, shown if match found)
- Two-column layout:
  - Left: "Submitted" — thumbnail/preview of submitted media
  - Right: "Matched original" — thumbnail of official asset
- For videos: show matched timestamp range "Match found: 00:32 – 00:47"
- Similarity score bar between the two columns

#### Gemini analysis panel (below comparison)
- Section heading: "AI Content Analysis"
- Gemini-generated description of what the content shows
- Displayed as a styled blockquote card

#### Evidence Report section (shown only if verdict = "Pirated")
- Heading: "Download Evidence Report"
- Description: "Use this PDF for DMCA or platform takedown requests"
- "Download PDF" button → GET `/detections/{id}/report`

#### Back button
- "Run another check" → navigates back to `/`

---

## Page: AdminLogin (`/admin`)

### UI Elements
- Centered card (max-width 400px)
- Logo + "Rights Holder Portal" heading
- Email input
- Password input
- "Sign In" button
- Error message on failed login
- On success: navigate to `/admin/dashboard`

### Logic
```js// uses firebase.js auth helper
signInWithEmailAndPassword(auth, email, password)
.then(() => navigate('/admin/dashboard'))
.catch(err => setError(err.message))

---

## Page: AdminDashboard (`/admin/dashboard`)

### Purpose
Overview for authenticated rights holders — registered assets, alerts, detections.

### UI Elements

#### AnomalyAlert component (top, conditional)
- Firestore real-time listener via `useAnomalyListener` hook
- Shows red alert banner if any owned asset has detection_count >= 5 in last 24h:
  "Alert: [Asset Name] has been detected 7 times in the last 24 hours without authorization"
- Dismissible per session

#### Stats row
- 3 stat cards: "Registered Assets", "Total Detections", "Piracy Alerts"

#### AssetTable component
- Paginated table (10 rows per page)
- Columns: Thumbnail | Content ID | Owner | Sport | Uploaded | Detection Count | Actions
- Actions: "View detections" link
- Data fetched from GET `/assets` with Firebase ID token in Authorization header

#### "Register New Asset" button
- Navigates to `/admin/register`

#### "Sign Out" link
- Calls `signOut(auth)` → redirects to `/admin`

---

## Page: AdminRegister (`/admin/register`)

### Purpose
Upload official media and register it into the system.

### UI Elements
- Back link to dashboard
- Form fields:
  - Owner name (text input, pre-filled from auth user if available)
  - Sport category (select: Football, Basketball, Cricket, Tennis, Other)
  - File upload (drag-and-drop + picker, image/* and video/*)
  - Preview of selected file (image thumbnail or video player)
- "Register Asset" submit button
- On submit:
  - POST to `/register` with `Authorization: Bearer {firebase_id_token}`
  - Show progress bar during upload
  - On success: show success toast + navigate to dashboard
  - On error: show inline error

### State
```jsconst [file, setFile] = useState(null)
const [ownerName, setOwnerName] = useState('')
const [sportCategory, setSportCategory] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

---

## Component: UploadZone

### Props
```js{
onFileSelect: (file: File) => void,
onUrlChange: (url: string) => void,
accept: string,       // MIME types
maxSizeMB: number
}

### Behavior
- Drag-over: border turns blue, background lightens
- File dropped or selected: show filename + size + remove button
- URL input and file drop are mutually exclusive — selecting one clears the other
- Validate file size on select, show error if over limit

---

## Component: ComparisonView

### Props
```js{
submittedUrl: string,        // preview URL of submitted media
originalUrl: string,         // Firebase Storage URL of official asset
similarityScore: number,     // 0–100
matchStart: number | null,   // seconds
matchEnd: number | null
}

---

## Hook: useAnomalyListener

```js// Listens to Firestore for assets owned by current user
// with detection_count >= 5 updated in the last 24 hours
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

---

## services/api.js — All Backend Calls

```jsimport axios from 'axios'
const BASE = import.meta.env.VITE_API_URL// Detection portal
export const detectMedia = (formData) =>
axios.post(${BASE}/detect, formData, {
headers: { 'Content-Type': 'multipart/form-data' }
})export const getDetection = (id) =>
axios.get(${BASE}/detections/${id})export const getReportUrl = (id) =>
${BASE}/detections/${id}/report// Admin portal
export const registerAsset = (formData, idToken) =>
axios.post(${BASE}/register, formData, {
headers: {
'Content-Type': 'multipart/form-data',
'Authorization': Bearer ${idToken}
}
})export const getAssets = (idToken) =>
axios.get(${BASE}/assets, {
headers: { 'Authorization': Bearer ${idToken} }
})

---

## services/firebase.js

```jsimport { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'const firebaseConfig = {
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
appId: import.meta.env.VITE_FIREBASE_APP_ID,
}const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)