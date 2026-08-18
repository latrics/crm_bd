const PLACEHOLDERS = new Set(['na', 'n/a', 'not available', 'need to update', 'none', '-', '--', 'null', 'undefined', 'nil', 'tbd', '0']);

export const isValidValue = (val) => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim().toLowerCase();
  return str.length > 0 && !PLACEHOLDERS.has(str);
};

export const normalizeEmail = (email) => {
  if (!isValidValue(email)) return '';
  const trimmed = String(email).trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : '';
};

export const normalizePhone = (phone) => {
  if (!isValidValue(phone)) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10); // Match last 10 digits to normalize +91 / country codes
  }
  return digits.length >= 7 ? digits : '';
};

export const normalizeText = (text) => {
  if (!isValidValue(text)) return '';
  return String(text).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};
