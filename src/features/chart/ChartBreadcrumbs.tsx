import { Fragment, type MouseEvent } from 'react';
import type { ChartModel } from '../../domain/chartModel';
import { useHoverActions } from '../dashboard/linkedHover';

interface ChartBreadcrumbsProps {
  path: ChartModel['path'];
  onSelect: (nodeId: string, event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The chart scope as a path. Ancestors are buttons that drill back up to that node; the
 * current node is plain text. Rendered inside the chart heading, so the heading's accessible
 * name stays the full path.
 */
export function ChartBreadcrumbs({ path, onSelect }: ChartBreadcrumbsProps) {
  const { hover, unhover } = useHoverActions();
  return path.map((node, index) => {
    const isCurrent = index === path.length - 1;
    return (
      <Fragment key={node.id}>
        {index > 0 && (
          <>
            {' '}
            <span className="text-content-secondary">/</span>{' '}
          </>
        )}
        {isCurrent ? (
          <span>{node.name}</span>
        ) : (
          <button
            type="button"
            className="rounded-[4px] text-content-secondary underline-offset-2 hover:text-content-primary hover:underline"
            onClick={(event) => {
              unhover(node.id);
              onSelect(node.id, event);
            }}
            onMouseEnter={() => {
              hover(node.id);
            }}
            onMouseLeave={() => {
              unhover(node.id);
            }}
          >
            {node.name}
          </button>
        )}
      </Fragment>
    );
  });
}
