'use client'
import { ENV } from '@/lib/environment'

export function StagingBanner() {
  if (!ENV.isStaging) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: '#B45309',
        color: '#FEF3C7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        zIndex: 9999,
        userSelect: 'none'
      }}
    >
      ⚠ Staging Environment — Data here is not real
    </div>
  )
}
