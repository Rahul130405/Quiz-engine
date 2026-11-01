<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuizEngine Administrator Login</title>
    <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/static/css/admin.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/static/css/admin.css">
</head>
<body class="login-canvas">

    <div class="login-card-container">
        <!-- Header & Branding -->
        <div class="login-header">
            <div class="login-brand-icon">⚡</div>
            <h1 class="login-title">Administrator Sign In</h1>
            <p class="login-subtitle">QuizEngine Enterprise Management &amp; Analytics Console</p>
        </div>

        <!-- Body & Form -->
        <div class="login-body">
            <!-- Feedback Alerts -->
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger" role="alert">
                    <span>⚠️</span>
                    <div><c:out value="${errorMessage}" /></div>
                </div>
            </c:if>

            <c:if test="${not empty infoMessage}">
                <div class="alert alert-success" role="alert">
                    <span>✅</span>
                    <div><c:out value="${infoMessage}" /></div>
                </div>
            </c:if>

            <!-- Segmented Authentication Tab Switch -->
            <div class="auth-tab-segment" role="tablist">
                <button type="button" class="auth-tab-btn active" id="tab-account" role="tab">
                    👤 Account Login
                </button>
                <button type="button" class="auth-tab-btn" id="tab-token" role="tab">
                    🔑 JWT Token Bridge
                </button>
            </div>

            <!-- Authentication Form -->
            <form method="POST" action="${pageContext.request.contextPath}/admin/login" id="adminLoginForm" novalidate>
                <input type="hidden" name="authMethod" id="authMethodInput" value="credentials">

                <!-- Account Credentials Panel -->
                <div id="panel-account">
                    <div class="form-group">
                        <label class="form-label" for="adminEmailInput">
                            Administrator Email <span class="required-dot">*</span>
                        </label>
                        <div class="input-with-icon">
                            <span class="input-icon-prefix">✉️</span>
                            <input type="text" id="adminEmailInput" name="email" class="form-control"
                                   placeholder="e.g. yashckp@.admin" autocomplete="username" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="adminPasswordInput">
                            Password <span class="required-dot">*</span>
                        </label>
                        <div class="input-with-icon">
                            <span class="input-icon-prefix">🔒</span>
                            <input type="password" id="adminPasswordInput" name="password" class="form-control"
                                   placeholder="••••••••••••" autocomplete="current-password" required>
                            <button type="button" class="password-toggle-btn" id="togglePasswordBtn" title="Toggle password visibility">
                                👁️
                            </button>
                        </div>
                    </div>
                </div>

                <!-- JWT Direct Token Panel -->
                <div id="panel-token" style="display: none;">
                    <div class="form-group">
                        <label class="form-label" for="adminTokenInput">
                            Admin JWT Token <span class="required-dot">*</span>
                        </label>
                        <div class="input-with-icon">
                            <span class="input-icon-prefix">🔑</span>
                            <textarea id="adminTokenInput" name="adminToken" class="form-control"
                                      placeholder="Paste signed HS256 admin JWT token (role=admin)..."
                                      style="min-height: 110px; font-family: monospace; font-size: 0.8rem;"></textarea>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 0.25rem;">
                            Direct cryptographically signed token verification with constant-time HMAC check.
                        </span>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginSubmitBtn" style="margin-top: 1.5rem;">
                    Sign In to Admin Portal
                </button>
            </form>

            <!-- Security Badge Footer -->
            <div class="login-footer-security">
                <span>🛡️</span>
                <span>Protected by Session Rotation &amp; Constant-Time Verification</span>
            </div>
        </div>
    </div>

    <!-- Client-side Interactive Scripts -->
    <script src="${pageContext.request.contextPath}/admin/static/js/admin.js"></script>
    <script src="${pageContext.request.contextPath}/static/js/admin.js"></script>
</body>
</html>
