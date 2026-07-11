import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'SINTERA — Sua saúde tem uma história.'
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
          background: 'linear-gradient(135deg, #FAF8F5 0%, #EEF7F4 50%, #FAF8F5 100%)',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(87,179,173,0.15) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,110,100,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0E7580, #6BC0CE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', color: 'white',
          }}>
            ◎
          </div>
          <span style={{
            fontSize: '42px', fontWeight: '700', letterSpacing: '0.2em',
            color: '#26201C',
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
            fontSize: '56px', fontWeight: '700', color: '#26201C',
            lineHeight: '1.1', textAlign: 'center',
          }}>
            Sua saúde tem{' '}
            <span style={{ color: '#0E7580' }}>uma história.</span>
          </span>
          <span style={{
            fontSize: '26px', color: '#5B6B67', fontWeight: '400',
            lineHeight: '1.4',
          }}>
            Organize suas informações de saúde e acompanhe a evolução do seu cuidado ao longo da vida.
          </span>
        </div>

        {/* Badge */}
        <div style={{
          marginTop: '48px',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(87,179,173,0.15)',
          border: '1px solid rgba(87,179,173,0.4)',
          borderRadius: '50px', padding: '10px 24px',
        }}>
          <span style={{ fontSize: '16px', color: '#0E7580', fontWeight: '600', letterSpacing: '0.08em' }}>
            ✦  ACESSO GRATUITO  ✦
          </span>
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: '32px',
          fontSize: '18px', color: '#8AA39D', fontFamily: 'monospace',
        }}>
          sinteramais.com.br
        </div>
      </div>
    ),
    { ...size },
  )
}
