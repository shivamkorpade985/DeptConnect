// ============================================================
// DeptConnect — Documents Module
// ============================================================

let docPage = 0;
const docSize = 9;
let docTotalPages = 0;
let currentDocCategory = null;

function docCategoryBadge(cat) {
    if (!cat) return '';
    const map = {
        SYLLABUS: 'bg-blue-100 text-blue-700',
        NOTES: 'bg-indigo-100 text-indigo-700',
        ASSIGNMENT: 'bg-orange-100 text-orange-700',
        CIRCULAR: 'bg-yellow-100 text-yellow-700',
        FORM: 'bg-green-100 text-green-700',
        QUESTION_PAPER: 'bg-red-100 text-red-700',
        RESULT: 'bg-purple-100 text-purple-700',
        OTHER: 'bg-gray-100 text-gray-700'
    };
    const c = map[cat] || 'bg-slate-100 text-slate-700';
    const label = cat.replace('_', ' ');
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c} uppercase tracking-wider">${label}</span>`;
}

async function loadDocuments(user) {
    const content = document.getElementById('main-content');
    const isUploader = user.role === 'ROLE_FACULTY' || user.role === 'ROLE_HOD';

    content.innerHTML = `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    Document Repository
                </h2>
                <p class="text-sm text-slate-500 mt-1">Access and manage department documents</p>
            </div>
            ${isUploader ? `<button onclick="openUploadModal()" class="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Upload Document
            </button>` : ''}
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button onclick="filterDocs(null, event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white shadow-sm">All</button>
            <button onclick="filterDocs('SYLLABUS', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Syllabus</button>
            <button onclick="filterDocs('NOTES', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Notes</button>
            <button onclick="filterDocs('ASSIGNMENT', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Assignments</button>
            <button onclick="filterDocs('CIRCULAR', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Circulars</button>
            <button onclick="filterDocs('FORM', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Forms</button>
            <button onclick="filterDocs('QUESTION_PAPER', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Question Papers</button>
            <button onclick="filterDocs('RESULT', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Results</button>
            <button onclick="filterDocs('OTHER', event)" class="doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Other</button>
        </div>

        <!-- Documents Grid -->
        <div id="documents-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="col-span-full flex justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        </div>

        <!-- Pagination -->
        <div id="doc-pagination" class="mt-6"></div>
    `;

    docPage = 0;
    await fetchDocuments();
}

async function fetchDocuments() {
    const grid = document.getElementById('documents-grid');
    try {
        const data = await DocumentAPI.getAll(currentDocCategory, docPage, docSize);
        docTotalPages = data.totalPages || 0;
        const items = data.data || [];
        const user = getUser();

        if (items.length === 0) {
            grid.innerHTML = `<div class="col-span-full">${emptyState('No documents found')}</div>`;
        } else {
            grid.innerHTML = items.map(doc => {
                const isOwnerOrHOD = user && (user.role === 'ROLE_HOD' || doc.ownerEmail === user.email);
                return `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col">
                    <div class="flex items-start gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-slate-800 text-sm truncate">${doc.title}</h4>
                            <div class="flex flex-wrap items-center gap-2 mt-1">
                                ${docCategoryBadge(doc.category)}
                                <span class="inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">${(doc.targetRole || 'all').replace('ROLE_', '').toLowerCase()}</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">${doc.description || ''}</p>
                    <div class="flex flex-col gap-1 text-xs text-slate-400 mb-4">
                        <div class="flex items-center justify-between">
                            <span>${doc.readableSize || ''}</span>
                            <span>${formatDate(doc.uploadedAt)}</span>
                        </div>
                        ${doc.editedAt && doc.editedAt !== doc.uploadedAt ? `<span class="italic text-[10px] text-right text-indigo-400">Edited: ${formatDate(doc.editedAt)}</span>` : ''}
                    </div>
                    <p class="text-xs text-slate-400 mb-4">Uploaded by: ${doc.uploadedByFullName || 'Unknown'}</p>
                    <div class="flex gap-2">
                        <a href="${doc.fileUrl}" target="_blank" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download
                        </a>
                        ${isOwnerOrHOD ? `
                        <button onclick="editDocument(${doc.id})" class="px-3 py-2.5 rounded-xl text-sm font-medium border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onclick="deleteDocument(${doc.id})" class="px-3 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>` : ''}
                    </div>
                </div>
            `}).join('');
        }

        renderDocPagination();
    } catch (e) {
        grid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">${e.message}</div>`;
    }
}

function renderDocPagination() {
    const el = document.getElementById('doc-pagination');
    if (docTotalPages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <button onclick="docPrev()" ${docPage === 0 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${docPage === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Previous</button>
            <span class="text-sm text-slate-500">Page ${docPage + 1} of ${docTotalPages}</span>
            <button onclick="docNext()" ${docPage >= docTotalPages - 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 ${docPage >= docTotalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}">Next</button>
        </div>
    `;
}

function docPrev() { if (docPage > 0) { docPage--; fetchDocuments(); } }
function docNext() { if (docPage < docTotalPages - 1) { docPage++; fetchDocuments(); } }

function filterDocs(category, event) {
    document.querySelectorAll('.doc-filter-btn').forEach(btn => {
        btn.className = 'doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors';
    });
    if (event && event.target) {
        event.target.className = 'doc-filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white shadow-sm';
    }
    currentDocCategory = category;
    docPage = 0;
    fetchDocuments();
}

// ---------- Upload Modal ----------
function openUploadModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-modal-in" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800">Upload Document</h3>
                    <button onclick="closeModalForce()" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="upload-doc-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input id="doc-title" type="text" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" placeholder="Document title">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                        <textarea id="doc-desc" rows="3" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-y" placeholder="Describe this document..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                        <select id="doc-category" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                            <option value="">Select Category</option>
                            <option value="SYLLABUS">Syllabus</option>
                            <option value="NOTES">Notes</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="CIRCULAR">Circular</option>
                            <option value="FORM">Form</option>
                            <option value="QUESTION_PAPER">Question Paper</option>
                            <option value="RESULT">Result</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                        <select id="doc-target" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                            <option value="">Default (Students for Faculty)</option>
                            <option value="ROLE_STUDENT">Students Only</option>
                            <option value="ROLE_FACULTY">Faculty Only</option>
                            <option value="ROLE_HOD">HOD Only</option>
                            <option value="ALL">Everyone</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">File *</label>
                        <input id="doc-file" type="file" required class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer">
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onclick="closeModalForce()" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Upload</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('upload-doc-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('doc-title').value.trim();
        const description = document.getElementById('doc-desc').value.trim();
        const category = document.getElementById('doc-category').value;
        const targetRole = document.getElementById('doc-target').value || undefined;
        const fileInput = document.getElementById('doc-file');

        if (!title || !description || !category || !fileInput.files[0]) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Uploading...';

        try {
            const meta = { title, description, category };
            if (targetRole) meta.targetRole = targetRole;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }));

            await DocumentAPI.upload(formData);
            showToast('Document uploaded!', 'success');
            closeModalForce();
            fetchDocuments();
        } catch (err) {
            showToast(err.message || 'Upload failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Upload';
        }
    });
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
        await DocumentAPI.delete(id);
        showToast('Document deleted', 'success');
        fetchDocuments();
    } catch (e) {
        showToast(e.message || 'Delete failed', 'error');
    }
}

async function editDocument(id) {
    try {
        const doc = await DocumentAPI.getById(id);
        openEditUploadModal(doc);
    } catch(e) {
        showToast('Failed to fetch document details', 'error');
    }
}

function openEditUploadModal(doc) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-modal-in" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800">Edit Document</h3>
                    <button onclick="closeModalForce()" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="edit-doc-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input id="edit-doc-title" type="text" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" value="${doc.title}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                        <textarea id="edit-doc-desc" rows="3" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-y">${doc.description || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                        <select id="edit-doc-category" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                            <option value="SYLLABUS" ${doc.category === 'SYLLABUS' ? 'selected' : ''}>Syllabus</option>
                            <option value="NOTES" ${doc.category === 'NOTES' ? 'selected' : ''}>Notes</option>
                            <option value="ASSIGNMENT" ${doc.category === 'ASSIGNMENT' ? 'selected' : ''}>Assignment</option>
                            <option value="CIRCULAR" ${doc.category === 'CIRCULAR' ? 'selected' : ''}>Circular</option>
                            <option value="FORM" ${doc.category === 'FORM' ? 'selected' : ''}>Form</option>
                            <option value="QUESTION_PAPER" ${doc.category === 'QUESTION_PAPER' ? 'selected' : ''}>Question Paper</option>
                            <option value="RESULT" ${doc.category === 'RESULT' ? 'selected' : ''}>Result</option>
                            <option value="OTHER" ${doc.category === 'OTHER' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                        <select id="edit-doc-target" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                            <option value="ALL" ${!doc.targetRole || doc.targetRole === 'ALL' ? 'selected' : ''}>Everyone / Default</option>
                            <option value="ROLE_STUDENT" ${doc.targetRole === 'ROLE_STUDENT' ? 'selected' : ''}>Students Only</option>
                            <option value="ROLE_FACULTY" ${doc.targetRole === 'ROLE_FACULTY' ? 'selected' : ''}>Faculty Only</option>
                            <option value="ROLE_HOD" ${doc.targetRole === 'ROLE_HOD' ? 'selected' : ''}>HOD Only</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">File (Optional - leave empty to keep current)</label>
                        <input id="edit-doc-file" type="file" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer">
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onclick="closeModalForce()" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Update</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('edit-doc-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('edit-doc-title').value.trim();
        const description = document.getElementById('edit-doc-desc').value.trim();
        const category = document.getElementById('edit-doc-category').value;
        const targetRole = document.getElementById('edit-doc-target').value;
        const fileInput = document.getElementById('edit-doc-file');

        if (!title || !description || !category) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const meta = { title, description, category };
            if (targetRole && targetRole !== 'ALL') {
                meta.targetRole = targetRole;
            }

            const formData = new FormData();
            if (fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }
            formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }));

            await DocumentAPI.edit(doc.id, formData);
            showToast('Document updated!', 'success');
            closeModalForce();
            fetchDocuments();
        } catch (err) {
            showToast(err.message || 'Update failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update';
        }
    });
}
