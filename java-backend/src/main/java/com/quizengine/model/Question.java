package com.quizengine.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;

/**
 * Question Model representing a full quiz question loaded from questions.xml.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Question {
    private String id;
    private String topicId;
    private String text;
    private List<String> options = new ArrayList<>();
    private int correctAnswer; // 0-indexed (0 to 3)
    private String difficulty; // easy, medium, hard
    private String explanation;
    private int timeLimitSeconds = 25;

    public Question() {}

    public Question(String id, String topicId, String text, List<String> options,
                    int correctAnswer, String difficulty, String explanation, int timeLimitSeconds) {
        this.id = id;
        this.topicId = topicId;
        this.text = text;
        this.options = options != null ? options : new ArrayList<>();
        this.correctAnswer = correctAnswer;
        this.difficulty = difficulty;
        this.explanation = explanation;
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public int getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(int correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public int getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(int timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

    /**
     * Converts to sanitized DTO to ensure answer keys are never leaked to clients.
     */
    public QuizQuestionDTO toDTO() {
        return new QuizQuestionDTO(this.id, this.topicId, this.text, this.options,
                                   this.difficulty, this.timeLimitSeconds);
    }
}
