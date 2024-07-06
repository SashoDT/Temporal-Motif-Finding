import {Component, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import {D3DragEvent} from 'd3';
import {FormsModule} from '@angular/forms';
import {NgIf} from "@angular/common";
import {GraphNode, GraphLink} from "../dtos/graph-models";
import {InterfaceService} from "../service/interface.service";
import {HttpClientModule} from '@angular/common/http';


@Component({
  selector: 'app-graph',
  templateUrl: './interface.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    HttpClientModule
  ],
  providers: [InterfaceService],
  styleUrls: ['./interface.component.css']
})
export class InterfaceComponent implements OnInit {
  @ViewChild('graphInterface', {static: true})

  private svg: any;
  private width = 1200;
  private height = 600;
  private nodeNumber = 2;
  private simulationInstance: any;

  private motifNodes: GraphNode[] = [
    {id: '1', type: 'Person'},
    {id: '2', type: 'Movie'}
  ];
  private motifLinks: GraphLink[] = [];

  public lowerYear: number = 1950;
  public upperYear: number = 2023;
  public selected: GraphNode[] = [];

  constructor(private service: InterfaceService, private router: Router) {
  }

  ngOnInit(): void {
    this.createSvg();
    this.drawGraph();
    //this.fetchAndInitializeGraph();
    this.service.getGraph().subscribe(
      (response: any) => {
        this.motifNodes = response.nodes;
        console.log(this.motifNodes);
        this.motifLinks = response.motifLinks;
      },
      (error) => {
        console.error('Error fetching graph data:', error);
      }
    );


  }

  /*private fetchAndInitializeGraph(): void {
    this.service.getGraph()
      .subscribe(response => {
        this.processGraphData(response);
        this.drawGraph();
      }, error => {
        console.error('Error fetching graph data:', error);
      });
  }

  processGraphData(data: any): void {
    // Initialize arrays to hold  and motifLinks
    let : GraphNode[] = [];
    let motifLinks: GraphLink[] = [];

    // Assuming data is an array of objects representing relationships
    data.forEach(item => {
      // Extract movie (m) and person (n)  from the data
      let movieNode: GraphNode = {
        id: item.m.id,
        type: 'Movie',
        properties: item.m.properties
      };

      let personNode: GraphNode = {
        id: item.n.id,
        type: 'Person',
        properties: item.n.properties
      };

      // Create or find  in the  array
      let existingMovieNode = .find(node => node.id === movieNode.id);
      if (!existingMovieNode) {
        .push(movieNode);
      }

      let existingPersonNode = .find(node => node.id === personNode.id);
      if (!existingPersonNode) {
        .push(personNode);
      }

      // Create link between person and movie based on the relationship (r)
      let link: GraphLink = {
        source: personNode.id,
        target: movieNode.id,
        type: item.r.type // Adjust to match your relationship structure
      };

      motifLinks.push(link);
    });

    // Once  and motifLinks are populated, draw the graph
    this.drawGraph(, motifLinks);
  }*/

  private createSvg(): void {
    this.svg = d3.select('div#graphContainer')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .style('border', '1px solid black');
  }

  private drawGraph(): void {
    const link = this.svg.selectAll('.link')
      .data(this.motifLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .style('stroke', '#000000')
      .style('opacity', 0.5)
      .style('stroke-width', 3)
      .on('click', (event: MouseEvent, d: GraphLink) => this.onLinkClick(event, d));

    const linkText = this.svg.selectAll('.link-text')
      .data(this.motifLinks)
      .enter()
      .append('text')
      .attr('class', 'link-text')
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text((d: GraphLink) => d.type);

    let node = this.svg.selectAll('.node')
      .data(this.motifNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('contextmenu', (event: MouseEvent, d: GraphNode) => this.onNodeRightClick(event, d))
      .on('click', (event: MouseEvent, d: GraphNode) => this.onNodeLeftClick(event, d))
      .call(d3.drag<Element, GraphNode>()
        .on('start', (event: D3DragEvent<SVGElement, any, GraphNode>, d: GraphNode) => this.dragstarted(event, d))
        .on('drag', (event: D3DragEvent<SVGElement, any, GraphNode>, d: GraphNode) => this.dragged(event, d))
        .on('end', (event: D3DragEvent<SVGElement, any, GraphNode>, d: GraphNode) => this.dragended(event, d)));

    node.append('circle')
      .attr('r', 15)
      .style('fill', (d: GraphNode) => this.getNodeColor(d.type));

    node.append('text')
      .attr('dy', -3)
      .attr('x', 12)
      .text((d: GraphNode) => `${d.type}`);

    this.simulation(this.motifNodes, this.motifLinks);
    this.motifNodes.forEach(node => console.log("id: " + node.id + ": " + node.type + "\n"));
    this.motifLinks.forEach(link => console.log("source_id: " + link.source.id + " |  " + link.type + " | target_id: " + link.target.id + "\n"));
    console.log(this.lowerYear + " and " + this.upperYear);
  }


  private getNodeColor(type: 'Person' | 'Movie'): string {
    return type === 'Person' ? '#69b3a2' : '#ffab00';
  }

  private simulation(motifNodes: GraphNode[], motifLinks: GraphLink[]): any {
    if (!this.simulationInstance) {
      const boundaryMargin = 20;
      this.simulationInstance = d3.forceSimulation()
        .force('link', d3.forceLink<GraphNode, GraphLink>(this.motifLinks).id((d: GraphNode) => d.id).distance(200))
        .force('charge', d3.forceManyBody().strength(-10))
        .force('center', d3.forceCenter(this.width / 2, this.height / 2));

      this.simulationInstance.nodes().on('tick', () => {
        this.svg.selectAll('.node')
          .attr('transform', (d: GraphNode) => {
            d.x = Math.max(boundaryMargin, Math.min(this.width - boundaryMargin, d.x || 0));
            d.y = Math.max(boundaryMargin, Math.min(this.height - boundaryMargin, d.y || 0));
            return `translate(${d.x}, ${d.y})`;
          });

        /*this.svg.selectAll('.link')
          .attr('x1', (d: any) => (d.source as GraphNode).x)
          .attr('y1', (d: any) => (d.source as GraphNode).y)
          .attr('x2', (d: any) => (d.target as GraphNode).x)
          .attr('y2', (d: any) => (d.target as GraphNode).y);
      });*/
        this.svg.selectAll('.link')
          .attr('x1', (d: any) => (d.source as GraphNode).x)
          .attr('y1', (d: any) => (d.source as GraphNode).y)
          .attr('x2', (d: any) => (d.target as GraphNode).x)
          .attr('y2', (d: any) => (d.target as GraphNode).y);

        this.svg.selectAll('.link-text')
          .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
          .attr('y', (d: any) => (d.source.y + d.target.y) / 2)
          .style('font-size', '12px')
          .style('fill', (d: GraphLink) => this.getLinkTextColor(d.type))
          .style('opacity', 0.8);
      });
    }
    return this.simulationInstance;
  }

  addNode(nodeType: 'Person' | 'Movie') {
    const newNode: GraphNode = {
      id: (this.nodeNumber + 1).toString(),
      type: nodeType,
      x: this.width / 2,
      y: this.height / 2
    };
    this.nodeNumber += 1;
    this.motifNodes.push(newNode);

    this.updateSimulation();
    this.updateGraph();
  }

  removeNode(nodeId: string) {
    const nodeToDelete = this.motifNodes.find(node => node.id === nodeId);
    if (nodeToDelete) {
      this.motifLinks = this.motifLinks.filter(link => link.source !== nodeToDelete && link.target !== nodeToDelete);
      this.motifNodes = this.motifNodes.filter(node => node.id !== nodeId);
      this.updateGraph();
    }
  }

  private addLink(sourceId: string, targetId: string) {
    const sourceNode = this.motifNodes.find(node => node.id === sourceId);
    const targetNode = this.motifNodes.find(node => node.id === targetId);

    if (sourceNode && targetNode) {
      // Check if the link is from Person to Movie
      if (sourceNode.type === 'Person' && targetNode.type === 'Movie') {
        const linkType = prompt('Enter type for the new link (ACTED_IN, PRODUCED, DIRECTED, WROTE, REVIEWED):', 'ACTED_IN');
        if (linkType) {
          this.motifLinks.push({source: sourceNode, target: targetNode, type: linkType as GraphLink['type']});

          this.updateSimulation();
          this.updateGraph();
        }
      } else {
        alert('Link can only be from Person to Movie.');
      }
    }
  }

  removeLink(link: GraphLink) {
    this.motifLinks = this.motifLinks.filter(l => l !== link);
    this.updateSimulation();
    this.updateGraph();
  }

  private onNodeLeftClick(event: MouseEvent, node: GraphNode): void {
    if (event.shiftKey) {
      this.removeNode(node.id);
    } else if (event.altKey) {  // Use Alt key to trigger the type change
      const confirmText = `Change type to ${node.type === 'Person' ? 'Movie' : 'Person'}?`;
      const changeConfirmed = confirm(confirmText);
      if (changeConfirmed) {
        const newType = node.type === 'Person' ? 'Movie' : 'Person';
        this.changeNodeType(node.id, newType);
      }
    } else {
      alert(`Clicked on node: ${node.type}`);
    }
  }

  selectedNode: GraphNode | null = null;

  private onNodeRightClick(event: MouseEvent, d: GraphNode): void {
    event.preventDefault();
    this.selected.push(d);

    if (this.selected.length === 2) {
      const personNode = this.selected.find(node => node.type === 'Person');
      const movieNode = this.selected.find(node => node.type === 'Movie');

      if (personNode && movieNode) {
        this.addLink(personNode.id, movieNode.id);
      } else {
        alert('Link can only be from Person to Movie.');
      }

      this.selected = [];
    }
  }

  private onLinkClick(event: MouseEvent, link: GraphLink): void {
    if (event.shiftKey) {
      this.removeLink(link);
    } else {
      alert(`Clicked on link between ${link.source.id} and ${link.target.id} of type ${link.type}`);
    }
  }

  changeNodeType(nodeId: string, newType: 'Person' | 'Movie') {
    const node = this.motifNodes.find(n => n.id === nodeId);
    if (node) {
      node.type = newType;
      this.updateGraph();
    }
  }

  private dragstarted(event: D3DragEvent<SVGElement, GraphNode, GraphNode>, d: GraphNode): void {
    if (!event.active) {
      this.simulationInstance.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: D3DragEvent<SVGElement, GraphNode, GraphNode>, d: GraphNode): void {
    d.fx = event.x;
    d.fy = event.y;
    this.svg.selectAll('.link')
      .attr('x1', (link: GraphLink) => {
        if (link.source === d) return d.x;
        return link.source.x;
      })
      .attr('y1', (link: GraphLink) => {
        if (link.source === d) return d.y;
        return link.source.y;
      })
      .attr('x2', (link: GraphLink) => {
        if (link.target === d) return d.x;
        return link.target.x;
      })
      .attr('y2', (link: GraphLink) => {
        if (link.target === d) return d.y;
        return link.target.y;
      });
  }

  private dragended(event: D3DragEvent<SVGElement, GraphNode, GraphNode>, d: GraphNode): void {
    if (!event.active) {
      this.simulationInstance.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
    this.svg.selectAll('.link')
      .attr('x1', (link: GraphLink) => (link.source as GraphNode).x)
      .attr('y1', (link: GraphLink) => (link.source as GraphNode).y)
      .attr('x2', (link: GraphLink) => (link.target as GraphNode).x)
      .attr('y2', (link: GraphLink) => (link.target as GraphNode).y);
  }

  private updateSimulation() {
    this.simulationInstance
      .nodes()
      .force('link', d3.forceLink<GraphNode, GraphLink>(this.motifLinks).id((d: GraphNode) => d.id).distance(200))
      .alpha(1)
      .restart();
  }

  private updateGraph() {
    d3.select('svg').remove();
    this.createSvg();
    this.drawGraph();
    this.svg.selectAll('.node text')
      .text((d: GraphNode) => d.type);
    this.motifNodes.forEach(node => console.log(`Node: ${node.type}`));
    this.motifLinks.forEach(link => console.log(`Link: ${link.source.type} -> ${link.target.type} [${link.type}]`));
  }

  onSubmit() {
    this.service.getResults(this.motifNodes, this.motifLinks, this.lowerYear, this.upperYear)
      .subscribe(
      (response: any) => {
        console.log('Received response from backend:', response);
        this.router.navigate(['/interface/result'], { state: { data: JSON.stringify(response) } });
      },
      (error) => {
        console.error('Error submitting data:', error);
      }
    );
  }

  private getLinkTextColor(type: GraphLink['type']): string {
    switch (type) {
      case 'ACTED_IN':
        return '#091CC7'; // Blue
      case 'PRODUCED':
        return '#F609A9'; // Orange
      case 'DIRECTED':
        return '#069212'; // Green
      case 'WROTE':
        return '#d62728'; // Red
      case 'REVIEWED':
        return '#8809F6'; // Purple
      default:
        return '#000'; // Default black color or any other fallback color
    }
  }
}


