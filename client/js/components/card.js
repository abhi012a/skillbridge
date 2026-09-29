/**
 * Opportunity Card Component
 */

export function renderOpportunityCard(opp) {
  const match = opp.match || { score: 50, tier: 'Explore', reasons: [] };
  const tierClass = match.score >= 80 ? 'high' : (match.score >= 60 ? 'good' : 'moderate');
  
  // Category styling
  let catClass = 'hackathon';
  let catIcon = '🏆';
  if (opp.category.includes('Internship')) {
    catClass = 'internship';
    catIcon = '💼';
  } else if (opp.category.includes('Scholarship')) {
    catClass = 'scholarship';
    catIcon = '🎓';
  } else if (opp.category.includes('Course') || opp.category.includes('Certification')) {
    catClass = 'course';
    catIcon = '📚';
  } else if (opp.category.includes('Workshop')) {
    catClass = 'workshop';
    catIcon = '💡';
  }

  // Days left calculation
  const deadlineDate = new Date(opp.deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays >= 0 && diffDays <= 14;
  const deadlineText = diffDays < 0 
    ? 'Closed' 
    : (diffDays === 0 ? 'Closes Today' : `${diffDays} days left`);

  const matchedSkillSet = new Set((match.matchedSkills || []).map(s => s.toLowerCase()));

  // Render top 4 skills
  const skillsHtml = (opp.requiredSkills || []).slice(0, 4).map(skill => {
    const isMatched = matchedSkillSet.has(skill.toLowerCase());
    return `<span class="skill-tag ${isMatched ? 'matched' : ''}">${isMatched ? '✓ ' : ''}${skill}</span>`;
  }).join('');

  return `
    <article class="opp-card" data-id="${opp.id}" id="opp-card-${opp.id}">
      <div>
        <div class="card-top">
          <span class="category-tag ${catClass}">${catIcon} ${opp.category}</span>
          <div class="match-badge ${tierClass}" title="${match.reasons.join(' | ')}">
            <span>⚡ ${match.score}% Match</span>
          </div>
        </div>

        <h3 class="card-title">${escapeHtml(opp.title)}</h3>
        <p class="card-organizer">🏛️ ${escapeHtml(opp.organizer)}</p>
        <p class="card-desc">${escapeHtml(opp.description)}</p>

        <div class="card-highlights">
          <span class="highlight-pill">📍 ${opp.mode} (${escapeHtml(opp.location)})</span>
          ${opp.stipendOrPrize ? `<span class="highlight-pill stipend">💰 ${escapeHtml(opp.stipendOrPrize)}</span>` : ''}
          ${opp.isFree ? `<span class="highlight-pill">🆓 Free</span>` : ''}
        </div>

        <div class="card-skills">
          ${skillsHtml}
          ${(opp.requiredSkills || []).length > 4 ? `<span class="skill-tag">+${(opp.requiredSkills.length - 4)} more</span>` : ''}
        </div>
      </div>

      <div class="card-footer">
        <div class="deadline-text ${isUrgent ? 'urgent' : ''}">
          📅 <span>${deadlineText}</span> (${opp.deadline})
        </div>

        <div class="card-actions">
          <button class="icon-btn ${opp.isBookmarked ? 'bookmarked' : ''}" 
                  id="bookmark-btn-${opp.id}" 
                  data-action="toggle-bookmark" 
                  data-id="${opp.id}" 
                  title="${opp.isBookmarked ? 'Remove Bookmark' : 'Save Opportunity'}">
            ${opp.isBookmarked ? '★' : '☆'}
          </button>
          <button class="btn-primary" 
                  id="view-btn-${opp.id}" 
                  data-action="view-details" 
                  data-id="${opp.id}"
                  style="padding: 0.45rem 0.95rem; font-size: 0.82rem;">
            View Details →
          </button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
