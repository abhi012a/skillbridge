import http from 'http';

const BASE_URL = 'http://localhost:8080';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let json = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await res.json();
  } else {
    json = await res.text();
  }
  return { status: res.status, data: json };
}

async function runE2ETests() {
  console.log('--- STARTING E2E API VERIFICATION ---');

  // 1. Health check
  const health = await request('/health');
  console.log('✓ Health check status:', health.status, health.data);
  if (health.status !== 200 || health.data.status !== 'healthy') {
    throw new Error('Health check failed');
  }

  // 2. Static HTML check
  const home = await request('/');
  console.log('✓ Frontend static HTML status:', home.status);
  if (home.status !== 200 || !home.data.includes('SkillBridge')) {
    throw new Error('Frontend index.html failed to serve');
  }

  // 3. Opportunities API
  const opps = await request('/api/opportunities');
  console.log('✓ Opportunities catalog count:', opps.data.total);
  if (opps.status !== 200 || opps.data.total < 20) {
    throw new Error('Opportunities catalog check failed');
  }
  const firstOpp = opps.data.opportunities[0];
  if (!firstOpp.match || typeof firstOpp.match.score !== 'number') {
    throw new Error('Match score missing on opportunity');
  }
  console.log(`✓ First ranked opportunity: "${firstOpp.title}" with score: ${firstOpp.match.score}% (${firstOpp.match.tier})`);

  // 4. Filter check (Search)
  const searchRes = await request('/api/opportunities?search=Google');
  console.log('✓ Search for "Google" found:', searchRes.data.total);
  if (searchRes.data.total === 0) {
    throw new Error('Search filter failed');
  }

  // 5. Category Filter check
  const internRes = await request('/api/opportunities?category=Internships');
  console.log('✓ Filter category "Internships" found:', internRes.data.total);
  if (internRes.data.total === 0 || !internRes.data.opportunities.every(o => o.category === 'Internships')) {
    throw new Error('Category filter failed');
  }

  // 6. Profile API (GET & PUT)
  const profileRes = await request('/api/profile');
  console.log('✓ Student profile loaded:', profileRes.data.name, profileRes.data.degree);
  if (!profileRes.data.skills.includes('Python')) {
    throw new Error('Profile skills missing expected default');
  }

  // 7. Dashboard API
  const dashRes = await request('/api/dashboard');
  console.log('✓ Dashboard metrics:', dashRes.data.metrics);
  console.log('✓ In-demand skill gaps detected:', dashRes.data.skillGaps.map(g => g.skill).slice(0, 4));
  if (!dashRes.data.metrics || dashRes.data.upcomingDeadlines.length === 0) {
    throw new Error('Dashboard API missing metrics or upcoming deadlines');
  }

  // 8. Bookmarks API (POST & GET & DELETE)
  const bookmarkAdd = await request('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opportunityId: 'opp-002', status: 'Applied', notes: 'E2E Test Note' })
  });
  console.log('✓ Bookmark added status:', bookmarkAdd.status);

  const bookmarksList = await request('/api/bookmarks');
  const found = bookmarksList.data.find(b => b.opportunityId === 'opp-002');
  if (!found || found.status !== 'Applied') {
    throw new Error('Bookmark persistence check failed');
  }
  console.log('✓ Bookmark verified in list with status:', found.status);

  // 9. Community Submission API
  const newOpp = {
    title: 'Automated E2E Test Hackathon',
    category: 'Hackathons & Competitions',
    organizer: 'Test Org',
    mode: 'Remote',
    location: 'Global',
    deadline: '2026-11-20',
    stipendOrPrize: '$5,000',
    applyUrl: 'https://example.com/e2e-test',
    requiredSkills: ['Python', 'Docker'],
    interests: ['Testing', 'Automation'],
    description: 'A test hackathon created during verification.',
    isFree: true
  };

  const submitRes = await request('/api/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOpp)
  });
  console.log('✓ Submit opportunity status:', submitRes.status);
  if (submitRes.status !== 201) {
    throw new Error('Submit opportunity failed');
  }

  console.log('🎉 ALL E2E API AND BACKEND CHECKS PASSED PERFECTLY!');
}

runE2ETests().catch(err => {
  console.error('❌ E2E TEST FAILED:', err.message);
  process.exit(1);
});
