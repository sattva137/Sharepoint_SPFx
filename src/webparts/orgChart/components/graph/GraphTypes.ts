export interface IGraphUser {
  id: string;
  displayName: string;
  jobTitle?: string;
  department?: string;
  mail?: string;
  userPrincipalName?: string;
}

export interface IGraphListResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

export interface IOrgNode extends IGraphUser {
  expanded: boolean;
  loadedDirectReports: boolean;
  hasMoreDirectReports: boolean;
  directReportIds: string[];
  batchSize: number;
}

export interface IVisibleNode {
  id: string;
  node: IOrgNode;
  children: IVisibleNode[];
  syntheticType?: 'more';
  remainingCount?: number;
}
