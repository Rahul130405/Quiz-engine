<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="Create New Question" />
<c:set var="activeNav" value="create-question" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Question - QuizEngine Admin</title>
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
            <span>➕</span> Add Question to XML Datastore
        </h2>
        <span class="code-pill">W3C quiz-schema.xsd Enforced</span>
    </div>

    <div class="panel-body">
        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/create">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <!-- ID & Topic -->
                <div class="form-group">
                    <label class="form-label" for="idInput">
                        Question Unique ID <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="idInput" name="id" placeholder="e.g. q-html-21" required
                           pattern="[a-zA-Z0-9_\-]+" title="Alphanumeric with hyphens or underscores only">
                    <small style="color: var(--text-subtle); font-size: 0.75rem; margin-top: 0.25rem;">
                        Must be strictly unique across the XML repository.
                    </small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="topicSelect">
                        Curriculum Topic <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="topicSelect" name="topicId" required>
                        <option value="">-- Select Target Topic --</option>
                        <c:forEach var="t" items="${topics}">
                            <option value="${t.id}"><c:out value="${t.name}" /> (${t.id})</option>
                        </c:forEach>
                    </select>
                </div>

                <!-- Question Statement -->
                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="textStatement">
                        Question Statement <span class="required-dot">*</span>
                    </label>
                    <textarea class="form-control" id="textStatement" name="text" rows="3"
                              placeholder="Enter the complete question prompt..." required minlength="5" maxlength="500"></textarea>
                </div>

                <!-- 4 Options -->
                <div class="form-group">
                    <label class="form-label" for="optA">
                        Option A <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optA" name="optionA" placeholder="Option A text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optB">
                        Option B <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optB" name="optionB" placeholder="Option B text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optC">
                        Option C <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optC" name="optionC" placeholder="Option C text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optD">
                        Option D <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="text" id="optD" name="optionD" placeholder="Option D text" required maxlength="250">
                </div>

                <!-- Correct Answer Selection -->
                <div class="form-group">
                    <label class="form-label" for="correctAnswerSelect">
                        Authoritative Correct Answer <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="correctAnswerSelect" name="correctAnswer" required>
                        <option value="0">Option A (Index 0)</option>
                        <option value="1">Option B (Index 1)</option>
                        <option value="2">Option C (Index 2)</option>
                        <option value="3">Option D (Index 3)</option>
                    </select>
                    <small style="color: var(--text-subtle); font-size: 0.75rem; margin-top: 0.25rem;">
                        Stored server-side only; never leaked through question retrieval endpoints.
                    </small>
                </div>

                <!-- Difficulty & Time Limit -->
                <div class="form-group">
                    <label class="form-label" for="difficultyInput">
                        Difficulty Tier <span class="required-dot">*</span>
                    </label>
                    <select class="form-control" id="difficultyInput" name="difficulty" required>
                        <option value="easy">Easy (1.0x)</option>
                        <option value="medium">Medium (1.5x)</option>
                        <option value="hard">Hard (2.0x)</option>
                    </select>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="timeLimitInput">
                        Time Limit (Seconds) <span class="required-dot">*</span>
                    </label>
                    <input class="form-control" type="number" id="timeLimitInput" name="timeLimitSeconds" value="25" min="5" max="300" required>
                </div>

                <!-- Explanation -->
                <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" for="explanationInput">
                        Pedagogical Explanation
                    </label>
                    <textarea class="form-control" id="explanationInput" name="explanation" rows="3"
                              placeholder="Provide the learning explanation (revealed to student only after quiz evaluation)..." maxlength="600"></textarea>
                </div>
            </div>

            <!-- Form Action Footer -->
            <div style="border-top: 1px solid var(--border-default); padding-top: 1.5rem; margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
                <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary">
                    Cancel
                </a>
                <button type="submit" class="btn btn-primary">
                    <span>💾</span> Save to XML Datastore
                </button>
            </div>
        </form>
    </div>
</div>

<%@ include file="footer.jspf" %>
