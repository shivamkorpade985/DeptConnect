// ============================================================
// DeptConnect — Announcements Module
// ============================================================

let annPage = 0;
const annSize = 10;
let annTotalPages = 0;
let currentAnnCategory = null;

function annCategoryBadge(cat) {
    if (!cat) return '';
    const map = {
        HOLIDAY: 'bg-green-100 text-green-700',
        PLACEMENT: 'bg-blue-100 text-blue-700',
        EXAM: 'bg-red-100 text-red-700',
        EVENT: 'bg-purple-100 text-purple-700',
        ACADEMIC: 'bg-indigo-100 text-indigo-700',
        CIRCULAR: 'bg-yellow-100 text-yellow-700',
        GENERAL: 'bg-gray-100 text-gray-700'
    };
    const c = map[cat] || 'bg-gray-100 text-gray-700';
    const label = cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c}">${label}</span>`;
}

async function loadAnnouncements(user) {
    const content = document.getElementById('main-content');
    const isCreator = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';

    content.innerHTML = `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                    Announcements
                </h2>
                <p class="text-sm text-slate-500 mt-1">Stay updated with department news and updates</p>
            </div>
            ${isCreator ? `<button onclick="openAnnouncementModal()" class="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Create Announcement
            </button>` : ''}
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button onclick="filterAnnouncements(null, event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white">All</button>
            <button onclick="filterAnnouncements('HOLIDAY', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Holiday</button>
            <button onclick="filterAnnouncements('PLACEMENT', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Placement</button>
            <button onclick="filterAnnouncements('EXAM', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Exam</button>
            <button onclick="filterAnnouncements('EVENT', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Events</button>
            <button onclick="filterAnnouncements('ACADEMIC', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Academics</button>
            <button onclick="filterAnnouncements('CIRCULAR', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Circulars</button>
            <button onclick="filterAnnouncements('GENERAL', event)" class="ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">General</button>
        </div>

        <!-- Announcement List -->
        <div id="announcements-list" class="space-y-4">
            <div class="flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        </div>

        <!-- Pagination -->
        <div id="ann-pagination" class="mt-6"></div>
    `;

    annPage = 0;
    currentAnnCategory = null;
    await fetchAnnouncements();
}

async function fetchAnnouncements() {
    const list = document.getElementById('announcements-list');
    try {
        const data = await AnnouncementAPI.getAll(currentAnnCategory, annPage, annSize);
        annTotalPages = data.totalPages || 0;
        const items = data.data || [];
        const user = getUser();

        if (items.length === 0) {
            list.innerHTML = emptyState('No announcements found');
        } else {
            list.innerHTML = items.map(a => {
                // Determine if user can edit/delete this announcement
                const isOwnerOrHOD = user && (user.role === 'ROLE_HOD' || a.ownerEmail === user.email);
                
                return `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex-1 min-w-0 pr-0 sm:pr-4 w-full">
                            <h3 class="font-semibold text-slate-800 break-words">${a.title}</h3>
                            <div class="flex flex-wrap items-center gap-2 mt-2 sm:mt-1">
                                ${annCategoryBadge(a.category)}
                                ${roleBadge(a.targetRole || 'ALL')}
                            </div>
                        </div>
                        ${isOwnerOrHOD ? `
                        <div class="flex items-center gap-2 shrink-0">
                            <button onclick="editAnnouncement(${a.id})" class="p-2 rounded-xl border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0" title="Edit Announcement">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onclick="deleteAnnouncement(${a.id})" class="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex-shrink-0" title="Delete Announcement">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-wrap items-center gap-x-3 text-sm text-slate-400 mt-2">
                        <span>${formatDateTime(a.createdAt)}</span>
                        ${a.updatedAt && a.updatedAt !== a.createdAt ? `<span class="italic text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">• Edited: ${formatDateTime(a.updatedAt)}</span>` : ''}
                    </div>
                    <p class="text-sm text-slate-600 mt-3">${a.body || ''}</p>
                    <p class="text-xs text-slate-400 mt-3">Posted by: <span class="font-medium">${a.createdByFullName || 'Unknown'}</span></p>
                </div>
            `}).join('');
        }

        renderAnnPagination();
    } catch (e) {
        list.innerHTML = `<div class="text-center text-red-500 py-10">${e.message}</div>`;
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
        await AnnouncementAPI.delete(id);
        showToast('Announcement deleted successfully!', 'success');
        fetchAnnouncements();
    } catch (e) {
        showToast(e.message || 'Failed to delete announcement', 'error');
    }
}

async function editAnnouncement(id) {
    try {
        const a = await AnnouncementAPI.getById(id);
        openEditAnnouncementModal(a);
    } catch (e) {
        showToast('Failed to fetch announcement details', 'error');
    }
}

function openEditAnnouncementModal(a) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-modal-in" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800">Edit Announcement</h3>
                    <button onclick="closeModalForce()" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="edit-ann-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input id="edit-ann-title" type="text" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" value="${a.title}">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                            <select id="edit-ann-category" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                                <option value="HOLIDAY" ${a.category === 'HOLIDAY' ? 'selected' : ''}>Holiday</option>
                                <option value="PLACEMENT" ${a.category === 'PLACEMENT' ? 'selected' : ''}>Placement</option>
                                <option value="EXAM" ${a.category === 'EXAM' ? 'selected' : ''}>Exam</option>
                                <option value="EVENT" ${a.category === 'EVENT' ? 'selected' : ''}>Event</option>
                                <option value="ACADEMIC" ${a.category === 'ACADEMIC' ? 'selected' : ''}>Academic</option>
                                <option value="CIRCULAR" ${a.category === 'CIRCULAR' ? 'selected' : ''}>Circular</option>
                                <option value="GENERAL" ${a.category === 'GENERAL' ? 'selected' : ''}>General</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                            <select id="edit-ann-target" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                                <option value="ALL" ${a.targetRole === 'ALL' || !a.targetRole ? 'selected' : ''}>Everyone / Default</option>
                                <option value="ROLE_STUDENT" ${a.targetRole === 'ROLE_STUDENT' ? 'selected' : ''}>Students Only</option>
                                <option value="ROLE_FACULTY" ${a.targetRole === 'ROLE_FACULTY' ? 'selected' : ''}>Faculty Only</option>
                                <option value="ROLE_HOD" ${a.targetRole === 'ROLE_HOD' ? 'selected' : ''}>HOD Only</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Body *</label>
                        <textarea id="edit-ann-body" rows="4" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-y">${a.body || ''}</textarea>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onclick="closeModalForce()" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Update</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('edit-ann-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('edit-ann-title').value.trim();
        const body = document.getElementById('edit-ann-body').value.trim();
        const category = document.getElementById('edit-ann-category').value;
        const targetRole = document.getElementById('edit-ann-target').value;

        if (!title || !body || !category) { showToast('Please fill in all required fields', 'error'); return; }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const payload = { title, body, category };
            if (targetRole) {
                payload.targetRole = targetRole;
            }
            await AnnouncementAPI.update(a.id, payload);
            showToast('Announcement updated!', 'success');
            closeModalForce();
            fetchAnnouncements();
        } catch (err) {
            showToast(err.message || 'Failed to update announcement', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update';
        }
    });
}

function renderAnnPagination() {
    const el = document.getElementById('ann-pagination');
    if (annTotalPages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <button onclick="annPrev()" ${annPage === 0 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${annPage === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Previous</button>
            <span class="text-sm text-slate-500">Page ${annPage + 1} of ${annTotalPages}</span>
            <button onclick="annNext()" ${annPage >= annTotalPages - 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${annPage >= annTotalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Next</button>
        </div>
    `;
}

function annPrev() { if (annPage > 0) { annPage--; fetchAnnouncements(); } }
function annNext() { if (annPage < annTotalPages - 1) { annPage++; fetchAnnouncements(); } }

function filterAnnouncements(category, event) {
    document.querySelectorAll('.ann-filter-btn').forEach(btn => {
        btn.className = 'ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
    });
    event.target.className = 'ann-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white';
    
    currentAnnCategory = category;
    annPage = 0;
    fetchAnnouncements();
}

// ---------- Create Announcement Modal ----------
function openAnnouncementModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-modal-in" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800">Create Announcement</h3>
                    <button onclick="closeModalForce()" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="create-ann-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input id="ann-title" type="text" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" placeholder="Announcement title">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                            <select id="ann-category" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                                <option value="" disabled selected>Select Category</option>
                                <option value="HOLIDAY">Holiday</option>
                                <option value="PLACEMENT">Placement</option>
                                <option value="EXAM">Exam</option>
                                <option value="EVENT">Event</option>
                                <option value="ACADEMIC">Academic</option>
                                <option value="CIRCULAR">Circular</option>
                                <option value="GENERAL">General</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                            <select id="ann-target" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                                <option value="">Default (Students for Faculty)</option>
                                <option value="ROLE_STUDENT">Students Only</option>
                                <option value="ROLE_FACULTY">Faculty Only</option>
                                <option value="ROLE_HOD">HOD Only</option>
                                <option value="ALL">Everyone</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Body *</label>
                        <textarea id="ann-body" rows="4" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-y" placeholder="Write your announcement..."></textarea>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onclick="closeModalForce()" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Publish</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('create-ann-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ann-title').value.trim();
        const body = document.getElementById('ann-body').value.trim();
        const category = document.getElementById('ann-category').value;
        const targetRole = document.getElementById('ann-target').value || undefined;

        if (!title || !body || !category) { showToast('Please fill in all required fields', 'error'); return; }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        try {
            const payload = { title, body, category };
            if (targetRole) payload.targetRole = targetRole;
            await AnnouncementAPI.create(payload);
            showToast('Announcement published!', 'success');
            closeModalForce();
            fetchAnnouncements();
        } catch (err) {
            showToast(err.message || 'Failed to create announcement', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Publish';
        }
    });
}

function closeModal(e) {
    if (e.target === e.currentTarget) closeModalForce();
}

function closeModalForce() {
    document.getElementById('modal-container').innerHTML = '';
}
