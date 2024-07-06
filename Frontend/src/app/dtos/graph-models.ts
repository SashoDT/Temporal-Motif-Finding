import {SimulationLinkDatum} from "d3";


export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  type: 'ACTED_IN' | 'PRODUCED' | 'DIRECTED' | 'WROTE' | 'REVIEWED';
}

export interface GraphNode {
  id: string;
  type: 'Person' | 'Movie';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}
