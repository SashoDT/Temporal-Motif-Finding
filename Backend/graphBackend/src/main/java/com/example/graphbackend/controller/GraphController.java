package com.example.graphbackend.controller;

import com.example.graphbackend.GraphNode;
import com.example.graphbackend.GraphLink;
import com.example.graphbackend.repository.GraphNodeRepository;
import com.example.graphbackend.service.GraphNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    @Autowired
    private GraphNodeRepository graphNodeRepository;

    @Autowired
    private GraphNodeService graphNodeService;

    @CrossOrigin(origins = "http://localhost:4200")
    @PostMapping("/search")
    public Collection<Map<String, Object>> searchPattern(@RequestBody Map<String, Object> requestBody) {
        List<Map<String, String>> nodesData = (List<Map<String, String>>) requestBody.get("nodes");
        List<Map<String, Object>> linksData = (List<Map<String, Object>>) requestBody.get("links");

        int lowerYear = (int) requestBody.get("lowerYear");
        int upperYear = (int) requestBody.get("upperYear");

        GraphNode[] nodes = new GraphNode[nodesData.size()];
        int i = 0;
        for (Map<String, String> node : nodesData) {
            nodes[i] = new GraphNode(node.get("id"), node.get("type"));
            i++;
        }

        GraphLink[] links = new GraphLink[linksData.size()];
        int j = 0;
        for (Map<String, Object> link : linksData) {
            GraphNode sourceNode = convertToGraphNode((Map<String, String>) link.get("source"));
            GraphNode targetNode = convertToGraphNode((Map<String, String>) link.get("target"));
            links[j] = new GraphLink(sourceNode, targetNode, (String) link.get("type"));
            j++;
        }

        String cypherQuery = generateCypherQuery(Arrays.stream(nodes).toList(), Arrays.stream(links).toList(), lowerYear, upperYear);
        return graphNodeService.executeDynamicQuery(cypherQuery);
    }

    @CrossOrigin(origins = "http://localhost:4200")
    @PostMapping("/getGraph")
    public Map<String, Object> getAll() {
        return graphNodeService.getAll(
                "MATCH (n)-[r]->(m) " +
                "WITH collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS relationships " +
                "RETURN { " +
                "nodes: [node in nodes | { " +
                "id: elementId(node), " +
                "type: labels(node)[0], " +
                "properties: properties(node) " +
                "}], " +
                "links: [rel in relationships | { " +
                "source: elementId(startNode(rel)), " +
                "target: elementId(endNode(rel)), " +
                "type: type(rel), " +
                "properties: properties(rel) " +
                "}] " +
                "} AS graphData");
    }


    private static String generateCypherQuery(List<GraphNode> nodes, List<GraphLink> links, int lowerYear, int upperYear) {
        StringBuilder matchClause = new StringBuilder("MATCH ");
        StringBuilder whereClause = new StringBuilder("WHERE ");
        StringBuilder returnClause = new StringBuilder("RETURN DISTINCT ");

        for (int i = 0; i < links.size(); i++) {
            GraphLink link = links.get(i);
            if (i > 0) {
                matchClause.append(", ");
            }
            matchClause.append(String.format("(%s:%s)-[:%s]->(%s:%s)",
                    'n' + link.getSource().getId(), link.getSource().getType(),
                    link.getType(),
                    'n' + link.getTarget().getId(), link.getTarget().getType()));
        }

        List<String> movies = nodes.stream()
                .filter(node -> "Movie".equals(node.getType()))
                .map(node -> node.getId())
                .collect(Collectors.toList());

        if (!movies.isEmpty()) {
            whereClause.append(String.join(" AND ", movies.stream()
                    .map(movie -> String.format("%d <= n%s.released <= %d", lowerYear, movie, upperYear))
                    .collect(Collectors.toList())));
        }

        returnClause.append(String.join(", ", nodes.stream()
                .map(node -> "n" + node.getId())
                .collect(Collectors.toList())));
        System.out.println(matchClause.toString() + " " + whereClause.toString() + " " + returnClause.toString());
        return matchClause.toString() + " " + whereClause.toString() + " " + returnClause.toString();
    }


    private static GraphNode convertToGraphNode(Map<String, String> nodeData) {
        if (nodeData == null || !nodeData.containsKey("id") || !nodeData.containsKey("type")) {
            return null;
        }

        String id = nodeData.get("id");
        String type = nodeData.get("type");
        return new GraphNode(id, type);
    }
}

