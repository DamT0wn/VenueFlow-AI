import { describe, expect, it } from 'vitest';
import {
  COLOR_DANGER,
  COLOR_SUCCESS,
  COLOR_WARNING,
  DENSITY_HIGH_THRESHOLD,
  DENSITY_MEDIUM_THRESHOLD,
  densityColor,
  densityLabel,
  DEFAULT_VENUE_ID,
  DEFAULT_VENUE_NAME,
  TOUCH_TARGET_PX,
} from '../../lib/constants';

describe('constants helpers', () => {
  it('uses expected thresholds and defaults', () => {
    expect(DENSITY_HIGH_THRESHOLD).toBe(80);
    expect(DENSITY_MEDIUM_THRESHOLD).toBe(50);
    expect(DEFAULT_VENUE_ID).toBe('venue-chinnaswamy');
    expect(DEFAULT_VENUE_NAME).toContain('Chinnaswamy');
    expect(TOUCH_TARGET_PX).toBe(44);
  });

  it('returns correct density color', () => {
    expect(densityColor(90)).toBe(COLOR_DANGER);
    expect(densityColor(60)).toBe(COLOR_WARNING);
    expect(densityColor(20)).toBe(COLOR_SUCCESS);
  });

  it('returns correct density label', () => {
    expect(densityLabel(100)).toBe('High');
    expect(densityLabel(55)).toBe('Medium');
    expect(densityLabel(0)).toBe('Low');
  });
});
