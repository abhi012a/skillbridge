/**
 * Smart Opportunity Recommendation & Skill-Gap Analysis Engine
 * Calculates deterministic, explainable match scores between student profiles and opportunities.
 */

export function calculateMatchScore(opportunity, profile) {
  if (!profile) {
    return {
      score: 50,
      tier: 'Neutral',
      matchedSkills: [],
      missingSkills: opportunity.requiredSkills || [],
      reasons: ['Complete your profile to see personalized match insights.']
    };
  }

  const studentSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
  const oppSkills = (opportunity.requiredSkills || []).map(s => s.toLowerCase().trim());
  const studentInterests = (profile.interests || []).map(i => i.toLowerCase().trim());
  const oppInterests = (opportunity.interests || []).map(i => i.toLowerCase().trim());
  const prefCategories = (profile.preferredCategories || []).map(c => c.toLowerCase().trim());
  const oppCategory = (opportunity.category || '').toLowerCase().trim();
  const studentEdu = (profile.educationLevel || '').toLowerCase().trim();
  const oppEduLevels = (opportunity.educationLevel || []).map(e => e.toLowerCase().trim());

  let totalPoints = 0;
  const reasons = [];
  const matchedSkills = [];
  const missingSkills = [];

  // 1. Skill Match (45% weight)
  if (oppSkills.length > 0) {
    oppSkills.forEach(reqSkill => {
      const isMatched = studentSkills.some(userSkill => 
        userSkill === reqSkill || userSkill.includes(reqSkill) || reqSkill.includes(userSkill)
      );
      if (isMatched) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const skillRatio = matchedSkills.length / oppSkills.length;
    const skillPoints = skillRatio * 45;
    totalPoints += skillPoints;

    if (matchedSkills.length > 0) {
      const topMatches = matchedSkills.slice(0, 3).map(capitalize).join(', ');
      reasons.push(`Matches ${matchedSkills.length} of your skills (${topMatches})`);
    }
  } else {
    // If no specific skills required, neutral 30/45
    totalPoints += 30;
    reasons.push('Open to all skill levels');
  }

  // 2. Preferred Category Match (25% weight)
  if (prefCategories.length > 0) {
    if (prefCategories.includes(oppCategory)) {
      totalPoints += 25;
      reasons.push(`In your preferred category (${opportunity.category})`);
    } else {
      totalPoints += 8;
    }
  } else {
    totalPoints += 15;
  }

  // 3. Interest Alignment (20% weight)
  if (oppInterests.length > 0 && studentInterests.length > 0) {
    const matchedInterests = oppInterests.filter(oppInt => 
      studentInterests.some(userInt => userInt === oppInt || userInt.includes(oppInt) || oppInt.includes(userInt))
    );
    if (matchedInterests.length > 0) {
      const interestRatio = Math.min(1, matchedInterests.length / 2);
      totalPoints += interestRatio * 20;
      reasons.push(`Aligns with interests: ${matchedInterests.slice(0, 2).map(capitalize).join(', ')}`);
    } else {
      totalPoints += 5;
    }
  } else {
    totalPoints += 10;
  }

  // 4. Education Level Eligibility (10% weight)
  if (oppEduLevels.length > 0) {
    if (oppEduLevels.includes(studentEdu) || oppEduLevels.includes('anyone')) {
      totalPoints += 10;
      reasons.push(`Matches your education stage (${profile.educationLevel || 'Undergraduate'})`);
    } else {
      totalPoints += 2;
    }
  } else {
    totalPoints += 8;
  }

  // Mode Bonus / Check
  if (profile.preferredMode && profile.preferredMode !== 'Any') {
    if (opportunity.mode && opportunity.mode.toLowerCase() === profile.preferredMode.toLowerCase()) {
      reasons.push(`Preferred mode: ${opportunity.mode}`);
    }
  }

  const finalScore = Math.min(100, Math.round(totalPoints));

  let tier = 'Explore';
  if (finalScore >= 80) tier = 'High Match';
  else if (finalScore >= 60) tier = 'Good Match';
  else if (finalScore >= 40) tier = 'Moderate Match';

  return {
    score: finalScore,
    tier,
    matchedSkills: matchedSkills.map(capitalize),
    missingSkills: missingSkills.map(capitalize),
    reasons
  };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Perform skill gap analysis across all opportunities compared to the student profile
 */
export function analyzeSkillGaps(opportunities, profile) {
  if (!profile || !profile.skills) return [];

  const studentSkills = new Set((profile.skills || []).map(s => s.toLowerCase().trim()));
  const inDemandCounts = {};

  opportunities.forEach(opp => {
    (opp.requiredSkills || []).forEach(skill => {
      const sLower = skill.toLowerCase().trim();
      if (!studentSkills.has(sLower)) {
        inDemandCounts[skill] = (inDemandCounts[skill] || 0) + 1;
      }
    });
  });

  return Object.entries(inDemandCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
