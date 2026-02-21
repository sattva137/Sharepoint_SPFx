import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IGraphListResponse, IGraphUser } from './GraphTypes';

const USER_SELECT = 'id,displayName,jobTitle,department,mail,userPrincipalName';

export class GraphOrgService {
  public constructor(private readonly graphClient: MSGraphClientV3) {}

  public async getCurrentUser(): Promise<IGraphUser> {
    return this.graphClient.api('/me').select(USER_SELECT).get() as Promise<IGraphUser>;
  }

  public async getUserById(userId: string): Promise<IGraphUser> {
    return this.graphClient.api(`/users/${encodeURIComponent(userId)}`).select(USER_SELECT).get() as Promise<IGraphUser>;
  }

  public async searchUsers(query: string): Promise<IGraphUser[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = (await this.graphClient
        .api('/users')
        .header('ConsistencyLevel', 'eventual')
        .search(`\"displayName:${query}\"`)
        .top(8)
        .select(USER_SELECT)
        .count(true)
        .get()) as IGraphListResponse<IGraphUser>;

      return response.value || [];
    } catch {
      const fallbackResponse = (await this.graphClient
        .api('/users')
        .filter(`startswith(displayName,'${query.replace(/'/g, "''")}')`)
        .top(8)
        .select(USER_SELECT)
        .get()) as IGraphListResponse<IGraphUser>;

      return fallbackResponse.value || [];
    }
  }

  public async getDirectReports(userId: string): Promise<IGraphUser[]> {
    let requestUrl = `/users/${encodeURIComponent(userId)}/directReports?$select=${USER_SELECT}`;
    const users: IGraphUser[] = [];

    while (requestUrl) {
      const response = (await this.graphClient.api(requestUrl).get()) as IGraphListResponse<unknown>;
      users.push(...(response.value || []).filter(GraphOrgService.isGraphUser));
      requestUrl = response['@odata.nextLink'] || '';
    }

    return users;
  }

  private static isGraphUser(item: unknown): item is IGraphUser {
    const candidate = item as { id?: unknown; displayName?: unknown };
    return !!candidate && typeof candidate.id === 'string' && typeof candidate.displayName === 'string';
  }
}
