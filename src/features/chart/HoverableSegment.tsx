import { Rectangle, type BarShapeProps } from 'recharts';
import { useHoverSelector } from '../dashboard/linkedHover';

interface HoverableSegmentProps extends BarShapeProps {
  seriesId: string;
}

/**
 * Bar segment shape that highlights itself from linked hover: the exact segment when the
 * chart is hovered, or the whole series when its row or legend entry is hovered.
 */
export function HoverableSegment({ seriesId, ...shapeProps }: HoverableSegmentProps) {
  const highlighted = useHoverSelector(
    (target) =>
      target?.nodeId === seriesId &&
      (target.monthIndex === null || target.monthIndex === shapeProps.index),
  );
  return (
    <Rectangle {...shapeProps} className={highlighted ? 'chart-segment-highlighted' : undefined} />
  );
}
