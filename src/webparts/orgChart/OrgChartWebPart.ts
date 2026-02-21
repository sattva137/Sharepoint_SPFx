import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';

import { OrgChart } from './components/OrgChart';
import { GraphOrgService } from './components/graph/GraphOrgService';

export default class OrgChartWebPart extends BaseClientSideWebPart<Record<string, never>> {
  private graphService?: GraphOrgService;

  public async onInit(): Promise<void> {
    await super.onInit();
    const client: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
    this.graphService = new GraphOrgService(client);
  }

  public render(): void {
    if (!this.graphService) {
      return;
    }

    ReactDom.render(React.createElement(OrgChart, { graphService: this.graphService }), this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
