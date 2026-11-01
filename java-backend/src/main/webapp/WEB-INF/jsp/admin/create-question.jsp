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
        <h2 class="panel-title">Add Question to XML Repository</h2>
        <span style="font-size:0.8rem; color:var(--text-muted);">Validated strictly against W3C <code>quiz-schema.xsd</code></span>
    </div>
    <div class="panel-body">
        <form method="POST" action="${pageContext.request.contextPath}/admin/questions/create">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">

            <div class="form-grid">
                <!-- ID and Topic -->
                <div class="form-group">
                    <label class="form-label" for="id">Question ID <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="id" name="id" placeholder="e.g. q-html-21" required
                           pattern="[a-zA-Z0-9_\-]+" title="Alphanumeric with hyphens or underscores only">
                    <small style="color:var(--text-muted); font-size:0.75rem;">Must be unique across the entire XML repository.</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="topicId">Topic <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="topicId" name="topicId" required>
                        <option value="">-- Select Target Topic --</option>
                        <c:forEach var="t" items="${topics}">
                            <option value="${t.id}">${t.name} (${t.id})</option>
                        </c:forEach>
                    </select>
                </div>

                <!-- Question Text -->
                <div class="form-group full-width">
                    <label class="form-label" for="text">Question Statement <span style="color:#ef4444;">*</span></label>
                    <textarea class="form-control" id="text" name="text" rows="3" placeholder="Enter the complete question statement..." required minlength="5" maxlength="500"></textarea>
                </div>

                <!-- 4 Options -->
                <div class="form-group">
                    <label class="form-label" for="optionA">Option A <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionA" name="optionA" placeholder="Option A text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionB">Option B <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionB" name="optionB" placeholder="Option B text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionC">Option C <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionC" name="optionC" placeholder="Option C text" required maxlength="250">
                </div>

                <div class="form-group">
                    <label class="form-label" for="optionD">Option D <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="text" id="optionD" name="optionD" placeholder="Option D text" required maxlength="250">
                </div>

                <!-- Correct Answer Selection -->
                <div class="form-group">
                    <label class="form-label" for="correctAnswer">Designated Correct Answer <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="correctAnswer" name="correctAnswer" required>
                        <option value="0">Option A (Index 0)</option>
                        <option value="1">Option B (Index 1)</option>
                        <option value="2">Option C (Index 2)</option>
                        <option value="3">Option D (Index 3)</option>
                    </select>
                    <small style="color:var(--text-muted); font-size:0.75rem;">Kept secret on server; never leaked to student clients.</small>
                </div>

                <!-- Difficulty -->
                <div class="form-group">
                    <label class="form-label" for="difficulty">Difficulty Level <span style="color:#ef4444;">*</span></label>
                    <select class="form-control" id="difficulty" name="difficulty" required>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <!-- Time Limit -->
                <div class="form-group">
                    <label class="form-label" for="timeLimitSeconds">Time Limit (Seconds) <span style="color:#ef4444;">*</span></label>
                    <input class="form-control" type="number" id="timeLimitSeconds" name="timeLimitSeconds" value="25" min="5" max="300" required>
                </div>

                <!-- Explanation -->
                <div class="form-group full-width">
                    <label class="form-label" for="explanation">Pedagogical Explanation</label>
                    <textarea class="form-control" id="explanation" name="explanation" rows="2" placeholder="Explain why the answer is correct (revealed only upon quiz completion)..." maxlength="600"></textarea>
                </div>
            </div>

            <div style="border-top:1px solid var(--border); padding-top:1.5rem; margin-top:1rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                <a href="${pageContext.request.contextPath}/admin/questions" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">💾 Save to XML Datastore</button>
            </div>
        </form>
    </div>
</div>

<%@ include file="footer.jspf" %>
