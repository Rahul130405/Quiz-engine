package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.Question;
import com.quizengine.model.QuizAnswer;
import com.quizengine.model.QuizResult;
import com.quizengine.model.Topic;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * QuizEvaluationService grades client-submitted answers securely against
 * the authoritative XML question store on the server.
 */
public class QuizEvaluationService {

    private final XmlQuestionDao questionDao;
    private final ScoringService scoringService;

    public QuizEvaluationService() {
        this(new XmlQuestionDao(), new ScoringService());
    }

    public QuizEvaluationService(XmlQuestionDao questionDao, ScoringService scoringService) {
        this.questionDao = questionDao;
        this.scoringService = scoringService;
    }

    /**
     * Evaluates a submitted quiz attempt.
     *
     * @param topicId The ID of the topic being attempted.
     * @param answers The list of answers submitted by the client.
     * @return Complete evaluation result including score, percentage, streak metrics, and per-question breakdown.
     */
    public QuizResult evaluate(String topicId, List<QuizAnswer> answers) {
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("No answers submitted for evaluation");
        }

        Topic topic = questionDao.findTopicById(topicId)
                .orElse(null);

        ScoringService.ScoreState scoreState = scoringService.createScoreState();
        List<QuizResult.AnswerDetail> history = new ArrayList<>();

        for (QuizAnswer answer : answers) {
            String qId = answer.getQuestionId();
            Optional<Question> questionOpt = questionDao.findQuestionById(qId);

            if (questionOpt.isEmpty()) {
                throw new IllegalArgumentException("Question not found in XML datastore: " + qId);
            }

            Question question = questionOpt.get();
            int selected = answer.getSelectedOption();
            boolean timedOut = answer.isTimedOut();

            // Validate selected option is within valid bounds (0 to 3, or -1 for timeout/skip)
            if (selected < -1 || selected > 3) {
                throw new IllegalArgumentException("Selected option index out of bounds for question: " + qId);
            }

            boolean isCorrect = !timedOut && (selected == question.getCorrectAnswer());

            // Record through score engine
            ScoringService.ScoreState.Record record = scoreState.recordAnswer(isCorrect, timedOut);

            history.add(new QuizResult.AnswerDetail(
                    question.getId(),
                    question.getText(),
                    selected,
                    question.getCorrectAnswer(),
                    isCorrect,
                    timedOut,
                    record.scoreChange,
                    record.streakBonus,
                    question.getExplanation()
            ));
        }

        int totalQuestions = answers.size();
        double percentage = scoreState.calculatePercentage(totalQuestions);
        int passingScore = (topic != null) ? topic.getPassingScore() : 60;
        boolean passed = percentage >= passingScore;

        QuizResult result = new QuizResult();
        result.setTopicId(topicId);
        result.setScore(scoreState.getTotalScore());
        result.setMaxPossibleScore(scoreState.calculateMaxPossibleScore(totalQuestions));
        result.setPercentage(percentage);
        result.setPassed(passed);
        result.setCorrectCount(scoreState.getCorrectCount());
        result.setWrongCount(scoreState.getWrongCount());
        result.setTimeoutCount(scoreState.getTimeoutCount());
        result.setMaxStreak(scoreState.getMaxStreak());
        result.setTotalStreakBonus(scoreState.getTotalStreakBonus());
        result.setHistory(history);

        return result;
    }
}
