<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuizEngine Administrator Login</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
    <style>
        .login-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            padding: 1.5rem;
        }
        .login-card {
            background: #ffffff;
            width: 100%;
            max-width: 440px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        .login-header {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid var(--border);
        }
        .login-body {
            padding: 2rem;
        }
        .auth-tabs {
            display: flex;
            border-bottom: 1px solid var(--border);
            margin-bottom: 1.5rem;
        }
        .auth-tab {
            flex: 1;
            padding: 0.75rem;
            text-align: center;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s ease-in-out;
        }
        .auth-tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body class="login-page">

<div class="login-card">
    <div class="login-header">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; background:linear-gradient(135deg, #4f46e5, #06b6d4); border-radius:10px; margin-bottom:1rem; color:#fff; font-size:1.5rem; font-weight:bold;">
            ⚡
        </div>
        <h1 style="font-size:1.4rem; font-weight:700; color:var(--text-main);">QuizEngine Administration</h1>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">Enterprise Java Servlet &amp; XML Management Portal</p>
    </div>

    <div class="login-body">
        <c:if test="${not empty errorMessage}">
            <div class="alert alert-danger">
                <span>⚠️</span>
                <div>${errorMessage}</div>
            </div>
        </c:if>

        <c:if test="${not empty infoMessage}">
            <div class="alert alert-info">
                <span>ℹ️</span>
                <div>${infoMessage}</div>
            </div>
        </c:if>

        <div class="auth-tabs">
            <div class="auth-tab active" onclick="switchTab('credentials')">Account Login</div>
            <div class="auth-tab" onclick="switchTab('token')">JWT Token Bridge</div>
        </div>

        <!-- Credentials Form (Node Bridge) -->
        <form id="credForm" class="tab-content active" method="POST" action="${pageContext.request.contextPath}/admin/login">
            <input type="hidden" name="authMethod" value="credentials">
            <div class="form-group">
                <label class="form-label" for="email">Administrator Email</label>
                <input class="form-control" type="email" id="email" name="email" placeholder="admin@quizengine.internal" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <input class="form-control" type="password" id="password" name="password" placeholder="••••••••" required>
            </div>
            <button class="btn btn-primary" type="submit" style="width:100%; padding:0.75rem; margin-top:0.5rem;">
                Sign In to Admin Portal
            </button>
        </form>

        <!-- Direct Node JWT Token Form -->
        <form id="tokenForm" class="tab-content" method="POST" action="${pageContext.request.contextPath}/admin/login">
            <input type="hidden" name="authMethod" value="token">
            <div class="form-group">
                <label class="form-label" for="adminToken">Node.js-Issued Admin JWT</label>
                <textarea class="form-control" id="adminToken" name="adminToken" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
                <small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:0.35rem;">
                    Paste a signed HS256 JWT containing <code>role: 'admin'</code> issued by QuizEngine.
                </small>
            </div>
            <button class="btn btn-primary" type="submit" style="width:100%; padding:0.75rem; margin-top:0.5rem;">
                Authenticate with Token
            </button>
        </form>
    </div>
</div>

<script>
    function switchTab(mode) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        if (mode === 'credentials') {
            document.querySelectorAll('.auth-tab')[0].classList.add('active');
            document.getElementById('credForm').classList.add('active');
        } else {
            document.querySelectorAll('.auth-tab')[1].classList.add('active');
            document.getElementById('tokenForm').classList.add('active');
        }
    }
</script>

</body>
</html>
