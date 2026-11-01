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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
    <style>
        .filter-bar {
            background: #fff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            margin-bottom: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-end;
        }
        .filter-item {
            flex: 1;
            min-width: 180px;
        }
        .question-card {
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 1rem;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .question-header {
            padding: 1rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #fff;
            cursor: pointer;
            border-bottom: 1px solid transparent;
        }
        .question-card.open .question-header {
            border-bottom-color: var(--border);
            background: #f8fafc;
        }
        .question-details {
            display: none;
            padding: 1.25rem;
            background: #fafbfc;
        }
        .question-card.open .question-details {
            display: block;
        }
        .options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 0.75rem;
            margin: 1rem 0;
        }
        .option-item {
            padding: 0.75rem 1rem;
            border-radius: 6px;
            background: #fff;
            border: 1px solid var(--border);
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .option-item.correct {
            border-color: #10b981;
            background: #ecfdf5;
            font-weight: 600;
            color: #065f46;
        }
        .opt-letter {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .option-item.correct .opt-letter {
            background: #10b981;
            color: #fff;
        }
        .explanation-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            color: #1e40af;
            margin-top: 0.75rem;
        }
    </style>
</head>
<body>

<%@ include file="header.jspf" %>

<c:if test="${not empty successMessage}">
    <div class="alert alert-success">
        <span>✓</span>
        <div>${successMessage}</div>
    </div>
</c:if>

<c:if test="${not empty errorMessage}">
    <div class="alert alert-danger">
        <span>⚠️</span>
        <div>${errorMessage}</div>
    </div>
</c:if>

<!-- Search and Filter Form -->
<form method="GET" action="${pageContext.request.contextPath}/admin/questions" class="filter-bar">
    <div class="filter-item" style="flex:2;">
        <label class="form-label" for="search">Search Keywords / ID</label>
        <input class="form-control" type="text" id="search" name="search" value="${search}" placeholder="Search question text or q-html-...">
    </div>

    <div class="filter-item">
        <label class="form-label" for="topicId">Topic</label>
        <select class="form-control" id="topicId" name="topicId">
            <option value="all">All Topics</option>
            <c:forEach var="t" items="${topics}">
                <option value="${t.id}" ${selectedTopic == t.id ? 'selected' : ''}>${t.name}</option>
            </c:forEach>
        </select>
    </div>

    <div class="filter-item">
        <label class="form-label" for="difficulty">Difficulty</label>
        <select class="form-control" id="difficulty" name="difficulty">
            <option value="all">All Difficulties</option>
            <option value="easy" ${selectedDifficulty == 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${selectedDifficulty == 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard" ${selectedDifficulty == 'hard' ? 'selected' : ''}>Hard</option>
        </select>
    </div>

    <div>
        <button type="submit" class="btn btn-primary" style="height:38px;">🔍 Filter</button>
        <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary" style="height:38px;">Clear</a>
    </div>
</form>

<!-- Results Header -->
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
    <div style="font-size:0.9rem; color:var(--text-muted);">
        Showing <strong>${result.items.size()}</strong> of <strong>${result.totalItems}</strong> questions
        (Page ${result.currentPage} of ${result.totalPages > 0 ? result.totalPages : 1})
    </div>
    <a href="${pageContext.request.contextPath}/admin/questions/create" class="btn btn-primary btn-sm">
        ➕ Create New Question
    </a>
</div>

<!-- Questions Accordion / List -->
<c:choose>
    <c:when test="${not empty result.items}">
        <c:forEach var="q" items="${result.items}" varStatus="status">
            <div class="question-card" id="card-${q.id}">
                <div class="question-header" onclick="toggleDetails('${q.id}')">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex:1;">
                        <code style="font-size:0.825rem; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${q.id}</code>
                        <span class="badge badge-topic">${q.topicId}</span>
                        <c:choose>
                            <c:when test="${q.difficulty == 'easy'}"><span class="badge badge-easy">Easy</span></c:when>
                            <c:when test="${q.difficulty == 'medium'}"><span class="badge badge-medium">Medium</span></c:when>
                            <c:otherwise><span class="badge badge-hard">Hard</span></c:otherwise>
                        </c:choose>
                        <span style="font-size:0.8rem; color:var(--text-muted);">⏱ ${q.timeLimitSeconds}s</span>
                        <div style="font-weight:600; font-size:0.925rem; margin-left:0.5rem; flex:1;">
                            ${q.text}
                        </div>
                    </div>

                    <div style="display:flex; gap:0.5rem; align-items:center;" onclick="event.stopPropagation();">
                        <a href="${pageContext.request.contextPath}/admin/questions/edit?id=${q.id}" class="btn btn-secondary btn-sm">
                            ✏️ Edit
                        </a>
                        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/delete" style="margin:0;"
                              onsubmit="return confirm('Are you sure you want to delete question ${q.id}? This action updates the XML store permanently.');">
                            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">
                            <input type="hidden" name="id" value="${q.id}">
                            <button type="submit" class="btn btn-danger btn-sm">🗑️ Delete</button>
                        </form>
                    </div>
                </div>

                <!-- Expanded Details (Admin View Only) -->
                <div class="question-details">
                    <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">
                        Available Options (Correct Answer Revealed to Admin):
                    </div>
                    <div class="options-grid">
                        <c:forEach var="opt" items="${q.options}" varStatus="optStatus">
                            <div class="option-item ${optStatus.index == q.correctAnswer ? 'correct' : ''}">
                                <div class="opt-letter">
                                    <c:choose>
                                        <c:when test="${optStatus.index == 0}">A</c:when>
                                        <c:when test="${optStatus.index == 1}">B</c:when>
                                        <c:when test="${optStatus.index == 2}">C</c:when>
                                        <c:otherwise>D</c:otherwise>
                                    </c:choose>
                                </div>
                                <div style="flex:1;">${opt}</div>
                                <c:if test="${optStatus.index == q.correctAnswer}">
                                    <span style="font-size:0.75rem; background:#10b981; color:#fff; padding:2px 6px; border-radius:4px;">CORRECT</span>
                                </c:if>
                            </div>
                        </c:forEach>
                    </div>

                    <c:if test="${not empty q.explanation}">
                        <div class="explanation-box">
                            <strong>💡 Pedagogical Explanation:</strong> ${q.explanation}
                        </div>
                    </c:if>
                </div>
            </div>
        </c:forEach>

        <!-- Pagination Controls -->
        <c:if test="${result.totalPages > 1}">
            <div class="pagination">
                <div>Page <strong>${result.currentPage}</strong> of <strong>${result.totalPages}</strong></div>
                <div class="page-buttons">
                    <c:if test="${result.hasPrevious()}">
                        <a href="${pageContext.request.contextPath}/admin/questions?search=${search}&topicId=${selectedTopic}&difficulty=${selectedDifficulty}&page=${result.currentPage - 1}" class="btn btn-secondary btn-sm">
                            ← Previous
                        </a>
                    </c:if>
                    <c:if test="${result.hasNext()}">
                        <a href="${pageContext.request.contextPath}/admin/questions?search=${search}&topicId=${selectedTopic}&difficulty=${selectedDifficulty}&page=${result.currentPage + 1}" class="btn btn-secondary btn-sm">
                            Next →
                        </a>
                    </c:if>
                </div>
            </div>
        </c:if>
    </c:when>
    <c:otherwise>
        <div class="panel" style="text-align:center; padding:3rem 1.5rem;">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
            <h3 style="font-size:1.15rem; font-weight:600;">No matching questions found</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.25rem;">Try adjusting your search criteria or topic filter.</p>
            <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary btn-sm" style="margin-top:1rem;">Reset Filters</a>
        </div>
    </c:otherwise>
</c:choose>

<script>
    function toggleDetails(id) {
        const card = document.getElementById('card-' + id);
        if (card) {
            card.classList.toggle('open');
        }
    }
</script>

<%@ include file="footer.jspf" %>
