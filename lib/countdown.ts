export function advanceCountdown(current: number): { next: number; shouldStartQuestion: boolean } {
  if (current <= 0) {
    return { next: 0, shouldStartQuestion: true };
  }

  const next = current - 1;
  return {
    next,
    shouldStartQuestion: next <= 0,
  };
}
