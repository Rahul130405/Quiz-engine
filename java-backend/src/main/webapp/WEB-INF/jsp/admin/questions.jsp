<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="Question Bank Management" />
<c:set var="activeNav" value="questions" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Question Management - QuizEngine Admin</title>
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body>

<%@ include file="header.jspf" %>

<!-- Alerts -->
<c:if test="${not empty successMessage}">
    <div class="alert alert-success">
        <span>✅</span>
        <div><c:out value="${successMessage}" /></div>
    </div>
</c:if>

<c:if test="${not empty errorMessage}">
    <div class="alert alert-danger">
        <span>⚠️</span>
        <div><c:out value="${errorMessage}" /></div>
    </div>
</c:if>

<!-- Filter & Search Toolbar -->
<form method="GET" action="${pageContext.request.contextPath}/admin/questions" class="filter-toolbar">
    <div class="filter-group" style="flex: 2;">
        <label for="searchInput">Search Keywords / ID</label>
        <input class="filter-input" type="text" id="searchInput" name="search" value="${search}"
               placeholder="Search question text or q-html-...">
    </div>

    <div class="filter-group">
        <label for="topicSelect">Curriculum Topic</label>
        <select class="filter-input" id="topicSelect" name="topicId">
            <option value="all">All Topics</option>
            <c:forEach var="t" items="${topics}">
                <option value="${t.id}" ${selectedTopic == t.id ? 'selected' : ''}><c:out value="${t.name}" /></option>
            </c:forEach>
        </select>
    </div>

    <div class="filter-group">
        <label for="difficultySelect">Difficulty Tier</label>
        <select class="filter-input" id="difficultySelect" name="difficulty">
            <option value="all">All Difficulties</option>
            <option value="easy" ${selectedDifficulty == 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${selectedDifficulty == 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard" ${selectedDifficulty == 'hard' ? 'selected' : ''}>Hard</option>
        </select>
    </div>

    <div class="filter-actions">
        <button type="submit" class="btn btn-primary" style="height: 38px;">
            <span>🔍</span> Filter
        </button>
        <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary" style="height: 38px;">
            Clear
        </a>
    </div>
</form>

<!-- Header & Add Button -->
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
    <div style="font-size: 0.875rem; color: var(--text-muted);">
        Showing <strong><c:out value="${result.items.size()}" /></strong> of <strong><c:out value="${result.totalItems}" /></strong> questions
        (Page <c:out value="${result.currentPage}" /> of <c:out value="${result.totalPages > 0 ? result.totalPages : 1}" />)
    </div>
    <a href="${pageContext.request.contextPath}/admin/questions/create" class="btn btn-primary btn-sm">
        <span>➕</span> Add New Question
    </a>
</div>

<!-- Questions Accordion / List -->
<c:choose>
    <c:when test="${not empty result.items}">
        <c:forEach var="q" items="${result.items}">
            <div class="question-card" id="card-${q.id}">
                <div class="question-header">
                    <div class="question-meta-group">
                        <span class="code-pill"><c:out value="${q.id}" /></span>
                        <span class="badge badge-topic"><c:out value="${q.topicId}" /></span>
                        <c:choose>
                            <c:when test="${q.difficulty == 'easy'}"><span class="badge badge-easy">Easy</span></c:when>
                            <c:when test="${q.difficulty == 'medium'}"><span class="badge badge-medium">Medium</span></c:when>
                            <c:otherwise><span class="badge badge-hard">Hard</span></c:otherwise>
                        </c:choose>
                        <span style="font-size: 0.8125rem; color: var(--text-subtle);">⏱ <c:out value="${q.timeLimitSeconds}" />s</span>
                    </div>

                    <div class="question-preview-text" title="${q.text}">
                        <c:out value="${q.text}" />
                    </div>

                    <div class="question-actions-group">
                        <a href="${pageContext.request.contextPath}/admin/questions/edit?id=${q.id}" class="btn btn-secondary btn-sm">
                            <span>✏️</span> Edit
                        </a>
                        <button type="button" class="btn btn-danger btn-sm btn-trigger-delete" data-id="${q.id}">
                            <span>🗑️</span> Delete
                        </button>
                        <span class="accordion-chevron" style="color: var(--text-subtle); font-size: 0.75rem; margin-left: 0.25rem;">▼</span>
                    </div>
                </div>

                <!-- Expanded Details (Reveals Options & Answer to Admin) -->
                <div class="question-details">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                        Authoritative Options &amp; Verified Answer Key:
                    </div>

                    <div class="options-grid">
                        <c:forEach var="opt" items="${q.options}" varStatus="optStatus">
                            <div class="option-item ${optStatus.index == q.correctAnswer ? 'correct' : ''}">
                                <div class="option-marker">
                                    <c:choose>
                                        <c:when test="${optStatus.index == 0}">A</c:when>
                                        <c:when test="${optStatus.index == 1}">B</c:when>
                                        <c:when test="${optStatus.index == 2}">C</c:when>
                                        <c:otherwise>D</c:otherwise>
                                    </c:choose>
                                </div>
                                <div style="flex: 1; color: var(--text-primary);"><c:out value="${opt}" /></div>
                                <c:if test="${optStatus.index == q.correctAnswer}">
                                    <span class="badge badge-easy">CORRECT ANSWER</span>
                                </c:if>
                            </div>
                        </c:forEach>
                    </div>

                    <c:if test="${not empty q.explanation}">
                        <div class="explanation-box">
                            <div class="explanation-title">
                                <span>💡</span> Pedagogical Explanation
                            </div>
                            <div><c:out value="${q.explanation}" /></div>
                        </div>
                    </c:if>
                </div>
            </div>
        </c:forEach>

        <!-- Pagination Controls -->
        <c:if test="${result.totalPages > 1}">
            <div class="pagination">
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    Page <strong><c:out value="${result.currentPage}" /></strong> of <strong><c:out value="${result.totalPages}" /></strong>
                </div>
                <div class="pagination-links">
                    <c:if test="${result.hasPrevious()}">
                        <a href="${pageContext.request.contextPath}/admin/questions?search=${search}&topicId=${selectedTopic}&difficulty=${selectedDifficulty}&page=${result.currentPage - 1}"
                           class="page-btn">
                            ← Previous
                        </a>
                    </c:if>
                    <c:if test="${result.hasNext()}">
                        <a href="${pageContext.request.contextPath}/admin/questions?search=${search}&topicId=${selectedTopic}&difficulty=${selectedDifficulty}&page=${result.currentPage + 1}"
                           class="page-btn">
                            Next →
                        </a>
                    </c:if>
                </div>
            </div>
        </c:if>
    </c:when>
    <c:otherwise>
        <div class="panel" style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 2.75rem; margin-bottom: 0.75rem;">🔍</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">No matching questions found</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.35rem;">
                Try adjusting your search query, topic filter, or difficulty filter.
            </p>
            <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary btn-sm" style="margin-top: 1.25rem;">
                Reset All Filters
            </a>
        </div>
    </c:otherwise>
</c:choose>

<!-- Delete Confirmation Modal Dialog -->
<div class="modal-overlay" id="deleteConfirmModal">
    <div class="modal-dialog">
        <h3 class="modal-title">
            <span>🗑️</span> Confirm Question Deletion
        </h3>
        <p class="modal-body-text">
            Are you sure you want to permanently delete question <strong id="deleteQuestionTargetSpan" style="color: var(--text-primary);"></strong>?
            This operation will remove the question from the XML repository.
        </p>

        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/delete" id="deleteConfirmForm">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">
            <input type="hidden" name="id" id="deleteQuestionIdInput" value="">
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="cancelDeleteBtn">Cancel</button>
                <button type="submit" class="btn btn-danger btn-sm">Permanently Delete</button>
            </div>
        </form>
    </div>
</div>

<%@ include file="footer.jspf" %>
