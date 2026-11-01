<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="pageTitle" value="Topic Curriculum &amp; Graph" />
<c:set var="activeNav" value="topics" />
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Topics &amp; Graph - QuizEngine Admin</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
    <style>
        .topic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
        }
        .topic-card {
            background: #fff;
            border-radius: 10px;
            border: 1px solid var(--border);
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
        }
        .topic-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .topic-body {
            padding: 1.5rem;
            flex: 1;
        }
        .prereq-badge {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid var(--border);
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
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

<div style="margin-bottom:1.5rem; background:#fff; padding:1.25rem 1.5rem; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
    <div>
        <h2 style="font-size:1.15rem; font-weight:700;">Curriculum Progression &amp; Prerequisite Graph</h2>
        <p style="font-size:0.875rem; color:var(--text-muted); margin-top:0.2rem;">
            Prerequisite learning graph validated with cycle-detection DFS algorithm to prevent deadlock.
        </p>
    </div>
    <span class="badge badge-topic" style="font-size:0.85rem; padding:0.4rem 0.8rem;">
        ${topics.size()} Active Modules
    </span>
</div>

<div class="topic-grid">
    <c:forEach var="t" items="${topics}">
        <div class="topic-card">
            <div class="topic-header" style="border-top:4px solid ${t.color};">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <span style="font-size:1.5rem;">${t.icon}</span>
                    <div>
                        <h3 style="font-size:1.05rem; font-weight:700;">${t.name}</h3>
                        <code style="font-size:0.75rem; color:var(--text-muted);">${t.id}</code>
                    </div>
                </div>
                <span class="badge badge-topic">Order: ${t.order}</span>
            </div>

            <div class="topic-body">
                <p style="font-size:0.9rem; color:var(--text-muted); min-height:50px; margin-bottom:1.25rem;">
                    ${t.description}
                </p>

                <div style="display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border); padding-top:1rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                        <span style="color:var(--text-muted);">Passing Threshold:</span>
                        <strong>${t.passingScore}%</strong>
                    </div>

                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; align-items:center;">
                        <span style="color:var(--text-muted);">Prerequisite Dependency:</span>
                        <div>
                            <c:choose>
                                <c:when test="${not empty t.prerequisites}">
                                    <c:forEach var="p" items="${t.prerequisites}">
                                        <span class="prereq-badge">${p}</span>
                                    </c:forEach>
                                </c:when>
                                <c:otherwise>
                                    <span style="color:var(--text-muted); font-size:0.8rem;">None (Foundational)</span>
                                </c:otherwise>
                            </c:choose>
                        </div>
                    </div>
                </div>

                <!-- Safe Metadata Edit Form -->
                <div style="margin-top:1.25rem; border-top:1px solid var(--border); padding-top:1rem;">
                    <details>
                        <summary style="font-size:0.85rem; font-weight:600; color:var(--primary); cursor:pointer;">
                            ⚙️ Edit Topic Settings
                        </summary>
                        <form method="POST" action="${pageContext.request.contextPath}/admin/topics" style="margin-top:1rem;">
                            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}">
                            <input type="hidden" name="id" value="${t.id}">

                            <div class="form-group">
                                <label class="form-label" style="font-size:0.8rem;">Topic Name</label>
                                <input class="form-control" type="text" name="name" value="${t.name}" required style="padding:0.4rem 0.6rem; font-size:0.85rem;">
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size:0.8rem;">Description</label>
                                <textarea class="form-control" name="description" rows="2" style="padding:0.4rem 0.6rem; font-size:0.85rem;">${t.description}</textarea>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                                <div class="form-group">
                                    <label class="form-label" style="font-size:0.8rem;">Passing %</label>
                                    <input class="form-control" type="number" name="passingScore" value="${t.passingScore}" min="1" max="100" style="padding:0.4rem 0.6rem; font-size:0.85rem;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="font-size:0.8rem;">Display Order</label>
                                    <input class="form-control" type="number" name="order" value="${t.order}" min="0" style="padding:0.4rem 0.6rem; font-size:0.85rem;">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" style="font-size:0.8rem;">Prerequisites (Comma-separated IDs)</label>
                                <input class="form-control" type="text" name="prerequisitesCsv"
                                       value="<c:forEach var='p' items='${t.prerequisites}' varStatus='s'>${p}${!s.last ? ', ' : ''}</c:forEach>"
                                       placeholder="e.g. topic-daa" style="padding:0.4rem 0.6rem; font-size:0.85rem;">
                                <small style="color:var(--text-muted); font-size:0.7rem;">Validated against circular graphs.</small>
                            </div>

                            <button type="submit" class="btn btn-primary btn-sm" style="width:100%; margin-top:0.5rem;">
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
