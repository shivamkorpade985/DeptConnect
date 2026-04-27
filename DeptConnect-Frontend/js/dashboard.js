// ============================================================
// DeptConnect — Dashboard Module
// ============================================================

let currentTab = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const user = getUser();
    if (!user) { window.location.replace('login.html'); return; }

    renderNavbar(user);
    renderTabs(user);
    initNavigation();
});

function initNavigation() {
    window.addEventListener('popstate', handlePopState);
    
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'announcements', 'leaves', 'documents'].includes(hash)) {
        navigateToTab(hash, false);
    } else {
        history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
        navigateToTab('dashboard', false);
    }
}

function handlePopState(e) {
    if (e.state && e.state.tab) {
        navigateToTab(e.state.tab, false);
    } else {
        const hash = window.location.hash.slice(1);
        if (hash && ['dashboard', 'announcements', 'leaves', 'documents'].includes(hash)) {
            navigateToTab(hash, false);
        } else {
            navigateToTab('dashboard', false);
        }
    }
}

// ---------- Navbar ----------
function renderNavbar(user) {
    const nav = document.getElementById('main-navbar');
    nav.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">DC</div>
                <div>
                    <h1 class="text-base font-bold text-slate-800 leading-tight">Department Connect</h1>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="hidden sm:flex flex-col items-end">
                    <span class="text-sm font-semibold text-slate-700">${user.fullName}</span>
                    <span class="text-xs text-slate-400">${user.email}</span>
                </div>
                ${roleBadge(user.role)}
                <button onclick="logout()" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Logout">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"/></svg>
                </button>
            </div>
        </div>
    `;
}

function logout() {
    clearAuth();
    window.location.replace('login.html');
}

// ---------- Tabs ----------
function renderTabs(user) {
    const tabBar = document.getElementById('tab-bar');
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>` },
        { id: 'announcements', label: 'Announcements', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>` },
        { id: 'leaves', label: 'Leave Requests', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>` },
        { id: 'documents', label: 'Documents', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>` },
    ];

    tabBar.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide md:flex-wrap">
        ${tabs.map(t => `
            <button data-tab="${t.id}" onclick="navigateToTab('${t.id}')" class="tab-btn flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${currentTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
                ${t.icon}${t.label}
            </button>
        `).join('')}
    </div>`;
}

function navigateToTab(tabId, pushToHistory = true) {
    if (pushToHistory && currentTab !== tabId) {
        history.pushState({ tab: tabId }, '', `#${tabId}`);
    }
    currentTab = tabId;
    const user = getUser();
    // update active tab style
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.className = 'tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 bg-indigo-600 text-white shadow-sm';
        } else {
            btn.className = 'tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 text-slate-600 hover:bg-slate-100';
        }
    });

    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="flex justify-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>';

    switch (tabId) {
        case 'dashboard': loadDashboard(user); break;
        case 'announcements': loadAnnouncements(user); break;
        case 'leaves': loadLeaves(user); break;
        case 'documents': loadDocuments(user); break;
    }
}

// ---------- DASHBOARD ----------
async function loadDashboard(user) {
    const content = document.getElementById('main-content');
    const isApprover = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';

    let annCount = 0, leaveCount = 0, docCount = 0, pendingCount = 0;
    let recentAnnouncements = [];
    let recentLeaves = [];

    try {
        const [annData, leaveData, docData] = await Promise.all([
            AnnouncementAPI.getAll(null, 0, 5),
            LeaveAPI.getMyLeaves(0, 5),
            DocumentAPI.getAll(null, 0, 5)
        ]);
        annCount = annData.totalElements || 0;
        leaveCount = leaveData.totalElements || 0;
        docCount = docData.totalElements || 0;
        recentAnnouncements = annData.data || [];
        recentLeaves = leaveData.data || [];

        if (isApprover) {
            try {
                const pendingData = await LeaveAPI.getPending(0, 5);
                pendingCount = pendingData.totalElements || 0;
            } catch (e) { /* might fail for non-approvers */ }
        }
    } catch (e) {
        console.error('Error fetching dashboard stats:', e);
    }

    content.innerHTML = `
        <!-- Welcome Card -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 mb-6 border border-indigo-100">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Welcome back, ${user.fullName}!</h2>
                    <div class="flex items-center gap-2 mt-2">
                        ${roleBadge(user.role)}
                    </div>
                </div>
                <div class="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 hidden sm:flex">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${statsCard('Announcements', annCount, 'Active announcements', 'bg-indigo-100 text-indigo-600', `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>`)}
            ${user.role !== 'ROLE_HOD' ? statsCard('My Leave Requests', leaveCount, 'Total submitted', 'bg-amber-100 text-amber-600', `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`) : ''}
            ${statsCard('Documents', docCount, 'Available documents', 'bg-emerald-100 text-emerald-600', `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`)}
            ${isApprover ? statsCard('Pending Leaves', pendingCount, 'Awaiting approval', 'bg-red-100 text-red-600', `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`) : ''}
        </div>

        <!-- Recent Data -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Announcements -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                        Recent Announcements
                    </h3>
                    <button onclick="navigateToTab('announcements')" class="text-sm text-indigo-600 hover:underline font-medium">View All</button>
                </div>
                ${recentAnnouncements.length === 0 ? emptyState('No announcements yet') : recentAnnouncements.slice(0, 3).map(a => `
                    <div class="py-3 border-b border-slate-100 last:border-b-0">
                        <div class="flex items-start justify-between gap-3">
                            <h4 class="font-semibold text-sm text-slate-800 break-words line-clamp-2">${a.title}</h4>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-amber-100 text-amber-700">${(a.targetRole||'ALL').replace('ROLE_','').toLowerCase()}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-1">${a.body || ''}</p>
                        <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>${formatDate(a.createdAt)}</span>
                            ${a.updatedAt && a.updatedAt !== a.createdAt ? `<span class="italic text-[10px] text-amber-500">• Edited</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${user.role !== 'ROLE_HOD' ? `
            <!-- Recent Leave Requests -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        My Leave Requests
                    </h3>
                    <button onclick="openLeaveModal()" class="text-sm text-indigo-600 hover:underline font-medium">+ New</button>
                </div>
                ${recentLeaves.length === 0 ? emptyState('No leave requests yet') : recentLeaves.slice(0, 3).map(l => `
                    <div class="py-3 border-b border-slate-100 last:border-b-0">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                ${categoryBadge(l.category)}
                                ${statusBadge(l.status)}
                            </div>
                            <span class="text-xs text-slate-400">${formatDate(l.fromDate)} → ${formatDate(l.toDate)}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-1">${l.reason}</p>
                    </div>
                `).join('')}
            </div>` : ''}
        </div>
    `;
}

function statsCard(title, count, subtitle, iconBg, icon) {
    return `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-slate-500">${title}</span>
                <div class="w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center">${icon}</div>
            </div>
            <p class="text-3xl font-bold text-slate-800">${count}</p>
            <p class="text-xs text-slate-400 mt-1">${subtitle}</p>
        </div>
    `;
}

function emptyState(msg) {
    return `<div class="flex flex-col items-center justify-center py-8 text-slate-400">
        <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-sm">${msg}</p>
    </div>`;
}
