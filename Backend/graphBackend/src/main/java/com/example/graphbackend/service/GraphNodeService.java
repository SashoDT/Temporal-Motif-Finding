/*package com.example.graphbackend.service;

import org.neo4j.driver.internal.InternalNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
public class GraphNodeService {

    private final Neo4jClient neo4jClient;

    public GraphNodeService(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public Collection<Map<String, Object>> executeDynamicQuery(String cypherQuery) {
        Collection<Map<String, Object>> result = neo4jClient.query(cypherQuery)
                .fetch()
                .all();
        System.out.println(result.toArray()[0]);
        return result;
    }
}*/
package com.example.graphbackend.service;

import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.internal.InternalNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class GraphNodeService {

    private final Neo4jClient neo4jClient;

    @Autowired
    public GraphNodeService(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public Collection<Map<String, Object>> executeDynamicQuery(String cypherQuery) {
        Collection<Map<String, Object>> rawResults = neo4jClient.query(cypherQuery)
                .fetch()
                .all();

        // Transform the raw results into JSON-friendly format
        List<Map<String, Object>> jsonResults = new ArrayList<>();

        for (Map<String, Object> row : rawResults) {
            Map<String, Object> jsonRow = new HashMap<>();
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getValue() instanceof InternalNode) {
                    InternalNode node = (InternalNode) entry.getValue();
                    Map<String, Object> nodeProps = new HashMap<>();
                    nodeProps.put("id", node.id());
                    nodeProps.put("labels", node.labels());
                    nodeProps.put("properties", node.asMap());
                    jsonRow.put(entry.getKey(), nodeProps);
                } else {
                    jsonRow.put(entry.getKey(), entry.getValue());
                }
            }
            jsonResults.add(jsonRow);
        }
        return jsonResults;
    }

    public Map<String, Object> getAll(String cypherQuery) {
        Collection<Map<String, Object>> rawResults = neo4jClient.query(cypherQuery)
                .fetch()
                .all();

        // Initialize lists for nodes and links
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        for (Map<String, Object> row : rawResults) {
            Map<String, Object> graphData = (Map<String, Object>) row.get("graphData");

            if (graphData != null) {
                // Extract nodes
                List<Object> rawNodes = (List<Object>) graphData.get("nodes");
                if (rawNodes != null) {
                    for (Object rawNode : rawNodes) {
                        if (rawNode instanceof Map) {
                            nodes.add((Map<String, Object>) rawNode);
                        }
                    }
                }

                // Extract links
                List<Object> rawLinks = (List<Object>) graphData.get("links");
                if (rawLinks != null) {
                    for (Object rawLink : rawLinks) {
                        if (rawLink instanceof Map) {
                            links.add((Map<String, Object>) rawLink);
                        }
                    }
                }
            }
        }

        // Prepare final graph data
        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("links", links);

        return result;
    }
}


