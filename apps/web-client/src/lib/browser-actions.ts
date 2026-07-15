'use client';

export function getAbsoluteUrl(path: string) {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') return;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export async function shareUrl(input: { title?: string; text?: string; url: string }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share(input);
    return true;
  }

  await copyTextToClipboard(input.url);
  return false;
}
