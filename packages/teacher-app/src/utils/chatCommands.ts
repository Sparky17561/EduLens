export const SLASH_COMMANDS = [
  'ask', 'generate', 'hint', 'cite', 'summarize', 'diagnose',
  'rephrase', 'explain', 'flashcards', 'quizme', 'teachme', 'examples',
  'define', 'compare', 'practice'
] as const

export function isSlashCommand(text: string): boolean {
  if (!text.startsWith('/')) return false
  const cmd = text.slice(1).split(/\s+/)[0]?.toLowerCase()
  return SLASH_COMMANDS.includes(cmd as typeof SLASH_COMMANDS[number])
}

export function parseCommand(text: string): { command: string; arg: string } | null {
  if (!text.startsWith('/')) return null
  const space = text.indexOf(' ')
  const command = (space === -1 ? text.slice(1) : text.slice(1, space)).toLowerCase()
  const arg = space === -1 ? '' : text.slice(space + 1).trim()
  if (!SLASH_COMMANDS.includes(command as typeof SLASH_COMMANDS[number])) return null
  return { command, arg }
}
