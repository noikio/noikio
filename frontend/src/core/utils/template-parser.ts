const VAR_RE = /\{\{\s*(\w+)\s*\}\}/g;

export function extractVariables(content: string): string[] {
  return [...new Set([...content.matchAll(VAR_RE)].map((m) => m[1]))];
}

export function interpolate(content: string, values: Partial<Record<string, string>>): string {
  return content.replace(VAR_RE, (_, name) => values[name] ?? `{{${name}}}`);
}
