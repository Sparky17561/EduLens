import React from 'react'

export type IconName =
  | 'dashboard' | 'chat' | 'quiz' | 'analytics' | 'homework' | 'reteach' | 'reports' | 'settings'
  | 'brand' | 'broadcast' | 'users' | 'cloud' | 'cloud-up' | 'cloud-down' | 'sync' | 'sync-pending'
  | 'ai-bot' | 'sparkle' | 'refresh' | 'play' | 'stop' | 'copy' | 'link'
  | 'book' | 'book-open' | 'pencil' | 'question' | 'target' | 'hand-raised' | 'hourglass'
  | 'upload' | 'download' | 'package' | 'print' | 'trash' | 'document' | 'camera' | 'mobile'
  | 'lightbulb' | 'warning' | 'info' | 'check' | 'x' | 'logout' | 'plus'
  | 'chevron-down' | 'chevron-up' | 'arrow-up' | 'arrow-right' | 'bolt' | 'chart-line' | 'send'

interface IconProps {
  name: IconName
  size?: number | string
  color?: string
  style?: React.CSSProperties
  className?: string
  title?: string
}

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  chat: <path d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h3v3l4-3h9a2 2 0 002-2V6a2 2 0 00-2-2zM8 12a1.4 1.4 0 11.001-2.801A1.4 1.4 0 018 12zm4 0a1.4 1.4 0 11.001-2.801A1.4 1.4 0 0112 12zm4 0a1.4 1.4 0 11.001-2.801A1.4 1.4 0 0116 12z" />,
  quiz: <path d="M12 2l2.4 6.6L21 9.7l-5 4.5L17.5 21 12 17.3 6.5 21 8 14.2 3 9.7l6.6-1.1z" />,
  analytics: (
    <>
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="10" width="4" height="11" rx="1" />
    </>
  ),
  homework: <path d="M5 3h12a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3zm2 2v12h10V5H7zm2 3h6v2H9V8zm0 4h4v2H9v-2z" />,
  reteach: <path d="M12 4V1L7 5l5 4V6a6 6 0 11-6 6H4a8 8 0 108-8z" />,
  reports: <path d="M9 2h6v2h2a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h2V2zm0 2v2h6V4H9zm-2 6h10v2H7v-2zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />,
  settings: <path d="M19.4 13a7.5 7.5 0 000-2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 00-1.7-1l-.4-2.6h-4l-.4 2.6a7.5 7.5 0 00-1.7 1l-2.4-.9-2 3.4 2 1.6a7.5 7.5 0 000 2l-2 1.6 2 3.4 2.4-.9c.5.4 1.1.8 1.7 1l.4 2.6h4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.4.9 2-3.4-2-1.6zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />,

  brand: <path d="M12 2l3 5.5 6 1-4.5 4.5 1 6.5L12 16l-5.5 3 1-6.5L3 8.5l6-1L12 2z" />,
  broadcast: <path d="M12 9a3 3 0 100 6 3 3 0 000-6zm0-7C6.48 2 2 6.48 2 12c0 3.04 1.36 5.76 3.5 7.59l1.42-1.42A8 8 0 1120 12a8 8 0 01-3.92 6.87l1.41 1.42A9.97 9.97 0 0022 12c0-5.52-4.48-10-10-10zm0 4a6 6 0 100 12 6 6 0 000-12zm-3 6a3 3 0 116 0 3 3 0 01-6 0z" />,
  users: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6 3 3 0 000 6zm-6 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 0c-.32 0-.69.02-1.07.05A5.5 5.5 0 0117 17v3h6v-3c0-2.66-5.33-4-8-4z" />,
  cloud: <path d="M18 10a6 6 0 00-11.7-1.5A4.5 4.5 0 007 17h11a4 4 0 000-7z" />,
  'cloud-up': <path d="M18 10a6 6 0 00-11.7-1.5A4.5 4.5 0 007 17h4v-3H8l4-4 4 4h-3v3h5a4 4 0 000-7z" />,
  'cloud-down': <path d="M18 10a6 6 0 00-11.7-1.5A4.5 4.5 0 007 17h4l4 4 4-4h-2v-3h3a4 4 0 000-7z" />,
  sync: <path d="M12 4V1L7 5l5 4V6a6 6 0 015.7 7.95l1.5 1.5A8 8 0 0012 4zm0 14a6 6 0 01-5.7-7.95l-1.5-1.5A8 8 0 0012 20v3l5-4-5-4v3z" />,
  'sync-pending': <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h-2V7h2v6z" />,

  'ai-bot': <path d="M12 2a2 2 0 00-2 2v1H6a3 3 0 00-3 3v10a3 3 0 003 3h12a3 3 0 003-3V8a3 3 0 00-3-3h-4V4a2 2 0 00-2-2zm-3 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-7 7h8v2H8v-2z" />,
  sparkle: <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2zm7 10l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7zM4 15l.6 2 2 .6-2 .6L4 20l-.6-1.8-2-.6 2-.6L4 15z" />,
  refresh: <path d="M17.65 6.35A8 8 0 006.35 17.65l1.42-1.42A6 6 0 1118 12h-3l3.5 3.5L22 12h-3a8 8 0 00-1.35-5.65z" />,
  play: <path d="M8 5v14l11-7L8 5z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  copy: <path d="M16 1H4a2 2 0 00-2 2v12h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" />,
  link: <path d="M3.9 12a2.1 2.1 0 012.1-2.1H10V8H6a4 4 0 100 8h4v-1.9H6A2.1 2.1 0 013.9 12zM8 13h8v-2H8v2zm10-5h-4v1.9h4a2.1 2.1 0 010 4.2h-4V16h4a4 4 0 000-8z" />,

  book: <path d="M5 3h13a1 1 0 011 1v16a1 1 0 01-1 1H7a2 2 0 01-2-2V3zm2 16h11V5H7v14z" />,
  'book-open': <path d="M21 5c-1.1-.35-2.3-.5-3.5-.5-2 0-4.15.4-5.5 1.5-1.35-1.1-3.5-1.5-5.5-1.5S2.6 4.65 1.5 5v15.65c0 .35.35.5.5.5.1 0 .15 0 .25-.05C3.3 20.55 5.2 20 6.5 20c2 0 4.15.4 5.5 1.5 1.25-.8 3.5-1.5 5.5-1.5 1.45 0 2.95.25 4.25 1 .1.05.15.05.25.05.25 0 .5-.15.5-.5V5c-.55-.4-1.15-.65-1.75-.85L21 5z" />,
  pencil: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
  question: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 00-4 0H8a4 4 0 018 0c0 .88-.36 1.68-.93 2.25z" />,
  target: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />,
  'hand-raised': <path d="M13 1.5a1.5 1.5 0 00-3 0v8h-1V3.5a1.5 1.5 0 00-3 0v8H5v-5a1.5 1.5 0 00-3 0v9.5a8 8 0 0016 0V4.5a1.5 1.5 0 00-3 0v5h-1v-8a1.5 1.5 0 00-1.5-1.5z" />,
  hourglass: <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2H6zm10 14.5V20H8v-3.5l4-4 4 4zM12 11l-4-4V4h8v3l-4 4z" />,

  upload: <path d="M12 3l-7 7h4v8h6v-8h4l-7-7zM5 20h14v2H5v-2z" />,
  download: <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />,
  package: <path d="M21 8.5L12 3 3 8.5v7L12 21l9-5.5v-7zM12 5.2l6.5 4-2.3 1.4L9.7 6.6 12 5.2zM5 10l6.5 4v6L5 16v-6zm14 6l-6.5 4v-6L19 10v6z" />,
  print: <path d="M19 8H5a3 3 0 00-3 3v6h4v4h12v-4h4v-6a3 3 0 00-3-3zM16 19H8v-5h8v5zm3-7a1 1 0 110-2 1 1 0 010 2zm-1-9H6v4h12V3z" />,
  trash: <path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />,
  document: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />,
  camera: <path d="M9 2L7 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3l-2-2H9zm3 15a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />,
  mobile: <path d="M17 1H7a3 3 0 00-3 3v16a3 3 0 003 3h10a3 3 0 003-3V4a3 3 0 00-3-3zm-5 21a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6-5H6V4h12v13z" />,

  lightbulb: <path d="M9 21a1 1 0 001 1h4a1 1 0 001-1v-1H9v1zm3-19a7 7 0 00-4 12.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2z" />,
  warning: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />,
  info: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />,
  check: <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />,
  x: <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />,
  logout: <path d="M17 8l-1.4 1.4 2.6 2.6H8v2h10.2l-2.6 2.6L17 18l5-5-5-5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z" />,
  plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,

  'chevron-down': <path d="M16.6 8.6L12 13.2 7.4 8.6 6 10l6 6 6-6z" />,
  'chevron-up': <path d="M12 8l-6 6 1.4 1.4L12 10.8l4.6 4.6L18 14z" />,
  'arrow-up': <path d="M4 12l1.4 1.4L11 7.8V20h2V7.8l5.6 5.6L20 12l-8-8z" />,
  'arrow-right': <path d="M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8z" />,
  bolt: <path d="M11 21l9-13h-6V3l-9 13h6v5z" />,
  'chart-line': <path d="M3.5 18.5l6-6.5 4 4 7-8 1.5 1.5-8.5 9.5-4-4-6 6.5z" />,
  send: <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />,
}

const STROKE_ICONS: Partial<Record<IconName, boolean>> = {
  // none right now — all solid
}

export function Icon({ name, size = 20, color, style, className, title }: IconProps) {
  const isStroke = !!STROKE_ICONS[name]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isStroke ? 'none' : color || 'currentColor'}
      stroke={isStroke ? color || 'currentColor' : undefined}
      strokeWidth={isStroke ? 2 : undefined}
      strokeLinecap={isStroke ? 'round' : undefined}
      strokeLinejoin={isStroke ? 'round' : undefined}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      {PATHS[name]}
    </svg>
  )
}

export default Icon
