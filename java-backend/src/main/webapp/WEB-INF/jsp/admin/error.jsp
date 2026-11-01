<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>QuizEngine - Error</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
    <style>
        .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            background: #f8fafc;
        }
        .error-box {
            background: #fff;
            padding: 2.5rem;
            border-radius: 12px;
            border: 1px solid var(--border);
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body class="error-container">
    <div class="error-box">
        <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
        <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:0.5rem; color:#b91c1c;">Request Error</h2>
        <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:1.5rem;">
            ${errorMessage != null ? errorMessage : "An unexpected error occurred during request processing."}
        </p>
        <a href="${pageContext.request.contextPath}/admin/dashboard" class="btn btn-primary">
            Return to Dashboard
        </a>
    </div>
</body>
</html>
