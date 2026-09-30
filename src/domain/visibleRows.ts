import { getPath, hasChildren, type ClientTree, type TreeNode } from './clientTree';

/** Depth-first list of nodes whose ancestors are all expanded, in source order. */
export function getVisibleRows(tree: ClientTree, expandedIds: ReadonlySet<string>): TreeNode[] {
  const rows: TreeNode[] = [];
  const visit = (id: string) => {
    const node = tree.nodes.get(id);
    if (node === undefined) return;
    rows.push(node);
    if (hasChildren(node) && expandedIds.has(id)) node.childIds.forEach(visit);
  };
  visit(tree.rootId);
  return rows;
}

/** The node itself when visible, otherwise its closest ancestor that is. */
export function getNearestVisibleId(
  tree: ClientTree,
  expandedIds: ReadonlySet<string>,
  id: string,
): string {
  const path = getPath(tree, id);
  const collapsedIndex = path.findIndex(
    (node, index) => index < path.length - 1 && !expandedIds.has(node.id),
  );
  return (collapsedIndex === -1 ? path.at(-1) : path[collapsedIndex])?.id ?? tree.rootId;
}
