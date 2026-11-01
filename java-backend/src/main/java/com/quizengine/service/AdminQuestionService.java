package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.Question;
import com.quizengine.model.Topic;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service orchestrating administrative operations: dashboard analytics,
 * question querying with pagination and filtering, question CRUD, and topic graph management.
 */
public class AdminQuestionService {

    private final XmlQuestionDao questionDao;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    public AdminQuestionService(XmlQuestionDao questionDao) {
        this.questionDao = questionDao;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTopics", questionDao.getTopicCount());
        stats.put("totalQuestions", questionDao.getQuestionCount());
        stats.put("easyQuestions", questionDao.getQuestionCountByDifficulty("easy"));
        stats.put("mediumQuestions", questionDao.getQuestionCountByDifficulty("medium"));
        stats.put("hardQuestions", questionDao.getQuestionCountByDifficulty("hard"));
        stats.put("datastoreHealthy", questionDao.isDatastoreHealthy());

        String formattedTime = questionDao.getLastLoadedTime() != null
                ? DATE_FORMATTER.format(questionDao.getLastLoadedTime())
                : "N/A";
        stats.put("lastLoadedTime", formattedTime);

        // Topic breakdown
        List<TopicStats> topicStats = new ArrayList<>();
        for (Topic t : questionDao.getAllTopics()) {
            long count = questionDao.getQuestionCountByTopic(t.getId());
            topicStats.add(new TopicStats(t, count));
        }
        stats.put("topicBreakdown", topicStats);

        return stats;
    }

    public static class TopicStats {
        private final Topic topic;
        private final long questionCount;

        public TopicStats(Topic topic, long questionCount) {
            this.topic = topic;
            this.questionCount = questionCount;
        }

        public Topic getTopic() { return topic; }
        public long getQuestionCount() { return questionCount; }
    }

    public static class PaginatedResult<T> {
        private final List<T> items;
        private final int currentPage;
        private final int pageSize;
        private final int totalItems;
        private final int totalPages;

        public PaginatedResult(List<T> items, int currentPage, int pageSize, int totalItems) {
            this.items = items;
            this.currentPage = currentPage;
            this.pageSize = pageSize;
            this.totalItems = totalItems;
            this.totalPages = (int) Math.ceil((double) totalItems / pageSize);
        }

        public List<T> getItems() { return items; }
        public int getCurrentPage() { return currentPage; }
        public int getPageSize() { return pageSize; }
        public int getTotalItems() { return totalItems; }
        public int getTotalPages() { return totalPages; }
        public boolean hasNext() { return currentPage < totalPages; }
        public boolean hasPrevious() { return currentPage > 1; }
    }

    public PaginatedResult<Question> searchAndFilterQuestions(String search, String topicId, String difficulty, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        List<Question> allQuestions = questionDao.getAllQuestions();

        // 1. Filter
        List<Question> filtered = allQuestions.stream()
                .filter(q -> {
                    if (search != null && !search.trim().isEmpty()) {
                        String query = search.trim().toLowerCase();
                        boolean matchId = q.getId().toLowerCase().contains(query);
                        boolean matchText = q.getText().toLowerCase().contains(query);
                        if (!matchId && !matchText) return false;
                    }
                    if (topicId != null && !topicId.trim().isEmpty() && !"all".equalsIgnoreCase(topicId)) {
                        if (!topicId.equalsIgnoreCase(q.getTopicId())) return false;
                    }
                    if (difficulty != null && !difficulty.trim().isEmpty() && !"all".equalsIgnoreCase(difficulty)) {
                        if (!difficulty.equalsIgnoreCase(q.getDifficulty())) return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Question::getId))
                .collect(Collectors.toList());

        int totalItems = filtered.size();
        int fromIndex = (page - 1) * pageSize;

        if (fromIndex >= totalItems) {
            return new PaginatedResult<>(Collections.emptyList(), page, pageSize, totalItems);
        }

        int toIndex = Math.min(fromIndex + pageSize, totalItems);
        List<Question> pagedItems = filtered.subList(fromIndex, toIndex);

        return new PaginatedResult<>(pagedItems, page, pageSize, totalItems);
    }

    public Optional<Question> getQuestionById(String id) {
        return questionDao.findQuestionById(id);
    }

    public void createQuestion(Question question) throws Exception {
        questionDao.saveQuestion(question, true);
    }

    public void updateQuestion(Question question) throws Exception {
        questionDao.saveQuestion(question, false);
    }

    public void deleteQuestion(String questionId) throws Exception {
        questionDao.deleteQuestion(questionId);
    }

    public List<Topic> getAllTopics() {
        return questionDao.getAllTopics();
    }

    public Optional<Topic> getTopicById(String topicId) {
        return questionDao.findTopicById(topicId);
    }

    public void updateTopic(Topic topic) throws Exception {
        questionDao.updateTopic(topic);
    }
}
