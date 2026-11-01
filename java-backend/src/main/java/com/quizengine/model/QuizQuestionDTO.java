package com.quizengine.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object for Questions sent to the client.
 * Strictly omits 'correctAnswer' and 'explanation' to prevent client answer leakage.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizQuestionDTO {
    private String id;
    private String topicId;
    private String text;
    private List<String> options = new ArrayList<>();
    private String difficulty;
    private int timeLimitSeconds;

    public QuizQuestionDTO() {}

    public QuizQuestionDTO(String id, String topicId, String text, List<String> options,
                           String difficulty, int timeLimitSeconds) {
        this.id = id;
        this.topicId = topicId;
        this.text = text;
        this.options = options != null ? options : new ArrayList<>();
        this.difficulty = difficulty;
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    @JsonProperty("_id")
    public String get_id() { return id; }

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(int timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
}
