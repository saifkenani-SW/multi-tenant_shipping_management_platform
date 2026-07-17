export function normalizeCitizenPhone(phone: string): string {
  if (!phone) return phone;

  let normalized = phone.trim();

  if (normalized.startsWith('+963')) {
    normalized = '0' + normalized.slice(4);
  } else if (normalized.startsWith('963') && normalized.length > 10) {
    normalized = '0' + normalized.slice(3);
  }

  return normalized;
}
