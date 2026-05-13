export function extractVideoId(input) {
  if (!input) return '';
  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || '';
    }
  } catch {
    return input.trim();
  }
  return '';
}
