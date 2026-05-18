import React, { useState } from 'react'
import AmoebaFrame, { AmoebaShape } from './AmoebaFrame'

export type StoryFilename =
  | 'login-first-light.png'
  | 'dashboard-quiet-classroom.png'
  | 'chat-listening-tree.png'
  | 'quiz-seeds-of-curiosity.png'
  | 'analytics-reading-the-sky.png'
  | 'homework-path-home.png'
  | 'reteach-pond-return.png'
  | 'reports-pressed-pages.png'
  | 'settings-library-shelf.png'

interface Props {
  file: StoryFilename
  alt?: string
  shape?: 'rounded' | AmoebaShape
  rotate?: number
  width?: number | string
  height?: number | string
  bg?: string
  fallbackLabel?: string
  style?: React.CSSProperties
  className?: string
}

/**
 * Renders a Ghibli-storytelling illustration from /story/<filename>. If the
 * file hasn't been generated yet, shows a soft gradient placeholder with the
 * scene name so layout is preserved.
 *
 * shape="rounded" (default) → simple rounded rectangle.
 * shape="puff" | "tilted" | "lopsided" | "soft" → asymmetric amoeba clip.
 */
export function StoryImage({
  file,
  alt = '',
  shape = 'rounded',
  rotate = 0,
  width = '100%',
  height = 220,
  bg,
  fallbackLabel,
  style,
  className,
}: Props) {
  const src = `/story/${file}`
  const isAmoeba = shape !== 'rounded'
  const label = fallbackLabel || file.replace(/-/g, ' ').replace(/\.png$/, '')

  const defaultBg = bg || 'linear-gradient(180deg, #F6E0D2 0%, #E8EBFA 100%)'

  if (isAmoeba) {
    return (
      <AmoebaFrame
        shape={shape as AmoebaShape}
        rotate={rotate}
        src={src}
        alt={alt}
        width={width}
        height={height}
        bg={defaultBg}
        fallback={<Placeholder label={label} />}
        style={style}
        className={className}
      />
    )
  }

  return <RoundedStoryImage src={src} alt={alt} width={width} height={height} bg={defaultBg} label={label} style={style} className={className} />
}

function RoundedStoryImage({
  src,
  alt,
  width,
  height,
  bg,
  label,
  style,
  className,
}: {
  src: string
  alt: string
  width: number | string
  height: number | string
  bg: string
  label: string
  style?: React.CSSProperties
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 24,
        overflow: 'hidden',
        background: bg,
        position: 'relative',
        ...style,
      }}
    >
      {errored ? (
        <Placeholder label={label} />
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        textAlign: 'center',
        padding: 16,
        color: 'rgba(46, 42, 51, 0.55)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ fontSize: 22, opacity: 0.5 }}>◌</span>
      <span>Story image</span>
      <span style={{ fontSize: 10, opacity: 0.7, letterSpacing: 0.5, textTransform: 'none', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default StoryImage
