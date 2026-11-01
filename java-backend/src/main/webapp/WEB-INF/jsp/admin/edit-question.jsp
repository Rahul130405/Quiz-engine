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
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body>

<%@ include file="header.jspf" %>

<c:if test="${not empty errorMessage}">
    <div class="alert alert-danger">
        <span>⚠️</span>
        <div><c:out value="${errorMessage}" /></div>
    </div>
</c:if>

<div class="panel" style="max-width: 920px; margin: 0 auto;">
    <div class="panel-header">
        <h2 class="panel-title">
            <span>✏️</span> Edit Question: <span class="code-pill"><c:out value="${question.id}" /></span>
        </h2>
        <span class="code-pill">Atomic XML Update</span>
    </div>

    <div class="panel-body">
        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/edit">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <!-- Immutable Identifier & Topic -->
                <div class="form-group">
                    <label class="form-label" for="idInput">
                        Question Identifier (Immutable)
                    </label>
                    <input class="form-control" type="text" id="idInput" name="id" value="${question.id}" readonly
                           style="background-color: var(--bg-surface-elevated); color: var(--text-muted); cursor: not-allowed;">
                    <small style="color: var(--text-subtle); font-size: 0.75rem; margin-top: 0.25rem;">
                        Question identity is preserved to maintain attempt history integrity.
                    </small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="topicSelect">
                        Curriculum Topic <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="topicSelect" name="topicId" required>
                        <c:forEach var="t" items="${topics}">
                            <option value="${t.id}" ${question.topicId == t.id ? 'selected' : ''}>
                                <c:out value="${t.name}" /> (${t.id})
                            </option>
                        </c:forEach>
                    </select>
                </div>

                <!-- Question Prompt -->
                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="textStatement">
                        Question Statement <span class="required-dot">*</span>
                    </label>
                    <textarea class="form-control" id="textStatement" name="text" rows="3" required minlength="5" maxlength="500"><c:out value="${question.text}" /></textarea>
                </div>

                <!-- 4 Options -->
                <div class="form-group">
                    <label class="form-label" for="optA">
                        Option A <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optA" name="optionA" value="${question.options[0]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optB">
                        Option B <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optB" name="optionB" value="${question.options[1]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optC">
                        Option C <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optC" name="optionC" value="${question.options[2]}" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optD">
                        Option D <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optD" name="optionD" value="${question.options[3]}" required maxlength="250">
                </div>

                <!-- Correct Answer -->
                <div class="form-group">
                    <label class="form-label" for="correctAnswerSelect">
                        Authoritative Correct Answer <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="correctAnswerSelect" name="correctAnswer" required>
                        <option value="0" ${question.correctAnswer == 0 ? 'selected' : ''}>Option A (Index 0)</option>
                        <option value="1" ${question.correctAnswer == 1 ? 'selected' : ''}>Option B (Index 1)</option>
                        <option value="2" ${question.correctAnswer == 2 ? 'selected' : ''}>Option C (Index 2)</option>
                        <option value="3" ${question.correctAnswer == 3 ? 'selected' : ''}>Option D (Index 3)</option>
                    </select>
                </div>

                <!-- Difficulty & Time Limit -->
                <div class="form-group">
                    <label class="form-label" for="difficultyInput">
                        Difficulty Tier <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="difficultyInput" name="difficulty" required>
                        <option value="easy" ${question.difficulty == 'easy' ? 'selected' : ''}>Easy (1.0x)</option>
                        <option value="medium" ${question.difficulty == 'medium' ? 'selected' : ''}>Medium (1.5x)</option>
                        <option value="hard" ${question.difficulty == 'hard' ? 'selected' : ''}>Hard (2.0x)</option>
                    </select>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="timeLimitInput">
                        Time Limit (Seconds) <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="number" id="timeLimitInput" name="timeLimitSeconds" value="${question.timeLimitSeconds}" min="5" max="300" required>
                </div>

                <!-- Explanation -->
                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="explanationInput">
                        Pedagogical Explanation
                    </label>
                    <textarea class="form-control" id="explanationInput" name="explanation" rows="3" maxlength="600"><c:out value="${question.explanation}" /></textarea>
                </div>
            </div>

            <!-- Form Action Footer -->
            <div style="border-top: 1px solid var(--border-default); padding-top: 1.5rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary">
                    ← Back to Questions
                </a>
                <button type="submit" class="btn btn-primary">
                    <span>💾</span> Update Question in XML
                </button>
            </div>
        </form>
    </div>
</div>

<%@ include file="footer.jspf" %>
