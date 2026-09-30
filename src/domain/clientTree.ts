import type { ClientNodeBase, ClientsResponse } from '../../shared/clientsContract';

export type NodeLevel = 'company' | 'branch' | 'adviser' | 'channel';

const LEVELS: readonly NodeLevel[] = ['company', 'branch', 'adviser', 'channel'];

/** A source node with its position in the hierarchy. Values are the untouched source array. */
export interface TreeNode {
  id: string;
  name: string;
  level: NodeLevel;
  /** 1-based depth, matching `aria-level`. */
  depth: number;
  values: readonly number[];
  parentId: string | null;
  childIds: readonly string[];
  /** 0-based position among siblings in source order. */
  siblingIndex: number;
  siblingCount: number;
}

export interface ClientTree {
  rootId: string;
  nodes: ReadonlyMap<string, TreeNode>;
}

type SourceNode = ClientNodeBase & {
  branches?: SourceNode[];
  employees?: SourceNode[];
  channels?: SourceNode[];
};

function getSourceChildren(node: SourceNode, level: NodeLevel): readonly SourceNode[] {
  switch (level) {
    case 'company':
      return node.branches ?? [];
    case 'branch':
      return node.employees ?? [];
    case 'adviser':
      return node.channels ?? [];
    case 'channel':
      return [];
  }
}

/** Indexes the source tree by ID without copying, reconciling or reordering values. */
export function buildClientTree(root: ClientsResponse): ClientTree {
  const nodes = new Map<string, TreeNode>();

  const visit = (
    source: SourceNode,
    depth: number,
    parentId: string | null,
    siblingIndex: number,
    siblingCount: number,
  ) => {
    const level = LEVELS[depth - 1] ?? 'channel';
    const children = getSourceChildren(source, level);
    nodes.set(source.id, {
      id: source.id,
      name: source.name,
      level,
      depth,
      values: source.values,
      parentId,
      childIds: children.map((child) => child.id),
      siblingIndex,
      siblingCount,
    });
    children.forEach((child, index) => {
      visit(child, depth + 1, source.id, index, children.length);
    });
  };

  visit(root, 1, null, 0, 1);
  return { rootId: root.id, nodes };
}

export function getNode(tree: ClientTree, id: string): TreeNode {
  const node = tree.nodes.get(id);
  if (node === undefined) throw new Error(`Unknown node "${id}"`);
  return node;
}

export function hasChildren(node: TreeNode): boolean {
  return node.childIds.length > 0;
}

/** Nodes from the root down to and including `id`. */
export function getPath(tree: ClientTree, id: string): TreeNode[] {
  const path: TreeNode[] = [];
  for (let node: TreeNode | undefined = getNode(tree, id); node;) {
    path.unshift(node);
    node = node.parentId === null ? undefined : getNode(tree, node.parentId);
  }
  return path;
}

export function getAncestorIds(tree: ClientTree, id: string): string[] {
  return getPath(tree, id)
    .slice(0, -1)
    .map((node) => node.id);
}

export function isDescendantOf(tree: ClientTree, id: string, ancestorId: string): boolean {
  return id !== ancestorId && getAncestorIds(tree, id).includes(ancestorId);
}
