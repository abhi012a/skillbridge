/**
 * Student Profile Editor Component
 */

const POPULAR_SKILLS = [
  'Python', 'React', 'JavaScript', 'TypeScript', 'Node.js', 'Go', 'Rust', 'C++',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Machine Learning', 'PyTorch',
  'TensorFlow', 'SQL', 'MongoDB', 'Flutter', 'Figma', 'Solidity', 'Git'
];

const ALL_CATEGORIES = [
  'Hackathons & Competitions',
  'Internships',
  'Scholarships',
  'Courses & Certifications',
  'Workshops'
];

export function renderProfileEditor(profile, onSave, onReset) {
  const currentSkills = profile.skills || [];
  const currentCategories = profile.preferredCategories || [];

  return `
    <div class="profile-card" id="profileCard">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:var(--text-primary);">🎓 Student Profile</h2>
          <p style="font-size:0.88rem; color:var(--text-secondary);">Set your degree, skills, and preferences to match with opportunities</p>
        </div>
        <button class="btn-secondary" id="resetProfileBtn" style="font-size:0.8rem; padding:0.4rem 0.8rem;">
          🔄 Reset to Default
        </button>
      </div>

      <form id="profileForm">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="profileName">Full Name</label>
            <input type="text" id="profileName" class="form-control" value="${escapeHtml(profile.name || '')}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="profileEmail">Student Email</label>
            <input type="email" id="profileEmail" class="form-control" value="${escapeHtml(profile.email || '')}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="profileUniversity">College / University</label>
            <input type="text" id="profileUniversity" class="form-control" value="${escapeHtml(profile.university || '')}">
          </div>

          <div class="form-group">
            <label class="form-label" for="profileDegree">Degree / Major</label>
            <input type="text" id="profileDegree" class="form-control" value="${escapeHtml(profile.degree || '')}">
          </div>

          <div class="form-group">
            <label class="form-label" for="profileEduLevel">Current Academic Stage</label>
            <select id="profileEduLevel" class="form-control">
              <option value="Undergraduate" ${profile.educationLevel === 'Undergraduate' ? 'selected' : ''}>Undergraduate (B.Tech / BS / BA)</option>
              <option value="Postgraduate" ${profile.educationLevel === 'Postgraduate' ? 'selected' : ''}>Postgraduate (M.Tech / MS / MBA)</option>
              <option value="PhD" ${profile.educationLevel === 'PhD' ? 'selected' : ''}>PhD / Research Scholar</option>
              <option value="High School" ${profile.educationLevel === 'High School' ? 'selected' : ''}>High School / Pre-University</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="profileGradYear">Expected Graduation Year</label>
            <input type="number" id="profileGradYear" class="form-control" value="${profile.graduationYear || 2027}" min="2024" max="2032">
          </div>

          <!-- Skills Tag Input Section -->
          <div class="form-group full">
            <label class="form-label">Technical & Professional Skills</label>
            <div class="tags-input-container" id="skillsTagContainer">
              ${currentSkills.map(skill => `
                <span class="removable-tag" data-skill="${escapeHtml(skill)}">
                  ${escapeHtml(skill)}
                  <span class="tag-remove-x" data-action="remove-skill" data-skill="${escapeHtml(skill)}">&times;</span>
                </span>
              `).join('')}
              <input type="text" id="newSkillInput" placeholder="Type a skill & press Enter..." style="background:transparent; border:none; color:var(--text-primary); outline:none; font-size:0.88rem; min-width:180px; flex:1;">
            </div>

            <!-- Quick Add Suggestion Chips -->
            <div style="margin-top:0.6rem;">
              <span style="font-size:0.75rem; color:var(--text-muted); margin-right:0.5rem;">Popular student skills:</span>
              <div style="display:inline-flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.35rem;">
                ${POPULAR_SKILLS.filter(s => !currentSkills.includes(s)).slice(0, 10).map(s => `
                  <button type="button" class="skill-tag" style="cursor:pointer;" data-action="quick-add-skill" data-skill="${s}">
                    + ${s}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Interests -->
          <div class="form-group full">
            <label class="form-label" for="profileInterests">Interests & Career Domains (comma-separated)</label>
            <input type="text" id="profileInterests" class="form-control" value="${(profile.interests || []).join(', ')}" placeholder="e.g. Artificial Intelligence, Cloud Systems, Open Source, FinTech">
          </div>

          <!-- Category Preferences -->
          <div class="form-group full">
            <label class="form-label">Preferred Opportunity Categories</label>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.6rem; margin-top:0.35rem;">
              ${ALL_CATEGORIES.map(cat => `
                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" name="prefCat" value="${cat}" ${currentCategories.includes(cat) ? 'checked' : ''} style="accent-color:var(--accent-primary); width:16px; height:16px;">
                  <span>${cat}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Work Mode Preference -->
          <div class="form-group">
            <label class="form-label" for="profileMode">Preferred Opportunity Mode</label>
            <select id="profileMode" class="form-control">
              <option value="Any" ${profile.preferredMode === 'Any' ? 'selected' : ''}>Any Mode (Remote, Hybrid, Onsite)</option>
              <option value="Remote" ${profile.preferredMode === 'Remote' ? 'selected' : ''}>Remote Only</option>
              <option value="Hybrid" ${profile.preferredMode === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
              <option value="Onsite" ${profile.preferredMode === 'Onsite' ? 'selected' : ''}>Onsite / In-Person</option>
            </select>
          </div>

          <!-- Bio -->
          <div class="form-group full">
            <label class="form-label" for="profileBio">Short Student Bio</label>
            <textarea id="profileBio" class="form-control" rows="2" placeholder="Tell us about yourself...">${escapeHtml(profile.bio || '')}</textarea>
          </div>
        </div>

        <div style="margin-top:1.75rem; display:flex; justify-content:flex-end; gap:0.85rem;">
          <button type="submit" class="btn-primary" id="saveProfileBtn">
            💾 Save Profile
          </button>
        </div>
      </form>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
