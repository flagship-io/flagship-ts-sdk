/**
 * Return a formatted string
 */
export function sprintf(format: string, ...value: any[]): string {
  let formatted = format;
  for (let i = 0; i < value.length; i++) {
    const element = value[i];
    formatted = format.replace(`{${i}}`, element);
  }
  return formatted;
}
