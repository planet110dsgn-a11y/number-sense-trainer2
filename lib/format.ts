export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsText = seconds.toFixed(1).padStart(4, '0');
  return `${String(minutes).padStart(2, '0')}:${secondsText}`;
}

export function formatDisplayType(type: 'sen' | 'mil' | 'M'): string {
  switch (type) {
    case 'sen':
      return '千円';
    case 'mil':
      return '百万円';
    case 'M':
      return 'M';
    default:
      return type;
  }
}

export function formatDisplayValue(value: number, type: 'sen' | 'mil' | 'M'): string {
  const amount = formatNumber(value);
  if (type === 'M') {
    return `${amount}M`;
  }

  return `${amount} ${formatDisplayType(type)}`;
}
