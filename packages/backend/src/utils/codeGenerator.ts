import { nanoid } from 'nanoid'

/**
 * Generate a 6-character alphanumeric session code (uppercase, no ambiguous chars)
 * e.g. "K7MX2P"
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Generate a unique ID for any entity
 */
export function generateId(prefix?: string): string {
  const id = nanoid(12)
  return prefix ? `${prefix}-${id}` : id
}

/**
 * Get the machine's local network IP address (for LAN QR encoding)
 */
export function getLocalIP(): string {
  const { networkInterfaces } = require('os')
  const nets = networkInterfaces()
  let wifiIp: string | null = null
  let ethernetIp: string | null = null
  let fallbackIp: string | null = null

  for (const name of Object.keys(nets)) {
    const lowerName = name.toLowerCase()

    const isVirtual = lowerName.includes('virtual') ||
                      lowerName.includes('vbox') ||
                      lowerName.includes('virtualbox') ||
                      lowerName.includes('vmware') ||
                      lowerName.includes('vmnet') ||
                      lowerName.includes('wsl') ||
                      lowerName.includes('hyper-v') ||
                      lowerName.includes('host-only') ||
                      lowerName.includes('vboxnet') ||
                      lowerName.includes('tailscale') ||
                      lowerName.includes('nordvpn') ||
                      lowerName.includes('openvpn') ||
                      lowerName.includes('wireguard') ||
                      lowerName.includes('tun') ||
                      lowerName.includes('tap') ||
                      /ethernet\s+\d+/.test(lowerName)

    const isWifi = lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan')
    const isEthernet = lowerName.startsWith('ethernet') && !isVirtual

    for (const net of nets[name]) {
      if (net.family !== 'IPv4' || net.internal) continue
      const isVboxSubnet = net.address.startsWith('192.168.56.')
      if (isVirtual || isVboxSubnet) continue

      if (isWifi && !wifiIp) wifiIp = net.address
      else if (isEthernet && !ethernetIp) ethernetIp = net.address
      else if (!fallbackIp) fallbackIp = net.address
    }
  }

  // Prefer WiFi → Ethernet → anything else
  return wifiIp || ethernetIp || fallbackIp || '127.0.0.1'
}
