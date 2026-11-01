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
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body>

<%@ include file="header.jspf" %>

<!-- Metric Stat Cards -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-info">
            <div class="stat-label">Total Questions</div>
            <div class="stat-value">${stats.totalQuestions}</div>
        </div>
        <div class="stat-icon icon-blue">❓</div>
    </div>

    <div class="stat-card">
        <div class="stat-info">
            <div class="stat-label">Active Topics</div>
            <div class="stat-value">${stats.totalTopics}</div>
        </div>
        <div class="stat-icon icon-indigo">📚</div>
    </div>

    <div class="stat-card">
        <div class="stat-info">
            <div class="stat-label">Easy Tier</div>
            <div class="stat-value" style="color:#059669;">${stats.easyQuestions}</div>
        </div>
        <div class="stat-icon icon-emerald">🟢</div>
    </div>

    <div class="stat-card">
        <div class="stat-info">
            <div class="stat-label">Medium Tier</div>
            <div class="stat-value" style="color:#d97706;">${stats.mediumQuestions}</div>
        </div>
        <div class="stat-icon icon-amber">🟡</div>
    </div>

    <div class="stat-card">
        <div class="stat-info">
            <div class="stat-label">Hard Tier</div>
            <div class="stat-value" style="color:#e11d48;">${stats.hardQuestions}</div>
        </div>
        <div class="stat-icon icon-rose">🔴</div>
    </div>
</div>

<!-- Detailed Breakdown Panels -->
<div class="panel-grid">
    <!-- Topics Breakdown Table -->
    <div class="panel">
        <div class="panel-header">
            <h2 class="panel-title">Repository Topic Breakdown</h2>
            <a href="${pageContext.request.contextPath}/admin/topics" class="btn btn-secondary btn-sm">Manage Topics</a>
        </div>
        <div class="panel-body" style="padding:0;">
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
                                    <strong style="color:var(--text-main);">${item.topic.name}</strong>
                                </td>
                                <td><code>${item.topic.id}</code></td>
                                <td>
                                    <c:choose>
                                        <c:when test="${not empty item.topic.prerequisites}">
                                            <c:forEach var="pr" items="${item.topic.prerequisites}">
                                                <span class="badge badge-topic">${pr}</span>
                                            </c:forEach>
                                        </c:when>
                                        <c:otherwise>
                                            <span style="color:var(--text-muted); font-size:0.8rem;">None (Root)</span>
                                        </c:otherwise>
                                    </c:choose>
                                </td>
                                <td><strong>${item.topic.passingScore}%</strong></td>
                                <td>
                                    <span class="badge badge-topic" style="font-weight:700;">${item.questionCount} Questions</span>
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
    </div>

    <!-- Repository & Datastore Health Card -->
    <div class="panel">
        <div class="panel-header">
            <h2 class="panel-title">XML Engine Health</h2>
            <span class="badge badge-healthy">Online</span>
        </div>
        <div class="panel-body">
            <div style="display:flex; flex-direction:column; gap:1.25rem;">
                <div>
                    <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Datastore State</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#15803d; margin-top:0.25rem; display:flex; align-items:center; gap:0.4rem;">
                        <span>✓</span> Validated &amp; Synchronized
                    </div>
                </div>

                <div>
                    <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Last Reload Timestamp</div>
                    <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-top:0.25rem;">
                        ${stats.lastLoadedTime}
                    </div>
                </div>

                <div>
                    <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Schema Enforcement</div>
                    <div style="font-size:0.9rem; color:var(--text-main); margin-top:0.25rem;">
                        Strict W3C XML Schema (XSD) with OWASP XXE Protection
                    </div>
                </div>

                <div style="border-top:1px solid var(--border); padding-top:1rem; margin-top:0.5rem; display:flex; gap:0.5rem;">
                    <a href="${pageContext.request.contextPath}/admin/questions/create" class="btn btn-primary btn-sm" style="flex:1;">
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
