<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuizEngine - Error</title>
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body class="login-canvas">
    <div class="login-card-container" style="max-width: 500px; text-align: center; padding: 3rem 2rem;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--danger-text);">
            System Request Notice
        </h2>
        <p style="color: var(--text-muted); font-size: 0.925rem; line-height: 1.6; margin-bottom: 2rem;">
            <c:out value="${errorMessage != null ? errorMessage : 'An error occurred during request processing or session verification.'}" />
        </p>
        <a href="${pageContext.request.contextPath}/admin/dashboard" class="btn btn-primary btn-block btn-lg">
            Return to Dashboard
        </a>
    </div>
</body>
</html>
