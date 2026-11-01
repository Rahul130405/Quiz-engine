<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="System Dashboard" />
<c:set var="activeNav" value="dashboard" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - QuizEngine Admin</title>
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body>

<%@ include file="header.jspf" %>

<!-- Metric Stat Cards -->
<div class="stats-grid">
    <div class="stat-card">
        <div>
            <div class="stat-label">Total Questions</div>
            <div class="stat-value"><c:out value="${stats.totalQuestions}" /></div>
            <div class="stat-subtext">Authoritative XML datastore</div>
        </div>
        <div class="stat-icon icon-blue">❓</div>
    </div>

    <div class="stat-card">
        <div>
            <div class="stat-label">Active Topics</div>
            <div class="stat-value"><c:out value="${stats.totalTopics}" /></div>
            <div class="stat-subtext">Curriculum learning graph</div>
        </div>
        <div class="stat-icon icon-purple">📚</div>
    </div>

    <div class="stat-card">
        <div>
            <div class="stat-label">Easy Tier</div>
            <div class="stat-value" style="color: var(--success-text);"><c:out value="${stats.easyQuestions}" /></div>
            <div class="stat-subtext">Foundational tier questions</div>
        </div>
        <div class="stat-icon icon-emerald">🟢</div>
    </div>

    <div class="stat-card">
        <div>
            <div class="stat-label">Medium Tier</div>
            <div class="stat-value" style="color: var(--warning-text);"><c:out value="${stats.mediumQuestions}" /></div>
            <div class="stat-subtext">Intermediate challenge tier</div>
        </div>
        <div class="stat-icon icon-amber">🟡</div>
    </div>

    <div class="stat-card">
        <div>
            <div class="stat-label">Hard Tier</div>
            <div class="stat-value" style="color: var(--danger-text);"><c:out value="${stats.hardQuestions}" /></div>
            <div class="stat-subtext">Advanced mastery tier</div>
        </div>
        <div class="stat-icon icon-rose">🔴</div>
    </div>
</div>

<!-- Detailed Grid Panels -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
    <!-- Topics Breakdown Panel -->
    <div class="panel" style="margin-bottom: 0;">
        <div class="panel-header">
            <h2 class="panel-title">
                <span>📚</span> Repository Topic Curriculum
            </h2>
            <a href="${pageContext.request.contextPath}/admin/topics" class="btn btn-secondary btn-sm">
                Manage Topics
            </a>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Topic</th>
                        <th>Identifier</th>
                        <th>Prerequisites</th>
                        <th>Passing %</th>
                        <th>Questions</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <c:forEach var="item" items="${stats.topicBreakdown}">
                        <tr>
                            <td>
                                <strong style="color: var(--text-primary);"><c:out value="${item.topic.name}" /></strong>
                            </td>
                            <td><span class="code-pill"><c:out value="${item.topic.id}" /></span></td>
                            <td>
                                <c:choose>
                                    <c:when test="${not empty item.topic.prerequisites}">
                                        <c:forEach var="pr" items="${item.topic.prerequisites}">
                                            <span class="badge badge-topic"><c:out value="${pr}" /></span>
                                        </c:forEach>
                                    </c:when>
                                    <c:otherwise>
                                        <span style="color: var(--text-subtle); font-size: 0.8125rem;">None (Root)</span>
                                    </c:otherwise>
                                </c:choose>
                            </td>
                            <td><strong><c:out value="${item.topic.passingScore}" />%</strong></td>
                            <td>
                                <span class="badge badge-topic">
                                    <c:out value="${item.questionCount}" /> Questions
                                </span>
                            </td>
                            <td>
                                <a href="${pageContext.request.contextPath}/admin/questions?topicId=${item.topic.id}" class="btn btn-secondary btn-sm">
                                    View
                                </a>
                            </td>
                        </tr>
                    </c:forEach>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Engine & Security Status Panel -->
    <div class="panel" style="margin-bottom: 0;">
        <div class="panel-header">
            <h2 class="panel-title">
                <span>⚡</span> Engine Integrity
            </h2>
            <span class="badge badge-easy">Online</span>
        </div>
        <div class="panel-body">
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div>
                    <div class="stat-label">Datastore State</div>
                    <div style="font-size: 1rem; font-weight: 700; color: var(--success-text); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>✓</span> Validated &amp; Synchronized
                    </div>
                </div>

                <div>
                    <div class="stat-label">Last Datastore Reload</div>
                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-top: 0.25rem;">
                        <c:out value="${stats.lastLoadedTime}" />
                    </div>
                </div>

                <div>
                    <div class="stat-label">Schema Validation</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                        W3C XML Schema (XSD) with OWASP XXE Protection &amp; Disallow Doctype Decl.
                    </div>
                </div>

                <div>
                    <div class="stat-label">Attempt Persistence Bridge</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                        HMAC-SHA256 Canonical Signing with Constant-Time Signature Comparison.
                    </div>
                </div>

                <div style="border-top: 1px solid var(--border-default); padding-top: 1.25rem; display: flex; gap: 0.75rem;">
                    <a href="${pageContext.request.contextPath}/admin/questions/create" class="btn btn-primary btn-sm" style="flex: 1;">
                        ➕ Add Question
                    </a>
                    <a href="${pageContext.request.contextPath}/api/java/health" target="_blank" class="btn btn-secondary btn-sm">
                        🩺 Health JSON
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<%@ include file="footer.jspf" %>
