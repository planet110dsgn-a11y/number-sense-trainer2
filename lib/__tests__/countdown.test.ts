import { describe, expect, it } from 'vitest';
import { advanceCountdown } from '../countdown';

describe('advanceCountdown', () => {
  it('counts down to zero and signals the next phase', () => {
    expect(advanceCountdown(3)).toEqual({ next: 2, shouldStartQuestion: false });
    expect(advanceCountdown(2)).toEqual({ next: 1, shouldStartQuestion: false });
    expect(advanceCountdown(1)).toEqual({ next: 0, shouldStartQuestion: true });
    expect(advanceCountdown(0)).toEqual({ next: 0, shouldStartQuestion: true });
  });
});
