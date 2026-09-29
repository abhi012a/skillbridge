/**
 * Opportunity Details Modal & Calendar Generator Component
 */

export function renderDetailsModal(opp, bookmarkInfo) {
  const match = opp.match || { score: 50, tier: 'Explore', reasons: [] };
  const currentStatus = bookmarkInfo ? bookmarkInfo.status : 'Saved';
  const currentNotes = bookmarkInfo ? bookmarkInfo.notes || '' : '';

  const matchedSkillsHtml = (match.matchedSkills || []).length > 0
    ? match.matchedSkills.map(s => `<span class="skill-tag matched">✓ ${s}</span>`).join(' ')
    : '<span style="font-size:0.85rem; color:var(--text-muted)">No direct skill match yet</span>';

  const missingSkillsHtml = (match.missingSkills || []).length > 0
    ? match.missingSkills.map(s => `<span class="skill-tag" style="border-style:dashed;">+ ${s}</span>`).join(' ')
    : '<span style="font-size:0.85rem; color:var(--text-muted)">You have all key listed skills!</span>';

  const reasonsListHtml = (match.reasons || []).map(r => `<li>🎯 ${r}</li>`).join('');

  return `
    <div class="modal-content" id="detailsModalContent">
      <button class="modal-close-btn" id="closeDetailsModal" aria-label="Close modal">&times;</button>
      
      <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.75rem;">
        <span class="category-tag">${opp.category}</span>
        <span class="highlight-pill">📍 ${opp.mode}</span>
        <span class="highlight-pill">👥 ${opp.educationLevel ? opp.educationLevel.join(', ') : 'Students'}</span>
      </div>

      <h2 style="font-size:1.65rem; font-weight:800; line-height:1.25; margin-bottom:0.4rem;">${opp.title}</h2>
      <p style="color:var(--text-secondary); font-size:0.95rem; margin-bottom:1.25rem;">Hosted by <strong>${opp.organizer}</strong></p>

      <!-- Match Score Insight Box -->
      <div class="match-insight-box">
        <div class="match-insight-header">
          <strong style="color:#a5b4fc; font-size:0.95rem;">⚡ Profile Match: ${match.score}% (${match.tier})</strong>
          <span style="font-size:0.8rem; color:#818cf8;">Tailored to your skills & interests</span>
        </div>
        <ul class="match-reasons-list">
          ${reasonsListHtml}
        </ul>
        <div style="margin-top:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
          <div style="font-size:0.8rem; color:var(--text-secondary);">Skills in your profile: ${matchedSkillsHtml}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">Skills you can learn: ${missingSkillsHtml}</div>
        </div>
      </div>

      <!-- Description -->
      <div style="margin-bottom:1.25rem;">
        <h4 style="font-size:0.95rem; margin-bottom:0.4rem; color:var(--text-primary);">About Opportunity</h4>
        <p style="font-size:0.92rem; color:var(--text-secondary); line-height:1.6;">${opp.description}</p>
      </div>

      <!-- Key Details Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:rgba(255,255,255,0.03); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.5rem;">
        <div>
          <span style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">Deadline</span>
          <div style="font-size:0.95rem; font-weight:700; color:#fb7185;">📅 ${opp.deadline}</div>
        </div>
        <div>
          <span style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">Stipend / Prize</span>
          <div style="font-size:0.95rem; font-weight:700; color:#34d399;">💰 ${opp.stipendOrPrize || 'N/A'}</div>
        </div>
        <div>
          <span style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">Location</span>
          <div style="font-size:0.92rem; color:var(--text-primary);">🌐 ${opp.location || 'Online'}</div>
        </div>
        <div>
          <span style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">Registration Fee</span>
          <div style="font-size:0.92rem; color:var(--text-primary);">${opp.isFree ? '100% Free' : 'Paid / Subsidized'}</div>
        </div>
      </div>

      <!-- Eligibility -->
      <div style="margin-bottom:1.5rem;">
        <h4 style="font-size:0.95rem; margin-bottom:0.4rem; color:var(--text-primary);">Eligibility & Requirements</h4>
        <p style="font-size:0.9rem; color:var(--text-secondary);">${opp.eligibility || 'Open to all students with matching interests.'}</p>
      </div>

      <!-- Application Tracking & Notes -->
      <div style="border-top:1px solid var(--border-color); padding-top:1.25rem; margin-bottom:1.5rem;">
        <h4 style="font-size:0.95rem; margin-bottom:0.75rem; color:var(--text-primary);">📌 Your Application Tracker</h4>
        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:0.75rem; margin-bottom:0.75rem;">
          <div>
            <label style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Status</label>
            <select id="modalTrackStatus" class="form-control" style="padding:0.5rem;">
              <option value="Saved" ${currentStatus === 'Saved' ? 'selected' : ''}>Saved</option>
              <option value="Applied" ${currentStatus === 'Applied' ? 'selected' : ''}>Applied</option>
              <option value="Interviewing" ${currentStatus === 'Interviewing' ? 'selected' : ''}>Interviewing</option>
              <option value="Accepted" ${currentStatus === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Personal Notes</label>
            <input type="text" id="modalTrackNotes" class="form-control" style="padding:0.5rem;" placeholder="e.g. Sent referral request, resume version 3" value="${escapeHtml(currentNotes)}">
          </div>
        </div>
        <button class="btn-secondary" id="saveTrackerBtn" data-id="${opp.id}" style="font-size:0.82rem; padding:0.45rem 0.9rem;">
          💾 Update Application Status & Notes
        </button>
      </div>

      <!-- Modal Footer Action Buttons -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1.25rem;">
        <button class="btn-secondary" id="exportCalendarBtn" data-id="${opp.id}">
          📅 Export to Calendar (.ics)
        </button>

        <a href="${opp.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" id="modalExternalApplyBtn">
          Apply on Official Portal ↗
        </a>
      </div>
    </div>
  `;
}

export function generateCalendarICS(opp) {
  const deadline = new Date(opp.deadline);
  // Set time to 23:59 on deadline
  deadline.setHours(23, 59, 0, 0);

  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatICSDate(deadline);
  // 1 hour event
  const endDate = formatICSDate(new Date(deadline.getTime() + 60 * 60 * 1000));

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillBridge//Student Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:DEADLINE: ${opp.title} (${opp.category})`,
    `DESCRIPTION:Application deadline for ${opp.title} hosted by ${opp.organizer}. Apply link: ${opp.applyUrl}`,
    `URL:${opp.applyUrl}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${opp.title.replace(/[^a-zA-Z0-9]/g, '_')}_Deadline.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
