// ============================================================
// DeptConnect — Leave Requests Module
// ============================================================

let leavePage = 0;
const leaveSize = 10;
let leaveTotalPages = 0;
let leaveFilter = 'all';

let pendingPage = 0;
const pendingSize = 10;
let pendingTotalPages = 0;

async function loadLeaves(user) {
    const content = document.getElementById('main-content');
    const isApprover = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';
    const canCreate = user.role === 'ROLE_STUDENT' || user.role === 'ROLE_FACULTY';

    content.innerHTML = `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Leave Requests
                </h2>
                <p class="text-sm text-slate-500 mt-1">Submit and track your leave applications</p>
            </div>
            ${canCreate ? `<button onclick="openLeaveModal()" class="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                New Leave Request
            </button>` : ''}
        </div>

        ${user.role !== 'ROLE_HOD' ? `
        <!-- My Leaves Section -->
        <div class="mb-8">
            <!-- Filters -->
            <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button onclick="filterLeaves('all')" class="leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white">All</button>
                <button onclick="filterLeaves('PENDING')" class="leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Pending</button>
                <button onclick="filterLeaves('APPROVED')" class="leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Approved</button>
                <button onclick="filterLeaves('REJECTED')" class="leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Rejected</button>
            </div>

            <!-- Leave List -->
            <div id="leaves-list" class="space-y-4">
                <div class="flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            </div>
            <div id="leave-pagination" class="mt-4"></div>
        </div>` : ''}

        ${isApprover ? `
        <!-- Pending Approval Section -->
        <div class="mt-8 pt-8 border-t border-slate-200">
            <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Pending Approvals
            </h3>
            <div id="pending-list" class="space-y-4">
                <div class="flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            </div>
            <div id="pending-pagination" class="mt-4"></div>
        </div>` : ''}
    `;

    leavePage = 0;
    leaveFilter = 'all';

    if (user.role !== 'ROLE_HOD') {
        await fetchMyLeaves();
    }

    if (isApprover) {
        pendingPage = 0;
        await fetchPendingLeaves();
    }
}

async function fetchMyLeaves() {
    const list = document.getElementById('leaves-list');
    try {
        const data = await LeaveAPI.getMyLeaves(leavePage, leaveSize);
        leaveTotalPages = data.totalPages || 0;
        let items = data.data || [];

        // Client-side filter by status
        if (leaveFilter !== 'all') {
            items = items.filter(l => l.status === leaveFilter);
        }

        if (items.length === 0) {
            list.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-8">${emptyState('No leave requests found')}</div>`;
        } else {
            list.innerHTML = items.map(l => `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                            ${categoryBadge(l.category)}
                            ${statusBadge(l.status)}
                        </div>
                        <span class="text-sm text-slate-400">${formatDate(l.fromDate)} → ${formatDate(l.toDate)}</span>
                    </div>
                    <p class="text-sm text-slate-600 mt-3">${l.reason}</p>
                    <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Approver: ${l.approverName || '—'}</span>
                        <span>Created: ${formatDate(l.createdAt)}</span>
                        ${l.approvedAt ? `<span>${l.status === 'APPROVED' ? 'Approved' : 'Processed'}: ${formatDate(l.approvedAt)}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        renderLeavePagination();
    } catch (e) {
        list.innerHTML = `<div class="text-center text-red-500 py-10">${e.message}</div>`;
    }
}

async function fetchPendingLeaves() {
    const list = document.getElementById('pending-list');
    if (!list) return;
    try {
        const data = await LeaveAPI.getPending(pendingPage, pendingSize);
        pendingTotalPages = data.totalPages || 0;
        const items = data.data || [];

        if (items.length === 0) {
            list.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-8">${emptyState('No pending approvals')}</div>`;
        } else {
            list.innerHTML = items.map(l => `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span class="font-semibold text-slate-800 text-sm truncate block">${l.requesterName || 'Unknown'}</span>
                            <div class="flex flex-wrap items-center gap-2 mt-1">
                                ${categoryBadge(l.category)}
                                ${statusBadge(l.status)}
                            </div>
                        </div>
                        <span class="text-sm text-slate-400">${formatDate(l.fromDate)} → ${formatDate(l.toDate)}</span>
                    </div>
                    <p class="text-sm text-slate-600 mt-3">${l.reason}</p>
                    <div class="flex flex-wrap items-center gap-3 mt-4">
                        <button onclick="approveLeave(${l.id})" class="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            Approve
                        </button>
                        <button onclick="rejectLeavePrompt(${l.id})" class="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            Reject
                        </button>
                    </div>
                </div>
            `).join('');
        }

        renderPendingPagination();
    } catch (e) {
        list.innerHTML = `<div class="text-center text-red-500 py-10">${e.message}</div>`;
    }
}

function renderLeavePagination() {
    const el = document.getElementById('leave-pagination');
    if (leaveTotalPages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <button onclick="leavePrev()" ${leavePage === 0 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${leavePage === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Previous</button>
            <span class="text-sm text-slate-500">Page ${leavePage + 1} of ${leaveTotalPages}</span>
            <button onclick="leaveNext()" ${leavePage >= leaveTotalPages - 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${leavePage >= leaveTotalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Next</button>
        </div>
    `;
}

function renderPendingPagination() {
    const el = document.getElementById('pending-pagination');
    if (!el || pendingTotalPages <= 1) { if (el) el.innerHTML = ''; return; }
    el.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <button onclick="pendingPrev()" ${pendingPage === 0 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${pendingPage === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Previous</button>
            <span class="text-sm text-slate-500">Page ${pendingPage + 1} of ${pendingTotalPages}</span>
            <button onclick="pendingNext()" ${pendingPage >= pendingTotalPages - 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${pendingPage >= pendingTotalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Next</button>
        </div>
    `;
}

function leavePrev() { if (leavePage > 0) { leavePage--; fetchMyLeaves(); } }
function leaveNext() { if (leavePage < leaveTotalPages - 1) { leavePage++; fetchMyLeaves(); } }
function pendingPrev() { if (pendingPage > 0) { pendingPage--; fetchPendingLeaves(); } }
function pendingNext() { if (pendingPage < pendingTotalPages - 1) { pendingPage++; fetchPendingLeaves(); } }

function filterLeaves(status) {
    document.querySelectorAll('.leave-filter-btn').forEach(btn => {
        btn.className = 'leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
    });
    event.target.className = 'leave-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white';
    leaveFilter = status;
    leavePage = 0;
    fetchMyLeaves();
}

// ---------- Create Leave Modal ----------
function openLeaveModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-modal-in" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800">Submit Leave Request</h3>
                    <button onclick="closeModalForce()" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="create-leave-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Leave Category *</label>
                        <select id="leave-category" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm">
                            <option value="SICK">Sick Leave</option>
                            <option value="EXTRA_CURRICULAR">Extra Curricular</option>
                            <option value="MEDICAL">Medical</option>
                            <option value="PERSONAL">Personal</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                        <textarea id="leave-reason" rows="3" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm resize-y" placeholder="Explain the reason for your leave"></textarea>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">From Date *</label>
                            <input id="leave-from" type="date" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">To Date *</label>
                            <input id="leave-to" type="date" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm">
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onclick="closeModalForce()" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('create-leave-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('leave-category').value;
        const reason = document.getElementById('leave-reason').value.trim();
        const fromDate = document.getElementById('leave-from').value;
        const toDate = document.getElementById('leave-to').value;

        if (!category || !reason || !fromDate || !toDate) {
            showToast('Please fill all fields', 'error');
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showToast('From date must be before or equal to To date', 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            await LeaveAPI.create({ category, reason, fromDate, toDate });
            showToast('Leave request submitted!', 'success');
            closeModalForce();
            fetchMyLeaves();
        } catch (err) {
            showToast(err.message || 'Failed to submit leave request', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Request';
        }
    });
}

// ---------- Approve / Reject ----------
async function approveLeave(id) {
    try {
        await LeaveAPI.approve(id);
        showToast('Leave approved!', 'success');
        fetchPendingLeaves();
        fetchMyLeaves();
    } catch (e) {
        showToast(e.message || 'Approval failed', 'error');
    }
}

function rejectLeavePrompt(id) {
    const note = prompt('Rejection reason (optional):');
    rejectLeave(id, note);
}

async function rejectLeave(id, note) {
    try {
        await LeaveAPI.reject(id, note);
        showToast('Leave rejected', 'info');
        fetchPendingLeaves();
        fetchMyLeaves();
    } catch (e) {
        showToast(e.message || 'Rejection failed', 'error');
    }
}
