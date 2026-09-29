import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { calculateMatchScore, analyzeSkillGaps } from './services/recommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');
const PROFILE_FILE = path.join(DATA_DIR, 'defaultProfile.json');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

// Memory cache loaded from files
let opportunities = [];
let studentProfile = {};
let bookmarks = [];

function loadData() {
  try {
    if (fs.existsSync(OPPS_FILE)) {
      opportunities = JSON.parse(fs.readFileSync(OPPS_FILE, 'utf-8'));
    }
    if (fs.existsSync(PROFILE_FILE)) {
      studentProfile = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
    }
    if (fs.existsSync(BOOKMARKS_FILE)) {
      bookmarks = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading JSON data files:', err);
  }
}

function saveBookmarks() {
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving bookmarks:', err);
  }
}

function saveOpportunities() {
  try {
    fs.writeFileSync(OPPS_FILE, JSON.stringify(opportunities, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving opportunities:', err);
  }
}

loadData();

// --- Health Check for Google Cloud Run ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// --- Opportunities APIs ---
app.get('/api/opportunities', (req, res) => {
  const { search, category, mode, isFree, sortBy } = req.query;

  let results = opportunities.map(opp => ({
    ...opp,
    match: calculateMatchScore(opp, studentProfile),
    isBookmarked: bookmarks.some(b => b.opportunityId === opp.id)
  }));

  // Filter: Search
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(opp => 
      opp.title.toLowerCase().includes(q) ||
      opp.organizer.toLowerCase().includes(q) ||
      opp.description.toLowerCase().includes(q) ||
      (opp.requiredSkills || []).some(s => s.toLowerCase().includes(q)) ||
      (opp.interests || []).some(i => i.toLowerCase().includes(q))
    );
  }

  // Filter: Category
  if (category && category !== 'All') {
    results = results.filter(opp => opp.category.toLowerCase() === category.toLowerCase());
  }

  // Filter: Mode (Remote / Hybrid / Onsite)
  if (mode && mode !== 'All') {
    results = results.filter(opp => opp.mode && opp.mode.toLowerCase() === mode.toLowerCase());
  }

  // Filter: Free
  if (isFree === 'true') {
    results = results.filter(opp => opp.isFree === true);
  }

  // Sort
  if (sortBy === 'deadline') {
    results.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (sortBy === 'title') {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Default: recommended (match score descending, then deadline)
    results.sort((a, b) => (b.match.score - a.match.score) || (new Date(a.deadline) - new Date(b.deadline)));
  }

  res.json({
    total: results.length,
    opportunities: results
  });
});

app.get('/api/opportunities/:id', (req, res) => {
  const opp = opportunities.find(o => o.id === req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const match = calculateMatchScore(opp, studentProfile);
  const bookmark = bookmarks.find(b => b.opportunityId === opp.id);

  res.json({
    ...opp,
    match,
    bookmarkInfo: bookmark || null,
    isBookmarked: !!bookmark
  });
});

// Submit new opportunity (Community crowdsourcing)
app.post('/api/opportunities', (req, res) => {
  const { title, category, organizer, description, mode, location, requiredSkills, interests, deadline, stipendOrPrize, applyUrl, eligibility } = req.body;

  if (!title || !category || !organizer || !applyUrl || !deadline) {
    return res.status(400).json({ error: 'Missing required fields: title, category, organizer, applyUrl, and deadline are required.' });
  }

  const newOpp = {
    id: `opp-${Date.now().toString(36)}`,
    title: title.trim(),
    category: category.trim(),
    organizer: organizer.trim(),
    description: (description || '').trim(),
    mode: mode || 'Remote',
    location: location || 'Global / Online',
    educationLevel: ['Undergraduate', 'Postgraduate'],
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean),
    interests: Array.isArray(interests) ? interests : (interests || '').split(',').map(i => i.trim()).filter(Boolean),
    deadline: deadline,
    stipendOrPrize: stipendOrPrize || 'N/A',
    isFree: req.body.isFree !== false,
    applyUrl: applyUrl.trim(),
    featured: false,
    eligibility: eligibility || 'Open to all eligible students.',
    createdAt: new Date().toISOString()
  };

  opportunities.unshift(newOpp);
  saveOpportunities();

  res.status(201).json({
    message: 'Opportunity successfully submitted and added to catalog!',
    opportunity: newOpp
  });
});

// --- Profile APIs ---
app.get('/api/profile', (req, res) => {
  res.json(studentProfile);
});

app.put('/api/profile', (req, res) => {
  const updated = {
    ...studentProfile,
    ...req.body
  };
  studentProfile = updated;
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(studentProfile, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing profile:', err);
  }
  res.json({ message: 'Profile updated successfully', profile: studentProfile });
});

app.post('/api/profile/reset', (req, res) => {
  studentProfile = {
    name: "Abhiraj Abhale",
    email: "abhirajabhale65@gmail.com",
    university: "Sanjivani University",
    degree: "B.Tech in Computer Science & Engineering",
    graduationYear: 2027,
    educationLevel: "Undergraduate",
    skills: ["Python", "React", "JavaScript", "Docker", "Machine Learning", "Git", "Cloud Computing"],
    interests: ["Full-Stack Development", "Cloud Systems", "Artificial Intelligence", "Open Source", "Social Impact"],
    preferredCategories: ["Hackathons & Competitions", "Internships", "Scholarships", "Courses & Certifications"],
    preferredMode: "Any",
    bio: "Third-year Computer Science student passionate about building practical full-stack web applications, exploring cloud tech, and participating in hackathons."
  };
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(studentProfile, null, 2), 'utf-8');
  res.json({ message: 'Profile reset to default', profile: studentProfile });
});

// --- Bookmarks & Tracker APIs ---
app.get('/api/bookmarks', (req, res) => {
  const enriched = bookmarks.map(b => {
    const opp = opportunities.find(o => o.id === b.opportunityId) || {};
    return {
      ...b,
      opportunity: {
        ...opp,
        match: calculateMatchScore(opp, studentProfile)
      }
    };
  });
  res.json(enriched);
});

app.post('/api/bookmarks', (req, res) => {
  const { opportunityId, status = 'Saved', notes = '' } = req.body;
  if (!opportunityId) {
    return res.status(400).json({ error: 'opportunityId is required' });
  }

  const existingIndex = bookmarks.findIndex(b => b.opportunityId === opportunityId);
  if (existingIndex >= 0) {
    bookmarks[existingIndex] = {
      ...bookmarks[existingIndex],
      status,
      notes,
      updatedAt: new Date().toISOString()
    };
  } else {
    bookmarks.push({
      opportunityId,
      status,
      notes,
      savedAt: new Date().toISOString()
    });
  }

  saveBookmarks();
  res.json({ message: 'Bookmark updated', bookmarks });
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  bookmarks = bookmarks.filter(b => b.opportunityId !== id);
  saveBookmarks();
  res.json({ message: 'Bookmark removed', bookmarks });
});

// --- Dashboard Insights API ---
app.get('/api/dashboard', (req, res) => {
  const totalSaved = bookmarks.filter(b => b.status === 'Saved').length;
  const totalApplied = bookmarks.filter(b => b.status === 'Applied').length;
  const totalInterviewing = bookmarks.filter(b => b.status === 'Interviewing').length;
  const totalAccepted = bookmarks.filter(b => b.status === 'Accepted' || b.status === 'Completed').length;

  // Compute top recommended
  const ranked = opportunities.map(opp => ({
    ...opp,
    match: calculateMatchScore(opp, studentProfile),
    isBookmarked: bookmarks.some(b => b.opportunityId === opp.id)
  })).sort((a, b) => b.match.score - a.match.score);

  const topRecommendations = ranked.slice(0, 4);

  // Compute urgent deadlines (in next 90 days, sorted closest first)
  const now = new Date();
  const upcomingDeadlines = opportunities
    .filter(opp => new Date(opp.deadline) >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)
    .map(opp => {
      const diffDays = Math.ceil((new Date(opp.deadline) - now) / (1000 * 60 * 60 * 24));
      return {
        ...opp,
        daysLeft: diffDays,
        isBookmarked: bookmarks.some(b => b.opportunityId === opp.id)
      };
    });

  // Category counts
  const categoryCounts = opportunities.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  // Skill gap analysis
  const skillGaps = analyzeSkillGaps(opportunities, studentProfile);

  res.json({
    metrics: {
      totalOpportunities: opportunities.length,
      savedCount: totalSaved,
      appliedCount: totalApplied,
      interviewingCount: totalInterviewing,
      acceptedCount: totalAccepted
    },
    topRecommendations,
    upcomingDeadlines,
    skillGaps,
    categoryCounts
  });
});

// Serve static frontend
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SkillBridge Server listening on port ${PORT}`);
});
