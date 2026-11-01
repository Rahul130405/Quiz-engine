<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="Edit Question: ${question.id}" />
<c:set var="activeNav" value="questions" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Question - QuizEngine Admin</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
    <style>
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
        }
        .full-width {
            grid-column: span 2;
        }
        @media (max-width: 768px) {
            .form-grid { grid-template-columns: 1fr; }
            .full-width { grid-column: span 1; }
        }
    </style>
</head>
<body>

<%@ include file="header.jspf" %>

<c:if test="${not empty errorMessage}">
    <div class="alert alert-danger">
        <span>⚠️</span>
        <div>${errorMessage}</div>
    </div>
</c:if>

<div class="panel" style="max-width: 860px; margin: 0 auto;">
    <div class="panel-header">
        <h2 class="panel-title">Modify Question: <code>${question.id}</code></h2>
        <span style="font-size:0.8rem; color:var(--text-muted);">Atomic update to authoritative XML datastore</span>
    </div>
    <div class="panel-body">
        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/edit">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">

            <div class="form-grid">
                <!-- Question ID (Read-only identity preservation) -->
                <div class="form-group">
                    <label class="form-label" for="id">Question Identifier (Immutable)</label>
                    <input class="form-control" type="text" id="id" name="id" value="${question.id}" readonly style="background:#f1f5f9; cursor:not-allowed;">
                    <small style="color:var(--text-muted); font-size:0.75rem;">Question identity is preserved to maintain attempt history integrity.</small>
                </div>

                <!-- Topic -->
                <div class="form-group">
                    <label class="form-label" for="topicId">Topic <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="topicId" name="topicId" required>
                        <c:forEach var="t" items="${topics}">
                            <option value="${t.id}" ${question.topicId == t.id ? 'selected' : ''}>${t.name} (${t.id})</option>
                        </c:forEach>
                    </select>
                </div>

                <!-- Question Text -->
                <div class="form-group full-width">
                    <label class="form-label" for="text">Question Statement <span style="color:#ef4444;">*</span></label>
                    <textarea class="form-control" id="text" name="text" rows="3" required minlength="5" maxlength="500">${question.text}</textarea>
                </div>

                <!-- Options A, B, C, D -->
                <div class="form-group">
                    <label class="form-label" for="optionA">Option A <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionA" name="optionA" value="${question.options[0]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionB">Option B <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionB" name="optionB" value="${question.options[1]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionC">Option C <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionC" name="optionC" value="${question.options[2]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionD">Option D <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionD" name="optionD" value="${question.options[3]}" required maxlength="250">
                </div>

                <!-- Correct Answer -->
                <div class="form-group">
                    <label class="form-label" for="correctAnswer">Designated Correct Answer <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="correctAnswer" name="correctAnswer" required>
                        <option value="0" ${question.correctAnswer == 0 ? 'selected' : ''}>Option A (Index 0)</option>
                        <option value="1" ${question.correctAnswer == 1 ? 'selected' : ''}>Option B (Index 1)</option>
                        <option value="2" ${question.correctAnswer == 2 ? 'selected' : ''}>Option C (Index 2)</option>
                        <option value="3" ${question.correctAnswer == 3 ? 'selected' : ''}>Option D (Index 3)</option>
                    </select>
                </div>

                <!-- Difficulty -->
                <div class="form-group">
                    <label class="form-label" for="difficulty">Difficulty Level <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="difficulty" name="difficulty" required>
                        <option value="easy" ${question.difficulty == 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="medium" ${question.difficulty == 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="hard" ${question.difficulty == 'hard' ? 'selected' : ''}>Hard</option>
                    </select>
                </div>

                <!-- Time Limit -->
                <div class="form-group">
                    <label class="form-label" for="timeLimitSeconds">Time Limit (Seconds) <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="number" id="timeLimitSeconds" name="timeLimitSeconds" value="${question.timeLimitSeconds}" min="5" max="300" required>
                </div>

                <!-- Explanation -->
                <div class="form-group full-width">
                    <label class="form-label" for="explanation">Pedagogical Explanation</label>
                    <textarea class="form-control" id="explanation" name="explanation" rows="2" maxlength="600">${question.explanation}</textarea>
                </div>
            </div>

            <div style="border-top:1px solid var(--border); padding-top:1.5rem; margin-top:1rem; display:flex; justify-content:space-between; align-items:center;">
                <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary">← Back to Questions</a>
                <button type="submit" class="btn btn-primary">💾 Update Question in XML</button>
            </div>
        </form>
    </div>
</div>

<%@ include file="footer.jspf" %>
