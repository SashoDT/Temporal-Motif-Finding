package com.example.graphbackend.repository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import com.example.graphbackend.GraphNode;

import java.util.List;
import java.util.Map;

public interface GraphNodeRepository extends CrudRepository<GraphNode, String> {

    @Query("MATCH (n:GraphNode {id: $id, name: $name}) RETURN n")
    List<Map<String, Object>> findPattern(String id, String name);

}
