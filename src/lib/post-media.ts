import { apiBase, apiMessage } from "@/lib/api";
import type { PostMedia } from "@/lib/mock/studio";

async function blobUrlToDataUrl(blobUrl: string) {
  const blob = await fetch(blobUrl).then((response) => response.blob());
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(blob);
  });
}

export async function uploadPostMedia(token: string, value: string): Promise<string> {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (!value.startsWith("data:") && !value.startsWith("blob:")) return value;

  const dataUrl = value.startsWith("blob:") ? await blobUrlToDataUrl(value) : value;
  const response = await fetch(`${apiBase}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataUrl }),
  });
  if (!response.ok) throw new Error(await apiMessage(response));
  const saved = (await response.json()) as { url: string };
  return saved.url;
}

export async function persistPostMedia(token: string, item: PostMedia): Promise<PostMedia> {
  const [imageUrl, videoUrl] = await Promise.all([
    uploadPostMedia(token, item.imageUrl),
    uploadPostMedia(token, item.videoUrl),
  ]);
  return { ...item, imageUrl, videoUrl };
}
