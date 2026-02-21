import * as d3 from 'd3';
import * as React from 'react';
import { IVisibleNode } from '../graph/GraphTypes';

interface IOrgChartD3ViewProps {
  tree?: IVisibleNode;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onMoreClick: (parentId: string) => void;
  zoomResetToken: number;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 92;
const HORIZONTAL_SPACING = 260;
const VERTICAL_SPACING = 140;

export const OrgChartD3View: React.FC<IOrgChartD3ViewProps> = ({
  tree,
  onNodeClick,
  onNodeDoubleClick,
  onMoreClick,
  zoomResetToken
}) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const rootGroupRef = React.useRef<SVGGElement | null>(null);

  React.useEffect(() => {
    if (!svgRef.current || !rootGroupRef.current || !tree) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const rootGroup = d3.select(rootGroupRef.current);
    rootGroup.selectAll('*').remove();

    const hierarchy = d3.hierarchy(tree, (d) => d.children);
    const layout = d3.tree<IVisibleNode>().nodeSize([HORIZONTAL_SPACING, VERTICAL_SPACING]);
    const laidOut = layout(hierarchy);

    const allNodes = laidOut.descendants();
    const xValues = allNodes.map((n) => n.x);
    const yValues = allNodes.map((n) => n.y);

    const minX = Math.min(...xValues) - CARD_WIDTH;
    const maxX = Math.max(...xValues) + CARD_WIDTH;
    const minY = Math.min(...yValues) - 60;
    const maxY = Math.max(...yValues) + CARD_HEIGHT + 60;

    rootGroup.attr('transform', `translate(${-minX + 30},${-minY + 30})`);
    svg.attr('viewBox', `0 0 ${maxX - minX + 60} ${maxY - minY + 60}`);

    rootGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(laidOut.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#c8c8c8')
      .attr('stroke-width', 1.5)
      .attr('d', d3.linkVertical<d3.HierarchyPointLink<IVisibleNode>, d3.HierarchyPointNode<IVisibleNode>>()
        .x((d) => d.x)
        .y((d) => d.y + CARD_HEIGHT / 2)
      );

    const nodeGroups = rootGroup
      .append('g')
      .selectAll('g')
      .data(allNodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x - CARD_WIDTH / 2},${d.y})`)
      .style('cursor', 'pointer');

    nodeGroups
      .append('rect')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', CARD_WIDTH)
      .attr('height', CARD_HEIGHT)
      .attr('fill', (d) => (d.data.syntheticType === 'more' ? '#f3f8ff' : '#ffffff'))
      .attr('stroke', '#d0d7de')
      .attr('filter', 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.08))');

    nodeGroups
      .append('text')
      .attr('x', 12)
      .attr('y', 24)
      .attr('font-size', 14)
      .attr('font-weight', 600)
      .text((d) => (d.data.syntheticType === 'more' ? `+ ${d.data.remainingCount} more` : d.data.node.displayName));

    nodeGroups
      .filter((d) => d.data.syntheticType !== 'more')
      .append('text')
      .attr('x', 12)
      .attr('y', 48)
      .attr('font-size', 12)
      .attr('fill', '#605e5c')
      .text((d) => d.data.node.jobTitle || '');

    nodeGroups
      .filter((d) => d.data.syntheticType !== 'more')
      .append('text')
      .attr('x', 12)
      .attr('y', 68)
      .attr('font-size', 12)
      .attr('fill', '#605e5c')
      .text((d) => d.data.node.department || '');

    nodeGroups
      .filter((d) => d.data.syntheticType !== 'more')
      .append('text')
      .attr('x', CARD_WIDTH - 18)
      .attr('y', 24)
      .attr('font-size', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0078d4')
      .text((d) => {
        if (d.data.node.directReportIds.length > 0 || !d.data.node.loadedDirectReports) {
          return d.data.node.expanded ? '−' : '+';
        }
        return '';
      });

    nodeGroups.on('click', (_, d) => {
      if (d.data.syntheticType === 'more') {
        onMoreClick(d.data.node.id);
        return;
      }
      onNodeClick(d.data.id);
    });

    nodeGroups.on('dblclick', (_, d) => {
      if (d.data.syntheticType !== 'more') {
        onNodeDoubleClick(d.data.id);
      }
    });
  }, [tree, onNodeClick, onNodeDoubleClick, onMoreClick]);

  React.useEffect(() => {
    if (!svgRef.current || !rootGroupRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const root = d3.select(rootGroupRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2])
      .on('zoom', (event) => {
        root.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom as never);
  }, []);

  React.useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) {
      return;
    }

    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, [zoomResetToken]);

  return (
    <svg ref={svgRef} width='100%' height='100%' role='img' aria-label='Organization chart'>
      <g ref={rootGroupRef} />
    </svg>
  );
};
