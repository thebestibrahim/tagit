'use client'
import { ENV } from '@/lib/environment'

export function StagingBanner() {
  if (!ENV.isStaging) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: '#B45309',
          color: '#FEF3C7',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          opacity: 0.9,
        }}
      >
        <span style={{ fontSize: '8px' }}>⬤</span> Staging
      </span>
    </div>
  )
}
