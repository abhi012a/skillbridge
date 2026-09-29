import http from 'http';
import { calculateMatchScore, analyzeSkillGaps } from '../server/services/recommender.js';

console.log('--- RUNNING SKILLBRIDGE TESTS ---');

// 1. Unit Test Recommender
const sampleProfile = {
  educationLevel: 'Undergraduate',
  skills: ['Python', 'React', 'Docker'],
  interests: ['Machine Learning', 'Cloud Computing'],
  preferredCategories: ['Hackathons & Competitions', 'Internships'],
  preferredMode: 'Remote'
};

const sampleOpp = {
  id: 'test-1',
  title: 'AI Hackathon Test',
  category: 'Hackathons & Competitions',
  requiredSkills: ['Python', 'React', 'Kubernetes'],
  interests: ['Machine Learning', 'Data Science'],
  educationLevel: ['Undergraduate'],
  mode: 'Remote'
};

const matchResult = calculateMatchScore(sampleOpp, sampleProfile);
console.log('✓ Recommender calculation check:', matchResult);

if (matchResult.score < 60) {
  console.error('FAIL: Expected match score >= 60 for closely aligned opportunity, got:', matchResult.score);
  process.exit(1);
}

if (!matchResult.matchedSkills.map(s => s.toLowerCase()).includes('python')) {
  console.error('FAIL: Expected Python in matched skills');
  process.exit(1);
}

console.log('✓ Recommender Unit Test Passed!');

// 2. Unit Test Skill Gap
const gaps = analyzeSkillGaps([sampleOpp], sampleProfile);
console.log('✓ Skill Gaps detected:', gaps);
if (!gaps.some(g => g.skill.toLowerCase() === 'kubernetes')) {
  console.error('FAIL: Expected Kubernetes in skill gaps');
  process.exit(1);
}
console.log('✓ Skill Gap Unit Test Passed!');

console.log('All Unit Tests Succeeded!');
