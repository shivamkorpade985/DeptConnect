// ============================================================
// DeptConnect — Auth Module (Login & Signup)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // --- LOGIN ---
    if (loginForm) {
        const errorBox = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        // Hide error when user starts typing
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                errorBox.classList.add('hidden');
            });
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorBox.classList.add('hidden');
            const btn = loginForm.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Let browser native validation handle empty/invalid email format
            // This handler only runs after native validation passes

            btn.disabled = true;
            btn.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> Signing in...`;

            try {
                const data = await AuthAPI.login({ email, password });
                setAuth(data.jwt, data.user);
                showToast('Login successful!', 'success');
                setTimeout(() => (window.location.replace('dashboard.html')), 600);
            } catch (err) {
                errorText.textContent = err.message || 'Invalid email or password';
                errorBox.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    }

    // --- SIGNUP ---
    if (signupForm) {
        const roleSelect = document.getElementById('signup-role');
        const teacherGroup = document.getElementById('teacher-group');
        const teacherSelect = document.getElementById('signup-teacher');

        // Show/hide class teacher dropdown
        if (roleSelect) {
            roleSelect.addEventListener('change', async () => {
                if (roleSelect.value === 'ROLE_STUDENT') {
                    teacherGroup.classList.remove('hidden');
                    // Fetch faculties
                    try {
                        const faculties = await UserAPI.getFaculties();
                        teacherSelect.innerHTML = '<option value="">-- Select Class Teacher --</option>';
                        faculties.forEach((f) => {
                            teacherSelect.innerHTML += `<option value="${f.id}">${f.fullName}</option>`;
                        });
                    } catch (err) {
                        showToast('Could not load faculties', 'error');
                    }
                } else {
                    teacherGroup.classList.add('hidden');
                    teacherSelect.innerHTML = '<option value="">-- Select Class Teacher --</option>';
                }
            });
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');
            const fullName = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const role = document.getElementById('signup-role').value;

            if (!fullName || !email || !password || !role) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            const body = { fullName, email, password, role };

            if (role === 'ROLE_STUDENT') {
                const teacherId = document.getElementById('signup-teacher').value;
                if (!teacherId) {
                    showToast('Please select a class teacher', 'error');
                    return;
                }
                body.classTeacherId = parseInt(teacherId);
            }

            btn.disabled = true;
            btn.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> Creating account...`;

            try {
                const data = await AuthAPI.signup(body);
                showToast(data.message || 'Account created!', 'success');
                setTimeout(() => (window.location.replace('login.html')), 1200);
            } catch (err) {
                showToast(err.message || 'Signup failed', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    }
});
