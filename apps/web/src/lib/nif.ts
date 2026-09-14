export function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const d = nif.split("").map(Number);
  if (![1, 2, 3, 5, 6, 7, 8, 9].includes(d[0])) return false;
  const sum = d.slice(0, 8).reduce((acc, digit, i) => acc + digit * (9 - i), 0);
  const rem = sum % 11;
  const check = rem < 2 ? 0 : 11 - rem;
  return check === d[8];
}