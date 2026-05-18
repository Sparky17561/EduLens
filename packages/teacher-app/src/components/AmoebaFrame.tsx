import React, { useId } from 'react'

export type AmoebaShape = 'puff' | 'tilted' | 'lopsided' | 'soft'

const SHAPES: Record<AmoebaShape, string> = {
  // Designed in a 100x100 viewBox. Asymmetric organic blobs.
  puff:
    'M48 6 C72 4 92 18 95 42 C99 64 86 88 62 92 C40 96 14 86 8 62 C2 38 18 10 48 6 Z',
  tilted:
    'M30 8 C62 2 92 16 94 46 C97 72 78 96 50 92 C24 96 4 74 8 48 C6 28 12 14 30 8 Z',
  lopsided:
    'M40 4 C68 6 92 22 94 48 C100 70 82 96 56 94 C28 98 6 78 6 52 C2 28 18 4 40 4 Z',
  soft:
    'M50 6 C76 8 96 28 94 54 C92 80 70 96 46 92 C20 94 4 72 8 48 C10 22 28 4 50 6 Z',
}

interface Props {
  shape?: AmoebaShape
  rotate?: number
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
  bg?: string
  fallback?: React.ReactNode
  style?: React.CSSProperties
  className?: string
  onError?: () => void
}

/**
 * Image masked into an asymmetric amoeba shape. If `src` fails to load (image
 * not generated yet), falls back to a soft gradient swatch in `bg`.
 */
export function AmoebaFrame({
  shape = 'puff',
  rotate = 0,
  src,
  alt = '',
  width = '100%',
  height = '100%',
  bg = 'linear-gradient(180deg, #F6E0D2, #E8EBFA)',
  fallback,
  style,
  className,
  onError,
}: Props) {
  const id = useId().replace(/:/g, '')
  const clipId = `amoeba-${id}`
  const [errored, setErrored] = React.useState(false)
  const showFallback = !src || errored

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        display: 'inline-block',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={SHAPES[shape]} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {showFallback ? (
            <foreignObject x="0" y="0" width="100" height="100">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {fallback}
              </div>
            </foreignObject>
          ) : (
            <image
              href={src}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
              onError={() => {
                setErrored(true)
                onError?.()
              }}
            />
          )}
        </g>
      </svg>
    </div>
  )
}

export default AmoebaFrame
