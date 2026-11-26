/** Models without a native JSON mode may wrap the object in a Markdown fence. */
export function stripCodeFence(text: string): string {
  const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1] : text
}
