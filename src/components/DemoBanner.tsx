'use client'
import { useState } from 'react'

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div style={{
      background: 'rgba(200, 132, 58, 0.12)',
      borderBottom: '1px solid rgba(200, 132, 58, 0.3)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontSize: '13px',
      color: '#C8843A',
      position: 'relative',
      zIndex: 100,
    }}>
      <span>
        <strong>Demo mode</strong> — all data shown is fictional.
        No real financial information is stored or displayed.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#C8843A',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: '1',
          padding: '0 4px',
          opacity: 0.6,
        }}
      >
        ✕
      </button>
    </div>
  )
}
