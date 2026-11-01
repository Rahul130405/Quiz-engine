package com.quizengine.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * QuizAnswer represents a single answer submitted by a user for a question.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizAnswer {
    private String questionId;

    @JsonProperty("selectedOption")
    @JsonAlias({"selectedAnswer"})
    private int selectedOption = -1; // -1 = skipped or timed out

    private boolean timedOut = false;
    private int timeTakenSeconds = 0;

    public QuizAnswer() {}

    public QuizAnswer(String questionId, int selectedOption, boolean timedOut, int timeTakenSeconds) {
        this.questionId = questionId;
        this.selectedOption = selectedOption;
        this.timedOut = timedOut;
        this.timeTakenSeconds = timeTakenSeconds;
    }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public int getSelectedOption() { return selectedOption; }
    public void setSelectedOption(int selectedOption) { this.selectedOption = selectedOption; }

    public void setSelectedAnswer(int selectedAnswer) { this.selectedOption = selectedAnswer; }

    public boolean isTimedOut() { return timedOut; }
    public void setTimedOut(boolean timedOut) { this.timedOut = timedOut; }

    public int getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(int timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}
