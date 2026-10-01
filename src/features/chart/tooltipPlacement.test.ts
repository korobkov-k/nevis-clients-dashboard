import { describe, expect, it } from 'vitest';
import { placeTooltip } from './tooltipPlacement';

const bounds = { left: 0, top: 10, width: 1000, height: 320 };
const size = { width: 180, height: 100 };

describe('placeTooltip', () => {
  it('sits to the right of the bar, centred on its top', () => {
    expect(
      placeTooltip({ anchor: { barLeft: 100, barRight: 180, barTop: 200 }, size, bounds }),
    ).toEqual({ left: 188, top: 150 });
  });

  it('flips to the left of the bar near the right edge', () => {
    expect(
      placeTooltip({ anchor: { barLeft: 900, barRight: 980, barTop: 200 }, size, bounds }),
    ).toEqual({ left: 712, top: 150 });
  });

  it('stays inside the top boundary for tall bars', () => {
    expect(
      placeTooltip({ anchor: { barLeft: 100, barRight: 180, barTop: 12 }, size, bounds }).top,
    ).toBe(10);
  });

  it('stays close to the top of short bars without crossing the bottom boundary', () => {
    expect(
      placeTooltip({ anchor: { barLeft: 100, barRight: 180, barTop: 320 }, size, bounds }).top,
    ).toBe(230);
    expect(
      placeTooltip({ anchor: { barLeft: 100, barRight: 180, barTop: 250 }, size, bounds }).top,
    ).toBe(200);
  });

  it('clamps horizontally when neither side fits (narrow charts)', () => {
    const narrow = { left: 0, top: 0, width: 300, height: 320 };
    expect(
      placeTooltip({ anchor: { barLeft: 100, barRight: 140, barTop: 100 }, size, bounds: narrow })
        .left,
    ).toBe(0);
  });
});
