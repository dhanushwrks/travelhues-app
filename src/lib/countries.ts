export function countryLabel(value: string) {
  if (/^[A-Za-z]{2}$/.test(value)) return countryName(value);
  return value;
}

export function countryName(code: string) {
  if (!code) return "";
  const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
  return name && name !== code ? name : code;
}

export function countryFlag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return [...code.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
