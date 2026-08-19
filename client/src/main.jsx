import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/Toast'

// ── Security Console Banner (Self-XSS & Session Hijack Defense) ──
if (typeof window !== 'undefined') {
  console.log(
    '%cSTOP!',
    'color: #ef4444; font-size: 36px; font-weight: 900; font-family: monospace; text-shadow: 0 0 10px rgba(239,68,68,0.8);'
  );
  console.log(
    '%cSECURITY WARNING: This console is intended exclusively for developers.\nDo NOT paste or execute code here. Pasting untrusted code can compromise your account credentials, hijack your session tokens, and expose your personal data (Self-XSS / Session Hijack attack).',
    'color: #fbbf24; font-size: 13px; font-weight: bold; line-height: 1.5;'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
