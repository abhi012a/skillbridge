/**
 * SkillBridge Main Single Page Application Controller
 */

import { renderOpportunityCard } from './components/card.js';
import { renderDetailsModal, generateCalendarICS } from './components/modal.js';
import { renderDashboard } from './components/dashboard.js';
import { renderProfileEditor } from './components/profile.js';

// Application State
const state = {
  currentTab: 'explore', // 'explore', 'dashboard', 'profile'
  opportunities: [],
  profile: null,
  bookmarks: [],
  dashboardData: null,
  searchQuery: '',
  categoryFilter: 'All',
  modeFilter: 'All',
  sortBy: 'recommended',
  onlyFree: false,
  selectedOpportunity: null,
  theme: localStorage.getItem('skillbridge_theme') || localStorage.getItem('opphub_theme') || 'dark'
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  setupNavigation();
  setupEventListeners();
  
  await loadProfile();
  await loadBookmarks();
  await loadOpportunities();
});

// --- Theme Management ---
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('skillbridge_theme', theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// --- Navigation & Views ---
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  const userPill = document.getElementById('navUserPill');
  if (userPill) {
    userPill.addEventListener('click', () => switchTab('profile'));
  }

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
  }

  const openSubmitBtn = document.getElementById('openSubmitModalBtn');
  if (openSubmitBtn) {
    openSubmitBtn.addEventListener('click', () => openSubmitModal());
  }
}

export function switchTab(tab) {
  state.currentTab = tab;

  // Update nav button active states
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle visible sections
  const exploreView = document.getElementById('exploreView');
  const dashboardView = document.getElementById('dashboardView');
  const profileView = document.getElementById('profileView');
  const heroSection = document.getElementById('heroSection');

  exploreView.style.display = tab === 'explore' ? 'block' : 'none';
  dashboardView.style.display = tab === 'dashboard' ? 'block' : 'none';
  profileView.style.display = tab === 'profile' ? 'block' : 'none';

  if (tab === 'explore') {
    heroSection.style.display = 'block';
    renderExploreView();
  } else if (tab === 'dashboard') {
    heroSection.style.display = 'none';
    loadDashboard();
  } else if (tab === 'profile') {
    heroSection.style.display = 'none';
    renderProfileView();
  }
}

// --- API Calls ---
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    state.profile = await res.json();
    updateNavUserPill();
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

async function loadBookmarks() {
  try {
    const res = await fetch('/api/bookmarks');
    state.bookmarks = await res.json();
  } catch (err) {
    console.error('Failed to load bookmarks:', err);
  }
}

async function loadOpportunities() {
  try {
    const params = new URLSearchParams({
      search: state.searchQuery,
      category: state.categoryFilter,
      mode: state.modeFilter,
      sortBy: state.sortBy,
      isFree: state.onlyFree ? 'true' : 'false'
    });

    const res = await fetch(`/api/opportunities?${params.toString()}`);
    const data = await res.json();
    state.opportunities = data.opportunities || [];
    renderExploreView();
  } catch (err) {
    console.error('Failed to load opportunities:', err);
    showToast('Error loading opportunities from server', 'error');
  }
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    state.dashboardData = await res.json();
    await loadBookmarks();
    renderDashboardView();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function updateNavUserPill() {
  const nameEl = document.getElementById('navUserName');
  const avatarEl = document.getElementById('navUserAvatar');
  if (state.profile && nameEl && avatarEl) {
    nameEl.textContent = state.profile.name || 'Student';
    avatarEl.textContent = (state.profile.name || 'S').charAt(0).toUpperCase();
  }
}

// --- Render Functions ---
function renderExploreView() {
  const container = document.getElementById('oppsGridContainer');
  const countEl = document.getElementById('resultsCount');

  if (countEl) {
    countEl.textContent = `Showing ${state.opportunities.length} opportunities`;
  }

  if (!container) return;

  if (state.opportunities.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">No matching opportunities found</h3>
        <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem auto;">
          Try adjusting your search keywords, clearing filters, or switching category tags.
        </p>
        <button class="btn-secondary" id="resetFiltersBtn">Reset All Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.searchQuery = '';
        state.categoryFilter = 'All';
        state.modeFilter = 'All';
        state.onlyFree = false;
        state.sortBy = 'recommended';
        
        document.getElementById('searchInput').value = '';
        document.getElementById('modeFilter').value = 'All';
        document.getElementById('sortBy').value = 'recommended';
        document.getElementById('freeFilter').checked = false;

        document.querySelectorAll('.cat-pill').forEach(pill => {
          pill.classList.toggle('active', pill.getAttribute('data-cat') === 'All');
        });

        loadOpportunities();
      });
    }
    return;
  }

  container.innerHTML = state.opportunities.map(opp => renderOpportunityCard(opp)).join('');
}

function renderDashboardView() {
  const container = document.getElementById('dashboardView');
  if (!container || !state.dashboardData) return;

  container.innerHTML = renderDashboard(
    state.dashboardData,
    state.bookmarks,
    handleStatusChange,
    handleDeleteBookmark,
    handleAddSkill,
    openDetailsModal
  );
}

function renderProfileView() {
  const container = document.getElementById('profileView');
  if (!container || !state.profile) return;

  container.innerHTML = renderProfileEditor(state.profile, handleSaveProfile, handleResetProfile);
  attachProfileEventListeners();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Search with debounce
  const searchInput = document.getElementById('searchInput');
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        loadOpportunities();
      }, 250);
    });
  }

  // Category Pills
  const catPills = document.querySelectorAll('.cat-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.categoryFilter = pill.getAttribute('data-cat');
      loadOpportunities();
    });
  });

  // Mode Filter
  const modeFilter = document.getElementById('modeFilter');
  if (modeFilter) {
    modeFilter.addEventListener('change', (e) => {
      state.modeFilter = e.target.value;
      loadOpportunities();
    });
  }

  // Sort Filter
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      loadOpportunities();
    });
  }

  // Free Only Checkbox
  const freeFilter = document.getElementById('freeFilter');
  if (freeFilter) {
    freeFilter.addEventListener('change', (e) => {
      state.onlyFree = e.target.checked;
      loadOpportunities();
    });
  }

  // Global Click delegation for Cards & Dashboard actions
  document.addEventListener('click', async (e) => {
    // View Details Button
    const viewBtn = e.target.closest('[data-action="view-details"]');
    if (viewBtn) {
      const oppId = viewBtn.getAttribute('data-id');
      await openDetailsModal(oppId);
      return;
    }

    // Toggle Bookmark Button
    const bookmarkBtn = e.target.closest('[data-action="toggle-bookmark"]');
    if (bookmarkBtn) {
      const oppId = bookmarkBtn.getAttribute('data-id');
      await toggleBookmark(oppId);
      return;
    }

    // Delete Bookmark from Dashboard
    const deleteBtn = e.target.closest('[data-action="delete-bookmark"]');
    if (deleteBtn) {
      const oppId = deleteBtn.getAttribute('data-id');
      await handleDeleteBookmark(oppId);
      return;
    }

    // Add In-Demand Skill from Dashboard Gap Matrix
    const gapPill = e.target.closest('[data-action="add-gap-skill"]');
    if (gapPill) {
      const skillName = gapPill.getAttribute('data-skill');
      await handleAddSkill(skillName);
      return;
    }

    // Close Details Modal overlay click
    if (e.target.id === 'detailsModalOverlay' || e.target.id === 'closeDetailsModal') {
      closeDetailsModal();
      return;
    }

    // Close Submit Modal
    if (e.target.id === 'submitModalOverlay' || e.target.id === 'closeSubmitModal') {
      closeSubmitModal();
      return;
    }

    // Export Calendar Button in modal
    const exportCalBtn = e.target.closest('#exportCalendarBtn');
    if (exportCalBtn && state.selectedOpportunity) {
      generateCalendarICS(state.selectedOpportunity);
      showToast('Downloaded .ics calendar reminder!', 'success');
      return;
    }

    // Save Tracker Status in modal
    const saveTrackerBtn = e.target.closest('#saveTrackerBtn');
    if (saveTrackerBtn && state.selectedOpportunity) {
      const status = document.getElementById('modalTrackStatus').value;
      const notes = document.getElementById('modalTrackNotes').value;
      await updateBookmark(state.selectedOpportunity.id, status, notes);
      showToast(`Application updated to: ${status}`, 'success');
      return;
    }
  });

  // Change status select in pipeline
  document.addEventListener('change', async (e) => {
    if (e.target.getAttribute('data-action') === 'change-status') {
      const oppId = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      await handleStatusChange(oppId, newStatus);
    }
  });

  // Submit opportunity form submit
  const submitForm = document.getElementById('submitOpportunityForm');
  if (submitForm) {
    submitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSubmitOpportunity(new FormData(submitForm));
    });
  }
}

// --- Opportunity Modal Controller ---
async function openDetailsModal(oppId) {
  try {
    const res = await fetch(`/api/opportunities/${oppId}`);
    if (!res.ok) throw new Error('Opportunity not found');
    const opp = await res.json();
    state.selectedOpportunity = opp;

    const modalOverlay = document.getElementById('detailsModalOverlay');
    modalOverlay.innerHTML = renderDetailsModal(opp, opp.bookmarkInfo);
    modalOverlay.classList.add('active');
  } catch (err) {
    console.error('Failed to open modal:', err);
    showToast('Failed to open opportunity details', 'error');
  }
}

function closeDetailsModal() {
  const modalOverlay = document.getElementById('detailsModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

function openSubmitModal() {
  const modalOverlay = document.getElementById('submitModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.add('active');
  }
}

function closeSubmitModal() {
  const modalOverlay = document.getElementById('submitModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// --- Bookmarks Controller ---
async function toggleBookmark(oppId) {
  const isBookmarked = state.bookmarks.some(b => b.opportunityId === oppId);
  if (isBookmarked) {
    await handleDeleteBookmark(oppId);
  } else {
    await updateBookmark(oppId, 'Saved', '');
    showToast('Saved to your dashboard!', 'success');
  }
}

async function updateBookmark(opportunityId, status, notes) {
  try {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId, status, notes })
    });
    if (!res.ok) throw new Error('Failed to update bookmark');
    await loadBookmarks();
    await loadOpportunities();
    if (state.currentTab === 'dashboard') {
      await loadDashboard();
    }
  } catch (err) {
    console.error('Error updating bookmark:', err);
    showToast('Error saving opportunity', 'error');
  }
}

async function handleDeleteBookmark(oppId) {
  try {
    const res = await fetch(`/api/bookmarks/${oppId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete bookmark');
    await loadBookmarks();
    await loadOpportunities();
    if (state.currentTab === 'dashboard') {
      await loadDashboard();
    }
    showToast('Bookmark removed', 'info');
  } catch (err) {
    console.error('Error removing bookmark:', err);
  }
}

async function handleStatusChange(oppId, newStatus) {
  const existing = state.bookmarks.find(b => b.opportunityId === oppId);
  const notes = existing ? existing.notes : '';
  await updateBookmark(oppId, newStatus, notes);
  showToast(`Moved to ${newStatus}`, 'success');
}

// --- Profile Controller ---
function attachProfileEventListeners() {
  const profileForm = document.getElementById('profileForm');
  const skillsContainer = document.getElementById('skillsTagContainer');
  const newSkillInput = document.getElementById('newSkillInput');
  const resetBtn = document.getElementById('resetProfileBtn');

  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetProfile);
  }

  // Remove skill tag
  skillsContainer.addEventListener('click', (e) => {
    if (e.target.getAttribute('data-action') === 'remove-skill') {
      const skill = e.target.getAttribute('data-skill');
      state.profile.skills = state.profile.skills.filter(s => s.toLowerCase() !== skill.toLowerCase());
      renderProfileView();
    }
  });

  // Quick add skill
  document.querySelectorAll('[data-action="quick-add-skill"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = btn.getAttribute('data-skill');
      if (!state.profile.skills.includes(skill)) {
        state.profile.skills.push(skill);
        renderProfileView();
      }
    });
  });

  // Enter to add skill
  if (newSkillInput) {
    newSkillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = newSkillInput.value.trim();
        if (val && !state.profile.skills.some(s => s.toLowerCase() === val.toLowerCase())) {
          state.profile.skills.push(val);
          renderProfileView();
        }
      }
    });
  }

  // Submit profile form
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveProfile();
    });
  }
}

async function handleSaveProfile() {
  const selectedCategories = Array.from(document.querySelectorAll('input[name="prefCat"]:checked')).map(cb => cb.value);

  const updated = {
    name: document.getElementById('profileName').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    university: document.getElementById('profileUniversity').value.trim(),
    degree: document.getElementById('profileDegree').value.trim(),
    educationLevel: document.getElementById('profileEduLevel').value,
    graduationYear: parseInt(document.getElementById('profileGradYear').value, 10),
    skills: state.profile.skills || [],
    interests: document.getElementById('profileInterests').value.split(',').map(i => i.trim()).filter(Boolean),
    preferredCategories: selectedCategories,
    preferredMode: document.getElementById('profileMode').value,
    bio: document.getElementById('profileBio').value.trim()
  };

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    state.profile = data.profile;
    updateNavUserPill();
    showToast('Profile updated & opportunities re-ranked!', 'success');
    
    // Reload opportunities to re-score
    await loadOpportunities();
  } catch (err) {
    console.error('Failed to update profile:', err);
    showToast('Failed to update profile', 'error');
  }
}

async function handleResetProfile() {
  try {
    const res = await fetch('/api/profile/reset', { method: 'POST' });
    const data = await res.json();
    state.profile = data.profile;
    updateNavUserPill();
    renderProfileView();
    await loadOpportunities();
    showToast('Profile reset to demo defaults', 'info');
  } catch (err) {
    console.error('Failed to reset profile:', err);
  }
}

async function handleAddSkill(skillName) {
  if (!state.profile.skills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
    state.profile.skills.push(skillName);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: state.profile.skills })
      });
      showToast(`Added ${skillName} to your skills!`, 'success');
      await loadOpportunities();
      await loadDashboard();
    } catch (err) {
      console.error('Error adding skill:', err);
    }
  }
}

// --- Submit Opportunity Controller ---
async function handleSubmitOpportunity(formData) {
  const payload = {
    title: formData.get('title'),
    category: formData.get('category'),
    organizer: formData.get('organizer'),
    mode: formData.get('mode'),
    location: formData.get('location'),
    deadline: formData.get('deadline'),
    stipendOrPrize: formData.get('stipendOrPrize'),
    applyUrl: formData.get('applyUrl'),
    description: formData.get('description'),
    eligibility: formData.get('eligibility'),
    requiredSkills: formData.get('requiredSkills'),
    interests: formData.get('interests'),
    isFree: formData.get('isFree') === 'on'
  };

  try {
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to submit opportunity');
    }

    closeSubmitModal();
    document.getElementById('submitOpportunityForm').reset();
    showToast('Opportunity successfully listed in catalog!', 'success');
    await loadOpportunities();
  } catch (err) {
    console.error('Submission error:', err);
    showToast(err.message, 'error');
  }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
