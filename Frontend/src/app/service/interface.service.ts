import {GraphNode, GraphLink} from "../dtos/graph-models"
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {GraphDTO} from "../dtos/graphDTO";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root', // Ensure the service is provided in the root
})
export class InterfaceService {
  private interfaceBaseUri: string = "http://localhost:8080/api/graph";

  constructor(private httpClient: HttpClient) {}

  getResults(nodes: GraphNode[], links: GraphLink[], lowerYear: number, upperYear: number): Observable<GraphDTO> {
    const data: GraphDTO = {
      nodes: nodes,
      links: links,
      lowerYear: lowerYear,
      upperYear: upperYear
    };
    return this.httpClient.post<GraphDTO>(`${this.interfaceBaseUri}/search`, data);
  }

  getGraph(): Observable<{ nodes: GraphNode[], links: GraphLink[] }> {
    return this.httpClient.post<{ nodes: GraphNode[], links: GraphLink[] }>(`${this.interfaceBaseUri}/getGraph`, {});
  }
}
