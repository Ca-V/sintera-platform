import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'SINTERA — Seus exames têm uma história.'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFF8 50%, #FAF8F5 100%)',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,164,184,0.15) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,144,209,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8A4B8, #C490D1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', color: 'white',
          }}>
            ◎
          </div>
          <span style={{
            fontSize: '42px', fontWeight: '700', letterSpacing: '0.2em',
            color: '#1C1C1E',
          }}>
            SINTERA
          </span>
        </div>

        {/* Headline */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          textAlign: 'center', maxWidth: '800px',
        }}>
          <span style={{
            fontSize: '56px', fontWeight: '700', color: '#1C1C1E',
            lineHeight: '1.1', textAlign: 'center',
          }}>
            Sua saúde tem{' '}
            <span style={{ color: '#C4849A' }}>uma história.</span>
          </span>
          <span style={{
            fontSize: '26px', color: '#7A6E8A', fontWeight: '400',
            lineHeight: '1.4',
          }}>
            Organize suas informações de saúde e acompanhe a evolução ao longo do tempo.
          </span>
        </div>

        {/* Badge */}
        <div style={{
          marginTop: '48px',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(232,164,184,0.15)',
          border: '1px solid rgba(232,164,184,0.4)',
          borderRadius: '50px', padding: '10px 24px',
        }}>
          <span style={{ fontSize: '16px', color: '#C4849A', fontWeight: '600', letterSpacing: '0.08em' }}>
            ✦  ACESSO GRATUITO  ✦
          </span>
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: '32px',
          fontSize: '18px', color: '#B0A8B9', fontFamily: 'monospace',
        }}>
          sinteramais.com.br
        </div>
      </div>
    ),
    { ...size },
  )
}
