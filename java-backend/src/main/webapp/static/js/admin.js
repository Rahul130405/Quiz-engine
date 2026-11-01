/**
 * QuizEngine Enterprise Admin Portal - Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', function () {
    // ─── 1. Login Page Tabs & Controls ───────────────────────────────────
    const tabAccount = document.getElementById('tab-account');
    const tabToken = document.getElementById('tab-token');
    const panelAccount = document.getElementById('panel-account');
    const panelToken = document.getElementById('panel-token');
    const authMethodInput = document.getElementById('authMethodInput');

    if (tabAccount && tabToken && panelAccount && panelToken && authMethodInput) {
        tabAccount.addEventListener('click', function () {
            tabAccount.classList.add('active');
            tabToken.classList.remove('active');
            panelAccount.style.display = 'block';
            panelToken.style.display = 'none';
            authMethodInput.value = 'credentials';
        });

        tabToken.addEventListener('click', function () {
            tabToken.classList.add('active');
            tabAccount.classList.remove('active');
            panelAccount.style.display = 'none';
            panelToken.style.display = 'block';
            authMethodInput.value = 'token';
        });
    }

    // Password Visibility Toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('adminPasswordInput');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.innerHTML = '👁️‍🗨️';
                togglePasswordBtn.setAttribute('title', 'Hide password');
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.innerHTML = '👁️';
                togglePasswordBtn.setAttribute('title', 'Show password');
            }
        });
    }

    // Login Form Submit State
    const loginForm = document.getElementById('adminLoginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    if (loginForm && loginSubmitBtn) {
        loginForm.addEventListener('submit', function () {
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<span class="spinner">⏳</span> Authenticating...';
            loginSubmitBtn.style.opacity = '0.75';
        });
    }

    // ─── 2. Question Cards Collapsible Accordion ────────────────────────
    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
        const header = card.querySelector('.question-header');
        if (header) {
            header.addEventListener('click', function (e) {
                // Don't toggle if an edit or delete button was clicked
                if (e.target.closest('a') || e.target.closest('button')) {
                    return;
                }
                card.classList.toggle('open');
                const chevron = card.querySelector('.accordion-chevron');
                if (chevron) {
                    chevron.textContent = card.classList.contains('open') ? '▲' : '▼';
                }
            });
        }
    });

    // ─── 3. Confirmation Dialog for Destructive Actions (Delete) ────────
    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteForm = document.getElementById('deleteConfirmForm');
    const deleteQuestionIdInput = document.getElementById('deleteQuestionIdInput');
    const deleteQuestionTargetSpan = document.getElementById('deleteQuestionTargetSpan');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    if (deleteModal && deleteForm) {
        document.querySelectorAll('.btn-trigger-delete').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const qId = btn.getAttribute('data-id');
                if (deleteQuestionIdInput) deleteQuestionIdInput.value = qId;
                if (deleteQuestionTargetSpan) deleteQuestionTargetSpan.textContent = qId;
                deleteModal.classList.add('active');
            });
        });

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', function () {
                deleteModal.classList.remove('active');
            });
        }

        deleteModal.addEventListener('click', function (e) {
            if (e.target === deleteModal) {
                deleteModal.classList.remove('active');
            }
        });
    }
});
