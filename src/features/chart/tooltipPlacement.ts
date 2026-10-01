export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TooltipAnchor {
  barLeft: number;
  barRight: number;
  /** Y coordinate of the top of the bar (or stack). */
  barTop: number;
}

export interface TooltipPlacementInput {
  anchor: TooltipAnchor;
  size: { width: number; height: number };
  /** Area the tooltip must stay inside, in the same coordinate space. */
  bounds: Rect;
  gap?: number;
}

/**
 * Places a tooltip beside its bar: to the right when it fits, otherwise to the left, and
 * vertically centred on the bar top so short bars keep it close. Both axes are clamped so the
 * tooltip never leaves `bounds`.
 */
export function placeTooltip({ anchor, size, bounds, gap = 8 }: TooltipPlacementInput): {
  left: number;
  top: number;
} {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max));

  const right = anchor.barRight + gap;
  const fitsRight = right + size.width <= bounds.left + bounds.width;
  const left = fitsRight ? right : anchor.barLeft - gap - size.width;

  return {
    left: clamp(left, bounds.left, bounds.left + bounds.width - size.width),
    top: clamp(
      anchor.barTop - size.height / 2,
      bounds.top,
      bounds.top + bounds.height - size.height,
    ),
  };
}
