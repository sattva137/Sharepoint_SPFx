import { IOrgNode, IVisibleNode } from './GraphTypes';

export const BATCH_INCREMENT = 40;
export const DEFAULT_BATCH_SIZE = 40;
export const MAX_BATCH_SIZE = 200;

export class TreeBuilder {
  public static buildVisibleTree(rootId: string, nodeMap: Map<string, IOrgNode>): IVisibleNode | undefined {
    const root = nodeMap.get(rootId);
    if (!root) {
      return undefined;
    }

    return TreeBuilder.buildNode(root, nodeMap);
  }

  public static increaseBatch(node: IOrgNode): void {
    node.batchSize = Math.min(MAX_BATCH_SIZE, node.batchSize + BATCH_INCREMENT);
  }

  private static buildNode(current: IOrgNode, nodeMap: Map<string, IOrgNode>): IVisibleNode {
    const visibleChildren: IVisibleNode[] = [];

    if (current.expanded && current.directReportIds.length > 0) {
      const limit = Math.min(current.batchSize, current.directReportIds.length, MAX_BATCH_SIZE);
      const childIds = current.directReportIds.slice(0, limit);

      childIds.forEach((childId) => {
        const child = nodeMap.get(childId);
        if (child) {
          visibleChildren.push(TreeBuilder.buildNode(child, nodeMap));
        }
      });

      const remaining = current.directReportIds.length - childIds.length;
      if (remaining > 0) {
        visibleChildren.push({
          id: `${current.id}__more__${remaining}`,
          node: current,
          children: [],
          syntheticType: 'more',
          remainingCount: remaining
        });
      }
    }

    return {
      id: current.id,
      node: current,
      children: visibleChildren
    };
  }
}
