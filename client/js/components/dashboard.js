/**
 * Student Dashboard & Application Pipeline Component
 */

export function renderDashboard(dashboardData, bookmarksList, onUpdateStatus, onDeleteBookmark, onAddSkill, onViewDetails) {
  const { metrics, upcomingDeadlines, skillGaps } = dashboardData;

  // Pipeline groups
  const pipelineGroups = {
    Saved: [],
    Applied: [],
    Interviewing: [],
    Accepted: []
  };

  (bookmarksList || []).forEach(b => {
    const status = b.status || 'Saved';
    if (pipelineGroups[status]) {
      pipelineGroups[status].push(b);
    } else {
      pipelineGroups.Saved.push(b);
    }
  });

  return `
    <div id="dashboardContainer">
      <!-- Metric Highlights -->
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon saved">🔖</div>
          <div>
            <div class="stat-num" id="statSaved">${metrics.savedCount || 0}</div>
            <div class="stat-label">Saved Opportunities</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon applied">📤</div>
          <div>
            <div class="stat-num" id="statApplied">${metrics.appliedCount || 0}</div>
            <div class="stat-label">Applications Sent</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon interviewing">🎯</div>
          <div>
            <div class="stat-num" id="statInterviewing">${metrics.interviewingCount || 0}</div>
            <div class="stat-label">In Review / Interview</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon accepted">🎉</div>
          <div>
            <div class="stat-num" id="statAccepted">${metrics.acceptedCount || 0}</div>
            <div class="stat-label">Offers & Completed</div>
          </div>
        </div>
      </div>

      <!-- Approaching Deadlines Banner -->
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:2rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
          <h3 style="font-size:1.15rem; font-weight:700; display:flex; align-items:center; gap:0.5rem;">
            ⏰ Approaching Deadlines (Next 90 Days)
          </h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Stay ahead of submission dates</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:1rem;">
          ${(upcomingDeadlines || []).map(opp => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <span style="font-size:0.75rem; font-weight:700; color:#fb7185;">⚠️ ${opp.daysLeft} DAYS LEFT</span>
                  <span style="font-size:0.75rem; color:var(--text-muted);">${opp.deadline}</span>
                </div>
                <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.25rem;">${opp.title}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary);">${opp.organizer}</div>
              </div>
              <div style="margin-top:0.85rem; display:flex; gap:0.5rem;">
                <button class="btn-primary" style="padding:0.35rem 0.75rem; font-size:0.78rem;" data-action="view-details" data-id="${opp.id}">
                  Details
                </button>
                <a href="${opp.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.78rem;">
                  Apply ↗
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Application Tracking Kanban Pipeline -->
      <div class="section-header">
        <h3 class="section-title">📋 Application Tracker</h3>
        <span style="font-size:0.85rem; color:var(--text-secondary);">Keep track of deadlines, personal notes & interviews</span>
      </div>

      <div class="pipeline-container">
        <!-- Column: Saved -->
        <div class="pipeline-col" id="colSaved">
          <div class="pipeline-col-header" style="color:#f59e0b;">
            <span>🔖 Saved (${pipelineGroups.Saved.length})</span>
          </div>
          ${renderPipelineCards(pipelineGroups.Saved)}
        </div>

        <!-- Column: Applied -->
        <div class="pipeline-col" id="colApplied">
          <div class="pipeline-col-header" style="color:#6366f1;">
            <span>📤 Applied (${pipelineGroups.Applied.length})</span>
          </div>
          ${renderPipelineCards(pipelineGroups.Applied)}
        </div>

        <!-- Column: Interviewing -->
        <div class="pipeline-col" id="colInterviewing">
          <div class="pipeline-col-header" style="color:#06b6d4;">
            <span>🎯 In Interview (${pipelineGroups.Interviewing.length})</span>
          </div>
          ${renderPipelineCards(pipelineGroups.Interviewing)}
        </div>

        <!-- Column: Accepted / Completed -->
        <div class="pipeline-col" id="colAccepted">
          <div class="pipeline-col-header" style="color:#10b981;">
            <span>🎉 Accepted / Won (${pipelineGroups.Accepted.length})</span>
          </div>
          ${renderPipelineCards(pipelineGroups.Accepted)}
        </div>
      </div>

      <!-- Skill Gap Matrix -->
      <div class="skill-gap-matrix">
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.3rem;">
          💡 In-Demand Skills to Learn Next
        </h3>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          These skills frequently appear in active listings that aren't on your profile yet. Click to add:
        </p>

        <div class="gap-tags-row">
          ${(skillGaps || []).map(g => `
            <div class="gap-pill" data-action="add-gap-skill" data-skill="${g.skill}">
              <span>+ ${g.skill}</span>
              <span class="gap-count">${g.count} listings</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderPipelineCards(items) {
  if (!items || items.length === 0) {
    return `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.85rem;">No items yet</div>`;
  }

  return items.map(b => {
    const opp = b.opportunity || {};
    return `
      <div class="pipeline-card" data-id="${b.opportunityId}">
        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">${opp.category || 'Opportunity'}</div>
        <strong style="font-size:0.92rem; color:var(--text-primary);">${opp.title || 'Opportunity'}</strong>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${opp.organizer || ''}</div>
        
        ${b.notes ? `<div style="font-size:0.78rem; background:rgba(255,255,255,0.04); padding:0.4rem; border-radius:var(--radius-sm); color:#c7d2fe;">📝 ${escapeHtml(b.notes)}</div>` : ''}

        <div class="pipeline-actions">
          <select class="status-select" data-action="change-status" data-id="${b.opportunityId}">
            <option value="Saved" ${b.status === 'Saved' ? 'selected' : ''}>Saved</option>
            <option value="Applied" ${b.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Interviewing" ${b.status === 'Interviewing' ? 'selected' : ''}>Interviewing</option>
            <option value="Accepted" ${b.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
          </select>

          <div style="display:flex; gap:0.4rem;">
            <button class="icon-btn" style="width:28px; height:28px; font-size:0.75rem;" data-action="view-details" data-id="${b.opportunityId}" title="View Details">
              👁️
            </button>
            <button class="icon-btn" style="width:28px; height:28px; font-size:0.75rem; color:#fb7185;" data-action="delete-bookmark" data-id="${b.opportunityId}" title="Remove">
              ✕
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
