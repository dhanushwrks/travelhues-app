import { mediaUrl } from "@/lib/api";

/** How many slides before/after the active hue still buffer video. */
export const VIDEO_LOAD_WINDOW = 1;

export function isHlsSource(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

export function resolvePlaybackSrc(videoUrl: string, streamUrl?: string) {
  const raw = streamUrl?.trim() || videoUrl.trim();
  if (!raw) return "";
  return mediaUrl(raw);
}

export function shouldLoadVideo(index: number, activeIndex: number, window = VIDEO_LOAD_WINDOW) {
  return Math.abs(index - activeIndex) <= window;
}
