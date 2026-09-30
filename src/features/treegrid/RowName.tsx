import type { CSSProperties, MouseEvent } from 'react';
import { ChevronIcon } from '../../components/ChevronIcon';
import type { TreeNode } from '../../domain/clientTree';
import { getAdviserAvatar, getInitials } from './adviserAvatars';

interface RowNameProps {
  node: TreeNode;
  /** Undefined for leaves, which get neither a chevron nor an expanded state. */
  expanded: boolean | undefined;
  onChevronClick: (event: MouseEvent) => void;
}

/**
 * Indented name with disclosure chevron and, for advisers, an avatar. Leaves reserve the
 * chevron slot so names stay aligned with their siblings.
 */
export function RowName({ node, expanded, onChevronClick }: RowNameProps) {
  const indent = { '--tree-depth': node.depth - 1 } as CSSProperties;
  return (
    <span
      className="flex min-w-0 items-center gap-2 pl-[calc(var(--tree-depth)*var(--tree-indent))]"
      style={indent}
    >
      {expanded === undefined ? (
        <span className="size-4 shrink-0" />
      ) : (
        // Pointer-only affordance with a 32 px hit area; keyboard users use Enter/Right/Left.
        <span
          aria-hidden="true"
          data-testid="row-chevron"
          className="relative shrink-0 cursor-pointer before:absolute before:-inset-2"
          onClick={onChevronClick}
        >
          <ChevronIcon expanded={expanded} />
        </span>
      )}
      {node.level === 'adviser' && <Avatar nodeId={node.id} name={node.name} />}
      <span className="truncate" title={node.name}>
        {node.name}
      </span>
    </span>
  );
}

function Avatar({ nodeId, name }: { nodeId: string; name: string }) {
  const src = getAdviserAvatar(nodeId);
  const shape = 'size-5 shrink-0 rounded-full';
  if (src !== undefined) {
    return <img src={src} alt="" width={20} height={20} className={`${shape} object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${shape} grid place-items-center bg-chart-1 text-[9px] leading-none font-medium text-content-primary`}
    >
      {getInitials(name)}
    </span>
  );
}
