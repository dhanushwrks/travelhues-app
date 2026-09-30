export function packDescription(summary: string, tips: string, affiliate: string, reference: string) {
  let text = summary.trim();
  if (tips.trim()) text += `\n\nTips\n${tips.trim()}`;
  if (affiliate) text += `\n\nBooking: ${affiliate}`;
  if (reference) text += `\n\nReference: ${reference}`;
  return text;
}

export function unpackDescription(description: string) {
  let text = description;
  let reference = "";
  let affiliate = "";
  const ref = text.match(/\n\nReference: (https:\/\/\S+)\s*$/);
  if (ref?.index != null) {
    reference = ref[1];
    text = text.slice(0, ref.index);
  }
  const booking = text.match(/\n\nBooking: (https:\/\/\S+)\s*$/);
  if (booking?.index != null) {
    affiliate = booking[1];
    text = text.slice(0, booking.index);
  }
  let tips = "";
  const marker = "\n\nTips\n";
  const index = text.lastIndexOf(marker);
  if (index >= 0) {
    tips = text.slice(index + marker.length).trim();
    text = text.slice(0, index);
  }
  return { summary: text.trim(), tips, affiliate, reference };
}
