import {GraphNode, GraphLink} from "../interface/interface.component";

export class GraphDTO {
  nodes?: GraphNode[];
  links?: GraphLink[];
  lowerYear?: number;
  upperYear?: number;
}
