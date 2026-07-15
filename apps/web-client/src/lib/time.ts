export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Vừa xong';

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const time = date.getTime();
  if (Number.isNaN(time)) return 'Vừa xong';

  const diffMs = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatClockTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
}
