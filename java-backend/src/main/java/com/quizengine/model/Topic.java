package com.quizengine.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * Topic Model representing a learning curriculum node loaded from topics.xml.
 * Fully compatible with React TopicGraph and SVG canvas coordinates.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Topic {
    private String id;
    private String name;
    private String description;
    private String icon;
    private String color;
    private int passingScore = 60;
    private int order = 0;
    private List<String> prerequisites = new ArrayList<>();

    // Frontend UI Graph & State fields
    private Position position;
    private boolean unlocked = true;
    private boolean completed = false;
    private int bestScore = 0;

    public static class Position {
        private int x;
        private int y;

        public Position() {}
        public Position(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public int getX() { return x; }
        public void setX(int x) { this.x = x; }

        public int getY() { return y; }
        public void setY(int y) { this.y = y; }
    }

    public Topic() {}

    public Topic(String id, String name, String description, String icon, String color,
                 int passingScore, int order, List<String> prerequisites) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.color = color;
        this.passingScore = passingScore;
        this.order = order;
        this.prerequisites = prerequisites != null ? prerequisites : new ArrayList<>();
        // Default position based on topological progression order
        this.position = new Position(100 + (order * 200), 250);
        this.unlocked = (this.prerequisites.isEmpty());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    // Interoperability alias for MongoDB _id expected by React TopicGraph
    @JsonProperty("_id")
    public String get_id() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getPassingScore() { return passingScore; }
    public void setPassingScore(int passingScore) { this.passingScore = passingScore; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public List<String> getPrerequisites() { return prerequisites; }
    public void setPrerequisites(List<String> prerequisites) { this.prerequisites = prerequisites; }

    public Position getPosition() {
        if (position == null) {
            position = new Position(100 + (order * 200), 250);
        }
        return position;
    }
    public void setPosition(Position position) { this.position = position; }

    public boolean isUnlocked() { return unlocked; }
    public void setUnlocked(boolean unlocked) { this.unlocked = unlocked; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }
}
