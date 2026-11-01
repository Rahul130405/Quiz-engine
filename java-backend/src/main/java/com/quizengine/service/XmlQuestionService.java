package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.Question;
import com.quizengine.model.QuizQuestionDTO;
import com.quizengine.model.Topic;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * Service managing quiz question retrieval, Fisher-Yates shuffling,
 * and client-facing DTO transformation.
 */
public class XmlQuestionService {

    private final XmlQuestionDao questionDao;
    private final Random random = new Random();

    public XmlQuestionService() {
        this(new XmlQuestionDao());
    }

    public XmlQuestionService(XmlQuestionDao questionDao) {
        this.questionDao = questionDao;
    }

    public List<Topic> getTopics() {
        return questionDao.getAllTopics();
    }

    public Optional<Topic> getTopicById(String topicId) {
        return questionDao.findTopicById(topicId);
    }

    public Optional<Question> getQuestionById(String id) {
        return questionDao.findQuestionById(id);
    }

    /**
     * Retrieves questions for a topic, optionally filters by difficulty,
     * applies Fisher-Yates unbiased shuffling, limits count, and strips answer keys.
     */
    public List<QuizQuestionDTO> getSanitizedQuestions(String topicId, String difficulty, int count, boolean shuffle) {
        List<Question> pool = questionDao.findQuestionsByTopicAndDifficulty(topicId, difficulty);
        if (pool.isEmpty()) {
            return Collections.emptyList();
        }

        List<Question> selected = pool;
        if (shuffle) {
            selected = fisherYatesShuffle(pool);
        }

        int limit = Math.min(count > 0 ? count : 10, selected.size());
        List<QuizQuestionDTO> dtoList = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            dtoList.add(selected.get(i).toDTO());
        }

        return dtoList;
    }

    /**
     * Unbiased Fisher–Yates Shuffle with O(n) time and O(1) auxiliary space.
     */
    public <T> List<T> fisherYatesShuffle(List<T> list) {
        List<T> copy = new ArrayList<>(list);
        for (int i = copy.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            T temp = copy.get(i);
            copy.set(i, copy.get(j));
            copy.set(j, temp);
        }
        return copy;
    }

    public XmlQuestionDao getDao() {
        return questionDao;
    }
}
