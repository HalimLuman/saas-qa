/**
 * Strip all HTML tags and trim user input before it touches the DB or AI prompts.
 * This is a simple defence against HTML injection — prompt injection (plain text)
 * is handled at the prompt layer via XML delimiters in lib/ai/generate.ts.
 */
export function sanitizeInput(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()
    .slice(0, maxLength)
}

export function sanitizeArray(items: string[], maxItemLength = 1000): string[] {
  return items
    .map((item) => sanitizeInput(item, maxItemLength))
    .filter(Boolean)
    .slice(0, 50) // hard cap on array length
}
