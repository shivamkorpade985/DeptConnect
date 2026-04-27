// ============================================================
// DeptConnect — API Utility Module
// Reusable fetch wrappers for backend integration
// ============================================================

const API_BASE = 'http://localhost:5001';

function getToken() {
    return localStorage.getItem('dc_token');
}

function getUser() {
    const u = localStorage.getItem('dc_user');
    return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
    if (token) localStorage.setItem('dc_token', token);
    localStorage.setItem('dc_user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
}

function authHeaders() {
    const token = getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

function authHeadersMultipart() {
    const token = getToken();
    const h = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

// ---------- error parsing ----------

function parseErrorMessage(text, status) {
    // Map common HTTP status codes to friendly messages
    const friendlyMessages = {
        401: 'Invalid email or password. Please try again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        409: 'This email is already registered.',
        500: 'Something went wrong on the server. Please try again later.',
    };

    // Try to parse as JSON and extract a message field
    if (text) {
        try {
            const json = JSON.parse(text);
            if (json.message) return json.message;
            if (json.error) return json.error;
        } catch (_) {
            // Not JSON — check if it's an HTML error page (Spring Boot Whitelabel)
            if (text.includes('<html') || text.includes('<!DOCTYPE') || text.length > 300) {
                return friendlyMessages[status] || 'Something went wrong. Please try again.';
            }
            // Short plain-text error from backend — use it if it's reasonable
            const cleaned = text.trim();
            if (cleaned.length > 0 && cleaned.length < 200) return cleaned;
        }
    }

    return friendlyMessages[status] || 'Something went wrong. Please try again.';
}

// ---------- generic helpers ----------

async function apiGet(path, params = {}) {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
    });
    const res = await fetch(url.toString(), { headers: authHeaders() });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.json();
}

async function apiPut(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.text();
}

async function apiPostMultipart(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeadersMultipart(),
        body: formData,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.json();
}

async function apiPutMultipart(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: authHeadersMultipart(),
        body: formData,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(parseErrorMessage(err, res.status));
    }
    return res.json();
}

// ---------- Auth endpoints ----------
const AuthAPI = {
    signup: (data) => apiPost('/auth/signup', data),
    login: (data) => apiPost('/auth/login', data),
};

// ---------- User endpoints ----------
const UserAPI = {
    getFaculties: () => apiGet('/api/users/faculties'),
};

// ---------- Announcement endpoints ----------
const AnnouncementAPI = {
    getAll: (category = null, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') =>
        apiGet('/api/announcements', { category, page, size, sortBy, sortDir }),
    getById: (id) => apiGet(`/api/announcements/${id}`),
    create: (data) => apiPost('/api/announcements/create', data),
    update: (id, data) => apiPut(`/api/announcements/update/${id}`, data),
    delete: (id) => apiDelete(`/api/announcements/delete/${id}`),
};

// ---------- Document endpoints ----------
const DocumentAPI = {
    getAll: (category = null, page = 0, size = 10, sortBy = 'uploadedAt', sortDir = 'desc') =>
        apiGet('/api/documents', { category, page, size, sortBy, sortDir }),
    getById: (id) => apiGet(`/api/documents/${id}`),
    upload: (formData) => apiPostMultipart('/api/documents/upload', formData),
    edit: (id, formData) => apiPutMultipart(`/api/documents/edit/${id}`, formData),
    delete: (id) => apiDelete(`/api/documents/delete/${id}`),
};

// ---------- Leave endpoints ----------
const LeaveAPI = {
    create: (data) => apiPost('/api/leaves/create', data),
    getMyLeaves: (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') =>
        apiGet('/api/leaves', { page, size, sortBy, sortDir }),
    getPending: (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') =>
        apiGet('/api/leaves/pending', { page, size, sortBy, sortDir }),
    approve: (id) => apiPut(`/api/leaves/${id}/approve`),
    reject: (id, note) => apiPut(`/api/leaves/${id}/reject`, note ? { note } : {}),
};

// ---------- Toast notification ----------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-indigo-500',
        warning: 'bg-amber-500',
    };
    const icons = {
        success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
        error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>`,
        warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>`,
    };
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-lg ${colors[type]} transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `${icons[type]}<span class="text-sm font-medium">${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.remove('translate-x-full'); toast.classList.add('translate-x-0'); });
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ---------- helpers ----------
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function roleBadge(role) {
    const map = {
        ROLE_STUDENT: { label: 'Student', cls: 'bg-blue-100 text-blue-700' },
        ROLE_FACULTY: { label: 'Faculty', cls: 'bg-purple-100 text-purple-700' },
        ROLE_HOD: { label: 'HOD', cls: 'bg-amber-100 text-amber-700' },
        ROLE_ADMIN: { label: 'Admin', cls: 'bg-red-100 text-red-700' },
    };
    const r = map[role] || { label: role, cls: 'bg-gray-100 text-gray-700' };
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.cls}">${r.label}</span>`;
}

function statusBadge(status) {
    const map = {
        PENDING: { cls: 'bg-amber-100 text-amber-700', icon: '⏳' },
        APPROVED: { cls: 'bg-emerald-100 text-emerald-700', icon: '✓' },
        REJECTED: { cls: 'bg-red-100 text-red-700', icon: '✗' },
    };
    const s = map[status] || { cls: 'bg-gray-100 text-gray-700', icon: '' };
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}">${s.icon} ${status}</span>`;
}

function categoryBadge(cat) {
    const map = {
        SICK: 'bg-red-100 text-red-700',
        EXTRA_CURRICULAR: 'bg-indigo-100 text-indigo-700',
        MEDICAL: 'bg-pink-100 text-pink-700',
        PERSONAL: 'bg-slate-100 text-slate-700',
    };
    const c = map[cat] || 'bg-gray-100 text-gray-700';
    const label = cat ? cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : cat;
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
}

function requireAuth() {
    if (!getToken()) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

// Global check for public pages to redirect logged-in users to dashboard
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase();
    const isPublicPage = path.endsWith('login.html') || path.endsWith('signup.html') || path.endsWith('index.html') || path === '/' || path.endsWith('/frontend/');
    if (isPublicPage && getToken()) {
        window.location.replace('dashboard.html');
    }
});
