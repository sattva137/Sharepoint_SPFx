import { DefaultButton, IconButton, SearchBox, Stack } from '@fluentui/react';
import * as React from 'react';
import styles from './OrgChart.module.scss';
import { OrgChartD3View } from './d3/OrgChartD3View';
import { GraphOrgService } from './graph/GraphOrgService';
import { IGraphUser, IOrgNode } from './graph/GraphTypes';
import { DEFAULT_BATCH_SIZE, TreeBuilder } from './graph/TreeBuilder';

export interface IOrgChartProps {
  graphService: GraphOrgService;
}

const createNode = (user: IGraphUser): IOrgNode => ({
  ...user,
  expanded: false,
  loadedDirectReports: false,
  hasMoreDirectReports: false,
  directReportIds: [],
  batchSize: DEFAULT_BATCH_SIZE
});

export const OrgChart: React.FC<IOrgChartProps> = ({ graphService }) => {
  const [nodeMap, setNodeMap] = React.useState<Map<string, IOrgNode>>(new Map());
  const [rootId, setRootId] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<IGraphUser[]>([]);
  const [zoomResetToken, setZoomResetToken] = React.useState(0);

  const upsertNode = React.useCallback((user: IGraphUser): void => {
    setNodeMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(user.id);
      next.set(user.id, existing ? { ...existing, ...user } : createNode(user));
      return next;
    });
  }, []);

  const ensureDirectReportsLoaded = React.useCallback(async (userId: string): Promise<void> => {
    const current = nodeMap.get(userId);
    if (current?.loadedDirectReports) {
      return;
    }

    const reports = await graphService.getDirectReports(userId);
    setNodeMap((prev) => {
      const next = new Map(prev);
      const parent = next.get(userId);
      if (!parent) {
        return prev;
      }

      reports.forEach((report) => {
        const existing = next.get(report.id);
        next.set(report.id, existing ? { ...existing, ...report } : createNode(report));
      });

      next.set(userId, {
        ...parent,
        loadedDirectReports: true,
        directReportIds: reports.map((r) => r.id),
        hasMoreDirectReports: reports.length >= DEFAULT_BATCH_SIZE
      });

      return next;
    });
  }, [graphService, nodeMap]);

  const initialize = React.useCallback(async () => {
    const me = await graphService.getCurrentUser();
    setNodeMap(new Map([[me.id, { ...createNode(me), expanded: true }]]));
    setRootId(me.id);
    await ensureDirectReportsLoaded(me.id);
  }, [graphService, ensureDirectReportsLoaded]);

  React.useEffect(() => {
    initialize().catch(() => undefined);
  }, [initialize]);

  const onNodeClick = React.useCallback(async (nodeId: string) => {
    await ensureDirectReportsLoaded(nodeId);
    setNodeMap((prev) => {
      const next = new Map(prev);
      const target = next.get(nodeId);
      if (!target) {
        return prev;
      }

      next.set(nodeId, { ...target, expanded: !target.expanded });
      return next;
    });
  }, [ensureDirectReportsLoaded]);

  const onNodeDoubleClick = React.useCallback(async (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) {
      const user = await graphService.getUserById(nodeId);
      upsertNode(user);
    }

    setRootId(nodeId);
    setZoomResetToken((v) => v + 1);
    await ensureDirectReportsLoaded(nodeId);
  }, [ensureDirectReportsLoaded, graphService, nodeMap, upsertNode]);

  const onMoreClick = React.useCallback((parentId: string) => {
    setNodeMap((prev) => {
      const next = new Map(prev);
      const parent = next.get(parentId);
      if (!parent) {
        return prev;
      }

      TreeBuilder.increaseBatch(parent);
      next.set(parentId, { ...parent });
      return next;
    });
  }, []);

  const onSearch = React.useCallback(async (_?: unknown, value?: string): Promise<void> => {
    if (!value) {
      setSearchResults([]);
      return;
    }
    const found = await graphService.searchUsers(value);
    setSearchResults(found);
  }, [graphService]);

  const visibleTree = React.useMemo(() => TreeBuilder.buildVisibleTree(rootId, nodeMap), [nodeMap, rootId]);

  return (
    <div className={styles.orgChart}>
      <Stack horizontal wrap tokens={{ childrenGap: 8 }} className={styles.toolbar}>
        <SearchBox placeholder='Search people' onChange={onSearch} />
        {searchResults.slice(0, 5).map((person) => (
          <DefaultButton key={person.id} text={person.displayName} onClick={() => onNodeDoubleClick(person.id)} />
        ))}
        <DefaultButton text='Reset to me' onClick={() => initialize().catch(() => undefined)} />
        <IconButton iconProps={{ iconName: 'Zoom' }} title='Zoom reset' onClick={() => setZoomResetToken((v) => v + 1)} />
      </Stack>

      <div className={styles.canvas}>
        <OrgChartD3View
          tree={visibleTree}
          onNodeClick={(id) => void onNodeClick(id)}
          onNodeDoubleClick={(id) => void onNodeDoubleClick(id)}
          onMoreClick={onMoreClick}
          zoomResetToken={zoomResetToken}
        />
      </div>
    </div>
  );
};
