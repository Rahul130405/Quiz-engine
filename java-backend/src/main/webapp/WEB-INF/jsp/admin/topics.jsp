<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="Topic Curriculum & Graph" />
<c:set var="activeNav" value="topics" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Topics & Graph - QuizEngine Admin</title>
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body>

<%@ include file="header.jspf" %>

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

<!-- Header Banner -->
<div class="panel" style="margin-bottom: 1.75rem;">
    <div class="panel-header">
        <div>
            <h2 class="panel-title">
                <span>📚</span> Curriculum Progression &amp; Prerequisite Graph
            </h2>
            <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem;">
                Prerequisite learning graph validated with cycle-detection DFS algorithm to prevent deadlocks.
            </div>
        </div>
        <span class="badge badge-topic">
            <c:out value="${topics.size()}" /> Active Modules
        </span>
    </div>
</div>

<!-- Topic Cards Grid -->
<div class="topic-grid">
    <c:forEach var="t" items="${topics}">
        <div class="topic-card">
            <div class="topic-card-header" style="border-top: 4px solid ${t.color};">
                <div class="topic-title-group">
                    <div class="topic-icon-badge">
                        <c:out value="${t.icon != null ? t.icon : '📚'}" />
                    </div>
                    <div>
                        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);"><c:out value="${t.name}" /></h3>
                        <span class="code-pill"><c:out value="${t.id}" /></span>
                    </div>
                </div>
                <span class="badge badge-neutral">Order: <c:out value="${t.order}" /></span>
            </div>

            <div class="topic-card-body">
                <p class="topic-description">
                    <c:out value="${t.description}" />
                </p>

                <div style="display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid var(--border-default); padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                        <span style="color: var(--text-muted);">Passing Threshold:</span>
                        <strong style="color: var(--text-primary);"><c:out value="${t.passingScore}" />%</strong>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; align-items: center;">
                        <span style="color: var(--text-muted);">Prerequisite Dependency:</span>
                        <div>
                            <c:choose>
                                <c:when test="${not empty t.prerequisites}">
                                    <c:forEach var="p" items="${t.prerequisites}">
                                        <span class="badge badge-topic"><c:out value="${p}" /></span>
                                    </c:forEach>
                                </c:when>
                                <c:otherwise>
                                    <span style="color: var(--text-subtle); font-size: 0.8125rem;">None (Foundational)</span>
                                </c:otherwise>
                            </c:choose>
                        </div>
                    </div>
                </div>

                <!-- Inline Settings Drawer -->
                <div style="margin-top: auto; border-top: 1px solid var(--border-default); padding-top: 1rem;">
                    <details>
                        <summary style="font-size: 0.8125rem; font-weight: 600; color: var(--accent-blue-light); cursor: pointer; user-select: none;">
                            ⚙️ Edit Topic Settings
                        </summary>
                        <form method="POST" action="${pageContext.request.contextPath}/admin/topics" style="margin-top: 1rem;">
                            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">
                            <input type="hidden" name="id" value="${t.id}">

                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem;">Topic Name</label>
                                <input class="form-control" type="text" name="name" value="${t.name}" required style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem;">Description</label>
                                <textarea class="form-control" name="description" rows="2" style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;"><c:out value="${t.description}" /></textarea>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <div class="form-group">
                                    <label class="form-label" style="font-size: 0.75rem;">Passing %</label>
                                    <input class="form-control" type="number" name="passingScore" value="${t.passingScore}" min="1" max="100" style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="font-size: 0.75rem;">Display Order</label>
                                    <input class="form-control" type="number" name="order" value="${t.order}" min="0" style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem;">Prerequisites (Comma-separated)</label>
                                <input class="form-control" type="text" name="prerequisitesCsv"
                                       value="<c:forEach var='p' items='${t.prerequisites}' varStatus='s'>${p}${!s.last ? ', ' : ''}</c:forEach>"
                                       placeholder="e.g. topic-daa" style="padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
                                <small style="color: var(--text-subtle); font-size: 0.7rem; margin-top: 0.2rem;">Validated against circular cycles.</small>
                            </div>

                            <button type="submit" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.5rem;">
                                💾 Update Module
                            </button>
                        </form>
                    </details>
                </div>
            </div>
        </div>
    </c:forEach>
</div>

<%@ include file="footer.jspf" %>
