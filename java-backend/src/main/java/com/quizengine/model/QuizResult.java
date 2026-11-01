package com.quizengine.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * QuizResult represents the complete evaluation result returned to the client
 * after submitting a quiz session.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizResult {
    private String topicId;
    private int score;
    private int maxPossibleScore;
    private double percentage;
    private boolean passed;
    private int correctCount;
    private int wrongCount;
    private int timeoutCount;
    private int maxStreak;
    private int totalStreakBonus;
    private String attemptId;
    private int newTotalScore;
    private boolean isNewBest;
    private List<AnswerDetail> history = new ArrayList<>();

    public QuizResult() {}

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getMaxPossibleScore() { return maxPossibleScore; }
    public void setMaxPossibleScore(int maxPossibleScore) { this.maxPossibleScore = maxPossibleScore; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }

    public int getTimeoutCount() { return timeoutCount; }
    public void setTimeoutCount(int timeoutCount) { this.timeoutCount = timeoutCount; }

    public int getMaxStreak() { return maxStreak; }
    public void setMaxStreak(int maxStreak) { this.maxStreak = maxStreak; }

    public int getTotalStreakBonus() { return totalStreakBonus; }
    public void setTotalStreakBonus(int totalStreakBonus) { this.totalStreakBonus = totalStreakBonus; }

    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }

    public int getNewTotalScore() { return newTotalScore; }
    public void setNewTotalScore(int newTotalScore) { this.newTotalScore = newTotalScore; }

    public boolean isNewBest() { return isNewBest; }
    public void setNewBest(boolean newBest) { isNewBest = newBest; }

    public List<AnswerDetail> getHistory() { return history; }
    public void setHistory(List<AnswerDetail> history) { this.history = history; }

    @JsonProperty("answers")
    public List<AnswerDetail> getAnswers() { return history; }

    /**
     * Nested class representing per-question evaluation breakdown.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AnswerDetail {
        private String questionId;
        private String questionText;
        private int selectedOption;
        private int correctAnswer;
        private boolean correct;
        private boolean timedOut;
        private int scoreChange;
        private int streakBonus;
        private String explanation;

        public AnswerDetail() {}

        public AnswerDetail(String questionId, String questionText, int selectedOption, int correctAnswer,
                            boolean correct, boolean timedOut, int scoreChange, int streakBonus, String explanation) {
            this.questionId = questionId;
            this.questionText = questionText;
            this.selectedOption = selectedOption;
            this.correctAnswer = correctAnswer;
            this.correct = correct;
            this.timedOut = timedOut;
            this.scoreChange = scoreChange;
            this.streakBonus = streakBonus;
            this.explanation = explanation;
        }

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }

        public int getSelectedOption() { return selectedOption; }
        public void setSelectedOption(int selectedOption) { this.selectedOption = selectedOption; }

        public int getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(int correctAnswer) { this.correctAnswer = correctAnswer; }

        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }

        @com.fasterxml.jackson.annotation.JsonProperty("isCorrect")
        public boolean getIsCorrect() { return correct; }

        public boolean isTimedOut() { return timedOut; }
        public void setTimedOut(boolean timedOut) { this.timedOut = timedOut; }

        public int getScoreChange() { return scoreChange; }
        public void setScoreChange(int scoreChange) { this.scoreChange = scoreChange; }

        public int getStreakBonus() { return streakBonus; }
        public void setStreakBonus(int streakBonus) { this.streakBonus = streakBonus; }

        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }
}
