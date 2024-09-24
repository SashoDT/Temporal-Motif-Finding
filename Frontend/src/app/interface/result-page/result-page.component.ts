import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import * as d3 from 'd3';
import {GraphLink, GraphNode, MotifGraphLink, MotifGraphNode} from "../../dtos/graph-dtos";
import { InterfaceService } from "../../service/interface.service";
import { HttpClientModule } from "@angular/common/http";
import { MatSlider, MatSliderRangeThumb } from "@angular/material/slider";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-result-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HttpClientModule,
    MatSlider,
    FormsModule,
    MatSliderRangeThumb,
    NgIf
  ],
  templateUrl: './result-page.component.html',
  styleUrls: ['./result-page.component.css']
})
export class ResultPageComponent implements OnInit {
  private svg: any;
  private motifSvg: any;
  private width = 1200;
  private height = 600;
  private simulationInstance: any;
  private graphZoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  showMotif = true;


  searchData: any;
  private wholeGraphNodes: GraphNode[] = [];
  private wholeGraphLinks: GraphLink[] = [];
  private motifNodes: Set<string> = new Set();
  private motifLinks: GraphLink[] = [];
  private staticMotifNodes: MotifGraphNode[] = [];
  private staticMotifLinks: MotifGraphLink[] = [];

  sliderValue: number[] = [1950, 2023];
  protected lowerYear;
  protected upperYear;

  constructor(private service: InterfaceService, private router: Router, private route: ActivatedRoute) {
    this.searchData = history.state.data;
    this.staticMotifNodes = history.state.motifNodes;
    this.staticMotifLinks = history.state.motifLinks;
    this.lowerYear = history.state.startYear;
    this.upperYear = history.state.endYear;
    this.graphZoom = d3.zoom<SVGSVGElement, unknown>();

    this.sliderValue = [this.lowerYear, this.upperYear];
  }

  ngOnInit() {
    this.createSvg();
    this.initializeMotifs();
    this.fetchWholeGraphData();
    this.drawStaticMotif();
  }

  private createSvg(): void {
    this.svg = d3.select('div#wholeGraphContainer')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .style('border', '1px solid black');

    this.motifSvg = d3.select('div#templateMotif')
      .append('svg')
      .attr('width', 250)
      .attr('height', 250)
      .append('g');

    this.graphZoom
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([0.1, 10])
      .on('zoom', this.zoomGraph.bind(this));

    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    this.svg?.call(this.graphZoom);
  }

  private deleteSvg(): void {
    d3.select('div#wholeGraphContainer').select('svg').remove();
  }


  private initializeMotifs(): void {
    if (this.searchData) {
      const uniqueNodes = new Map<string, GraphNode>();
      const uniqueLinks = new Set<string>();

      for (const data of this.searchData) {
        if (data.graphData) {
          const nodes = data.graphData.nodes;
          const links = data.graphData.links;

          nodes.forEach((node: GraphNode) => {
            uniqueNodes.set(node.id, node);
          });

          links.forEach((link: GraphLink) => {
            const sourceExists = uniqueNodes.has(link.source);
            const targetExists = uniqueNodes.has(link.target);

            if (sourceExists && targetExists) {
              const linkKey = `${link.source}-${link.target}-${link.type}`;
              if (!uniqueLinks.has(linkKey)) {
                uniqueLinks.add(linkKey);
                this.motifLinks.push(link);
              }
            }
          });
        }
      }
      this.motifNodes = new Set(uniqueNodes.keys());
    } else {
      console.error('No search data found');
    }
  }

  private reinitializeMotifs(response: any): void {
      const uniqueNodes = new Map<string, GraphNode>();
      const uniqueLinks = new Set<string>();
      this.motifLinks = [];
      for (const data of response) {
        if (data.graphData) {
          const nodes = data.graphData.nodes;
          const links = data.graphData.links;

          nodes.forEach((node: GraphNode) => {
            uniqueNodes.set(node.id, node);
          });

          links.forEach((link: GraphLink) => {
            const sourceExists = uniqueNodes.has(link.source);
            const targetExists = uniqueNodes.has(link.target);

            if (sourceExists && targetExists) {
              const linkKey = `${link.source}-${link.target}-${link.type}`;
              if (!uniqueLinks.has(linkKey)) {
                uniqueLinks.add(linkKey);
                this.motifLinks.push(link);
              }
            }
          });
        }
      }
      this.motifNodes = new Set(uniqueNodes.keys());
      console.log('New Nodes: ' + this.motifNodes);
      console.log('New Links: ' + this.motifLinks);
  }

  private fetchWholeGraphData(): void {
    this.service.getGraph().subscribe(
      (response: any) => {
        this.wholeGraphNodes = response.nodes;
        const nodeIds = new Set(this.wholeGraphNodes.map(node => node.id));

        this.wholeGraphLinks = response.links.filter((link: GraphLink) => {
          const sourceExists = nodeIds.has(link.source);
          const targetExists = nodeIds.has(link.target);
          return sourceExists && targetExists;
        });

        this.drawWholeGraph(this.svg, this.wholeGraphNodes, this.wholeGraphLinks);
      },
      (error) => {
        console.error('Error fetching graph data:', error);
      }
    );
  }

  private drawStaticMotif(): void {
    const nodeRadius = 10;

    // Clear previous drawings in motifSvg
    this.motifSvg.selectAll('*').remove();

    // Set the desired offsets to position the motif in the top-right corner
    const xOffset = 0; // Adjust as needed for your layout
    const yOffset = 0;  // Adjust as needed for your layout
    const scaleFactor = 0.5; // Scaling factor to fit the motif better

    const combinedMotifLinks = this.staticMotifLinks.reduce((acc: any[], link) => {
      const existingLink = acc.find(l => l.source === link.source && l.target === link.target);

      if (existingLink) {
        // Combine types if there's an existing link between the same source and target
        existingLink.types.push(link.type);
      } else {
        // Add a new entry if no existing link is found
        acc.push({
          source: link.source,
          target: link.target,
          types: [link.type],
        });
      }

      return acc;
    }, []);

    // Draw the links
    this.motifSvg.append('g')
      .selectAll('line')
      .data(combinedMotifLinks)
      .enter()
      .append('line')
      // @ts-ignore
      .attr('x1', (d: MotifGraphLink) => d.source.x * scaleFactor + xOffset)
      // @ts-ignore
      .attr('y1', (d: MotifGraphLink) => d.source.y * scaleFactor + yOffset)
      // @ts-ignore
      .attr('x2', (d: MotifGraphLink) => d.target.x * scaleFactor + xOffset)
      // @ts-ignore
      .attr('y2', (d: MotifGraphLink) => d.target.y * scaleFactor + yOffset)
      .attr('stroke', 'black')
      .style('opacity', '0.6')
      .attr('stroke-width', 2);

    const linkText = this.motifSvg.selectAll('.link-text')
      .data(combinedMotifLinks)
      .enter()
      .append('text')
      .attr('class', 'link-text')
      .attr('text-anchor', 'middle')
      .attr('x', (d: any) => ((d.source.x + d.target.x) / 2) * scaleFactor + xOffset)
      .attr('y', (d: any) => ((d.source.y + d.target.y) / 2) * scaleFactor + yOffset)
      .text((d: any) => d.types.join(', '));

    // Draw the nodes
    this.motifSvg.append('g')
      .selectAll('circle')
      .data(this.staticMotifNodes)
      .enter()
      .append('circle')
      // @ts-ignore
      .attr('cx', (d: MotifGraphNode) => d.x * scaleFactor + xOffset)
      // @ts-ignore
      .attr('cy', (d: MotifGraphNode) => d.y * scaleFactor + yOffset)
      .attr('r', nodeRadius)
      .attr('fill', (d: MotifGraphNode) => d.type === 'Person' ? '#69b3a2' : '#ffab00');

    // Add labels to the nodes
    this.motifSvg.append('g')
      .selectAll('text')
      .data(this.staticMotifNodes)
      .enter()
      .append('text')
      // @ts-ignore
      .attr('x', (d: MotifGraphNode) => d.x * scaleFactor + xOffset)
      // @ts-ignore
      .attr('y', (d: MotifGraphNode) => d.y * scaleFactor + yOffset - 15) // Adjust to avoid overlap
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text((d: MotifGraphNode) => d.type); // Update with relevant property
  }


  // Method to toggle the visibility of the motif SVG
  toggleMotifVisibility(): void {
    this.showMotif = !this.showMotif;
  }

  private drawWholeGraph(svg: any, nodes: GraphNode[], links: GraphLink[]): void {

    const nodeIdMap = new Map(this.wholeGraphNodes.map(node => [node.id, node]));
    // Group the links by source and target while preserving individual links
    const groupedLinks = d3.group(this.wholeGraphLinks, d => `${d.source}-${d.target}`);

    const combinedLinks = Array.from(groupedLinks, ([key, links]) => {
      return {
        source: links[0].source,
        target: links[0].target,
        types: links.map(link => link.type).join(', '), // Combine all types into a single string
        individualLinks: links // Keep reference to all individual links
      };
    });

    const linkGroup = this.svg.append('g')
      .attr('class', 'links');

// Create link elements based on the combined links
    const linkElements = linkGroup.selectAll('.whole-link-group')
      .data(combinedLinks)
      .enter()
      .append('g')
      .attr('class', 'whole-link-group');

    linkElements.append('line')
      .attr('class', 'whole-link')
      .style('stroke', 'black')
      .style('opacity', (d: any) => {
        // Check if any of the individual links are in the motifLinks
        // @ts-ignore
        const isInMotif = d.individualLinks.some(link =>
          this.motifLinks.some(motifLink =>
            motifLink.source === link.source &&
            motifLink.target === link.target &&
            motifLink.type === link.type
          )
        );
        return isInMotif ? 0.8 : 0.2;
      })
      .style('stroke-width', 1);


// Append the background rectangles first (ensure they are drawn behind the text)
    linkElements.append('rect')
      .attr('class', 'whole-link-text-bg')
      .attr('fill', 'rgb(105, 179, 162)')
      .attr('stroke', 'black')
      .style('visibility', 'hidden'); // Hide initially

// Add the text labels on top of the rectangles
    const textLabels = linkElements.append('text')
      .attr('class', 'whole-link-text')
      .attr('text-anchor', 'middle')
      .style('visibility', 'hidden')
      .style('font-size', '10px')
      .style('fill', 'white')
      .text((d: any) => d.types); // Display the combined types

// Adjust rectangle size based on text bounding box
    textLabels.each(function (this: SVGTextElement) {
      const bbox = this.getBBox(); // Get the bounding box of the text

      const parentNode = this.parentNode as SVGGElement | null;
      if (parentNode) {
        const rect = d3.select(parentNode).select<SVGRectElement>('rect.whole-link-text-bg');
        rect
          .attr('x', bbox.x)  // Adjust the x position for padding
          .attr('y', bbox.y)  // Adjust the y position for padding
          .attr('width', bbox.width)  // Adjust the width for padding
          .attr('height', bbox.height);  // Adjust the height for padding
      }
    });

// Handle mouseover and mouseout events to show/hide text and background
    linkElements
      .on('mouseover', (event: MouseEvent) => {
        const target = event.currentTarget as SVGGElement;
        d3.select(target).select('.whole-link-text')
          .style('visibility', 'visible');
        d3.select(target).select('.whole-link-text-bg')
          .style('visibility', 'visible');
      })
      .on('mouseout', (event: MouseEvent) => {
        const target = event.currentTarget as SVGGElement;
        d3.select(target).select('.whole-link-text')
          .style('visibility', 'hidden');
        d3.select(target).select('.whole-link-text-bg')
          .style('visibility', 'hidden');
      });



    const node = this.svg.selectAll('.whole-node')
      .data(this.wholeGraphNodes)
      .enter()
      .append('g')
      .attr('class', 'whole-node')
      .on('click', (event: MouseEvent, d: GraphNode) => this.onNodeLeftClick(event, d))
      .call(d3.drag<Element, GraphNode>()
        .on('start', (event: any, d: GraphNode) => this.dragstarted(event, d))
        .on('drag', (event: any, d: GraphNode) => this.dragged(event, d))
        .on('end', (event: any, d: GraphNode) => this.dragended(event, d)));

    node.append('circle')
      .attr('r', 5)
      .style('opacity', (d: GraphNode) => this.motifNodes.has(d.id) ? 1 : 0.2)
      .style('fill', (d: GraphNode) => this.getNodeColor(d));

    node.append('text')
      .attr('dy', -3)
      .attr('x', 12)
      .style('font-size', '10px')
      .style('opacity', (d: GraphNode) => this.motifNodes.has(d.id) ? 1 : 0.4)
      .text((d: GraphNode) => {
        if (d.type === 'Person') {
          return d.properties.name;
        } else if (d.type === 'Movie') {
          // @ts-ignore
          return d.properties.title;
        } else {
          return '';
        }
      });

    this.simulationWholeGraph(this.wholeGraphNodes, this.wholeGraphLinks);
  }


  private getNodeColor(node: GraphNode): string {
    //return this.motifNodes.has(node.id) ? '#ff0000' : (node.type === 'Person' ? '#69b3a2' : '#ffab00');
    return node.type === 'Person' ? '#69b3a2' : '#ffab00';
  }

  private getMotifNodeColor(s: string): string {
    return s === 'Person' ? '#69b3a2' : '#ffab00';
  }

  private simulationWholeGraph(nodes: GraphNode[], links: GraphLink[]): void {
    const boundaryMargin = 20;

    if (!this.simulationInstance) {
      const nodeIdMap = new Map(this.wholeGraphNodes.map(node => [node.id, node]));
      const transformedLinks: GraphLink[] = links.map(link => ({
        source: link.source,
        target: link.target,
        type: link.type || '',
        properties: link.properties || {}
      }));

      this.simulationInstance = d3.forceSimulation(this.wholeGraphNodes)
        .force('whole-link', d3.forceLink<GraphNode, GraphLink>(transformedLinks)
          .id((d: GraphNode) => d.id)
          .distance(50))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(1200 / 2, 600 / 2))
        .alpha(1)
        .on('tick', () => {
          this.updateWholeSimulation();
        });

      this.simulationInstance.nodes(this.wholeGraphNodes).on('tick', () => {
        this.svg.selectAll('.whole-node')
          .attr('transform', (d: GraphNode) => {
            //d.x = Math.max(boundaryMargin, Math.min(1200 - boundaryMargin, d.x || 0));
            //d.y = Math.max(boundaryMargin, Math.min(this.height - boundaryMargin, d.y || 0));
            return `translate(${d.x}, ${d.y})`;
          });

        /*this.svg.selectAll('.whole-link')
          .attr('x1', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            return sourceNode ? sourceNode.x : 0; // Default to 0 if node is not found
          })
          .attr('y1', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            return sourceNode ? sourceNode.y : 0; // Default to 0 if node is not found
          })
          .attr('x2', (d: GraphLink) => {
            const targetNode = nodeIdMap.get(d.target);
            return targetNode ? targetNode.x : 0; // Default to 0 if node is not found
          })
          .attr('y2', (d: GraphLink) => {
            const targetNode = nodeIdMap.get(d.target);
            return targetNode ? targetNode.y : 0; // Default to 0 if node is not found
          });

        this.svg.selectAll('.whole-link-text-bg')
          .style('opacity', 0.8)
          .attr('x', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            const targetNode = nodeIdMap.get(d.target);
            if (sourceNode && targetNode) {
              // @ts-ignore
              return (sourceNode.x + targetNode.x) / 2;
            }
            return 0;
          })
          .attr('y', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            const targetNode = nodeIdMap.get(d.target);
            if (sourceNode && targetNode) {
              // @ts-ignore
              return (sourceNode.y + targetNode.y) / 2;
            }
            return 0;
          });


        this.svg.selectAll('.whole-link-text')
          .style('font-size', '7px')
          .style('opacity', 0.8)
          .attr('x', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            const targetNode = nodeIdMap.get(d.target);
            if (sourceNode && targetNode) {
              // @ts-ignore
              return (sourceNode.x + targetNode.x) / 2;
            }
            return 0;
          })
          .attr('y', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            const targetNode = nodeIdMap.get(d.target);
            if (sourceNode && targetNode) {
              // @ts-ignore
              return (sourceNode.y + targetNode.y) / 2;
            }
            return 0;
          });*/
        this.svg.selectAll('.whole-link')
          .attr('x1', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            return sourceNode ? sourceNode.x : 0;
          })
          .attr('y1', (d: GraphLink) => {
            const sourceNode = nodeIdMap.get(d.source);
            return sourceNode ? sourceNode.y : 0;
          })
          .attr('x2', (d: GraphLink) => {
            const targetNode = nodeIdMap.get(d.target);
            return targetNode ? targetNode.x : 0;
          })
          .attr('y2', (d: GraphLink) => {
            const targetNode = nodeIdMap.get(d.target);
            return targetNode ? targetNode.y : 0;
          });

        // Update rectangles and text labels
        const linkElements = this.svg.selectAll('.whole-link-group');

        linkElements.each(function (this: SVGGElement, d: any) {
          const textElement = d3.select(this).select('.whole-link-text');

          // Ensure textElement.node() is not null and type it as SVGGraphicsElement
          const textNode = textElement.node() as SVGGraphicsElement | null;
          if (textNode) {
            const bbox = textNode.getBBox(); // Bounding box of the text

            // Update rectangle position and size
            d3.select(this).select('.whole-link-text-bg')
              .attr('x', bbox.x)  // Adjust x position for padding
              .attr('y', bbox.y)  // Adjust y position for padding
              .attr('width', bbox.width)  // Adjust width for padding
              .attr('height', bbox.height);  // Adjust height for padding

            // Update text position
            textElement
              //@ts-ignore
              .attr('x', (d: GraphLink) => {
                const sourceNode = nodeIdMap.get(d.source);
                const targetNode = nodeIdMap.get(d.target);
                if (sourceNode && targetNode) {
                  //@ts-ignore
                  return (sourceNode.x + targetNode.x) / 2;
                }
                return 0;
              })
              //@ts-ignore
              .attr('y', (d: GraphLink) => {
                const sourceNode = nodeIdMap.get(d.source);
                const targetNode = nodeIdMap.get(d.target);
                if (sourceNode && targetNode) {
                  //@ts-ignore
                  return (sourceNode.y + targetNode.y) / 2;
                }
                return 0;
              });
          }
        });
      });
    } else {
      this.simulationInstance.nodes(nodes);
      this.simulationInstance.force('whole-link').links(links);
      this.simulationInstance.alpha(1).restart();
    }
  }

  private updateGraphOpacity(): void {
    // Update link opacity
    this.svg.selectAll('.whole-link-group .whole-link')
      .style('opacity', (d: any) => {
        // Check if any of the individual links in this group match a motif link
        const isInMotif = d.individualLinks.some((link: GraphLink) =>
          this.motifLinks.some(motifLink =>
            motifLink.source === link.source &&
            motifLink.target === link.target &&
            motifLink.type === link.type
          )
        );
        return isInMotif ? 0.8 : 0.2;
      });

    // Update node opacity
    this.svg.selectAll('.whole-node circle')
      .style('opacity', (d: GraphNode) => this.motifNodes.has(d.id) ? 1 : 0.2);

    this.svg.selectAll('.whole-node text')
      .style('opacity', (d: GraphNode) => this.motifNodes.has(d.id) ? 1 : 0.4);
  }


  onSliderChange(event: any): void {
    console.log('Slider value changed:', this.sliderValue);
    this.lowerYear = this.sliderValue[0];
    this.upperYear = this.sliderValue[1];

    // Make the request to get the updated results
    this.service.getResults(this.staticMotifNodes, this.staticMotifLinks, this.lowerYear, this.upperYear)
      .subscribe(
        (response: any) => {
          this.reinitializeMotifs(response);
          this.updateGraphOpacity();
        },
        (error) => {
          console.error('Error fetching updated graph data:', error);
        }
      );
  }

  formatLabel(value: number): string {
    return value.toString();
  }

  private dragstarted(event: any, d: any): void {
    if (!event.active) {
      this.simulationInstance.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: any, d: any): void {
    if (!event.active) {
      this.simulationInstance.alphaTarget(0);
    }
    d.fx = d.x;
    d.fy = d.y;
    d.vx = 0; // Set velocity to zero
    d.vy = 0; // Set velocity to zero
  }

  private zoomGraph($event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
    if (!$event.transform) return;

    this.svg?.attr('transform', `${$event.transform}`);
  }

  private updateWholeSimulation() {
    this.simulationInstance
      .nodes(this.wholeGraphNodes)
      .force('whole-link', d3.forceLink<GraphNode, GraphLink>(this.wholeGraphLinks).id((d: GraphNode) => d.id).distance(50))
      .alpha(1)
      .restart();
  }

  private onNodeLeftClick(event: MouseEvent, node: GraphNode): void {
    let message = '';

    if (node.type === 'Person') {
      message = `Clicked on the person "${node.properties.name}". This person was born in the year ${node.properties.born}.`;
    } else if (node.type === 'Movie') {
      //@ts-ignore
      message = `Clicked on the movie "${node.properties.title}", released in ${node.properties.released}, with the following tagline: ${node.properties.tagline}.`;
    } else {
      message = `Clicked on node: ${node.type}`;
    }

    alert(message);
  }
}





