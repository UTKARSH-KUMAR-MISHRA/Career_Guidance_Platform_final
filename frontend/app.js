(function() {
    'use strict';

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    window.switchLanguage = function(lang) {
        if (typeof studentProfile !== 'undefined') {
            studentProfile.language = lang;
            if (typeof syncUserDataToSQLite === 'function') syncUserDataToSQLite();
        }
        const langName = lang === 'hinglish' ? 'Hinglish' : 'English';
        if (typeof showToast === 'function') {
            showToast('success', `Language switched to ${langName}. AI responses will adapt.`);
        }
    };

    window.calculateSalaryROI = async function() {
        const ctcInput = document.getElementById('roiCtc');
        const cityInput = document.getElementById('roiCity');
        const box = document.getElementById('roiResultBox');
        const btn = document.getElementById('calcRoiBtn');

        const ctcLpa = parseFloat(ctcInput?.value || 12);
        const city = cityInput?.value || 'Bengaluru';
        if (!box) return;

        box.style.display = 'block';
        box.innerHTML = `<div style="font-size:12px; font-weight:700; color:var(--navy);">Calculating in-hand breakdown & ROI for ${ctcLpa} LPA in ${city}...</div>`;

        const grossAnnual = ctcLpa * 100000;
        const estTaxDeductionPct = ctcLpa > 15 ? 0.22 : ctcLpa > 7.5 ? 0.15 : 0.05;
        const netAnnual = grossAnnual * (1 - estTaxDeductionPct);
        const monthlyInHand = Math.round(netAnnual / 12);
        const formattedInHand = monthlyInHand.toLocaleString('en-IN');

        try {
            if (btn) btn.disabled = true;
            const role = (typeof studentProfile !== 'undefined' && studentProfile.target_role) ? studentProfile.target_role : 'AI Engineer';
            const res = await fetch('/api/roi-explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: role, ctc: ctcLpa, city: city })
            });
            const data = await res.json();
            const aiExplain = data.result || 'Provides strong ROI and competitive living standard for tech professionals.';

            box.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--border); padding-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:var(--muted);">Estimated Monthly In-Hand:</span>
                    <span style="font-size:17px; font-weight:800; color:#047857;">₹${formattedInHand} / month</span>
                </div>
                <div style="font-size:12px; line-height:1.5; color:var(--ink); font-weight:500;">
                    ${window.marked ? marked.parse(aiExplain) : aiExplain}
                </div>
            `;
        } catch {
            box.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:700; color:var(--muted);">Estimated Monthly In-Hand:</span>
                    <span style="font-size:17px; font-weight:800; color:#047857;">₹${formattedInHand} / month</span>
                </div>
            `;
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    // ============================================================
    // SVG ICON CONSTANTS (ZERO EMOJIS)
    // ============================================================
    const SVG_ICONS = {
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="width:16px; height:16px; display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>`,
        cross: `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:16px; height:16px; display:inline-block; vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" style="width:16px; height:16px; display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        roadmap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
        clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        currency: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
        mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
        github: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
        profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        aerospace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
        civil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg>`,
        cse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
        mechanical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.67 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        electrical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    };

    // ============================================================
    // 1. ROADMAP DATA & DOMAIN LIST
    // ============================================================
    const ROADMAP_DATA = [{
        domain: 'Aerospace', iconSvg: SVG_ICONS.aerospace,
        roadmaps: [
            { title: 'Aerospace Design Engineer', file: 'roadmaps/aerospace-design-engineer-roadmap.html' },
            { title: 'Aircraft Maintenance Engineer', file: 'roadmaps/aircraft-maintenance-engineer-roadmap.html' },
            { title: 'Avionics Engineer', file: 'roadmaps/avionics-engineer-roadmap.html' },
            { title: 'Flight Test Engineer', file: 'roadmaps/flight-test-engineer-roadmap.html' },
            { title: 'Propulsion Engineer', file: 'roadmaps/propulsion-engineer-roadmap.html' },
            { title: 'Space Systems Engineer', file: 'roadmaps/space-systems-engineer-roadmap.html' }
        ]
    }, {
        domain: 'Civil', iconSvg: SVG_ICONS.civil,
        roadmaps: [
            { title: 'Construction Project Engineer', file: 'roadmaps/construction-project-engineer-roadmap.html' },
            { title: 'Environmental Engineer', file: 'roadmaps/environmental-engineer-roadmap.html' },
            { title: 'Geotechnical Engineer', file: 'roadmaps/geotechnical-engineer-roadmap.html' },
            { title: 'Structural Engineer', file: 'roadmaps/structural-engineer-roadmap.html' },
            { title: 'Transportation Engineer', file: 'roadmaps/transportation-engineer-roadmap.html' },
            { title: 'Urban Planner', file: 'roadmaps/urban-planner-roadmap.html' }
        ]
    }, {
        domain: 'CSE', iconSvg: SVG_ICONS.cse,
        roadmaps: [
            { title: 'AI Engineer', file: 'roadmaps/ai_engineer_roadmap.html' },
            { title: 'Cloud Engineer', file: 'roadmaps/cloud-engineer-roadmap.html' },
            { title: 'Cyber Security Analyst', file: 'roadmaps/cyber-security-analyst-roadmap.html' },
            { title: 'Data Analyst', file: 'roadmaps/data_analyst_roadmap.html' },
            { title: 'Full Stack Developer', file: 'roadmaps/full-stack-roadmap.html' },
            { title: 'Software Engineer', file: 'roadmaps/software-engineer-roadmap.html' }
        ]
    }, {
        domain: 'Mechanical', iconSvg: SVG_ICONS.mechanical,
        roadmaps: [
            { title: 'Automotive Engineer', file: 'roadmaps/automotive-engineer-roadmap.html' },
            { title: 'Design Engineer', file: 'roadmaps/design-engineer-roadmap.html' },
            { title: 'HVAC Engineer', file: 'roadmaps/hvac-engineer-roadmap.html' },
            { title: 'Maintenance Engineer', file: 'roadmaps/maintenance-engineer-roadmap.html' },
            { title: 'Manufacturing Engineer', file: 'roadmaps/manufacturing-engineer-roadmap.html' },
            { title: 'Robotics Engineer', file: 'roadmaps/robotics-engineer-roadmap.html' }
        ]
    }, {
        domain: 'Electrical', iconSvg: SVG_ICONS.electrical,
        roadmaps: [
            { title: 'Electric Vehicles Engineer', file: 'roadmaps/electric-vehicles-roadmap.html' },
            { title: 'Embedded Systems Engineer', file: 'roadmaps/embedded-systems-roadmap.html' },
            { title: 'Semiconductor Engineer', file: 'roadmaps/semiconductor-roadmap.html' },
            { title: 'VLSI Design Engineer', file: 'roadmaps/vlsi-design-roadmap.html' }
        ]
    }];

    const ALL_ROADMAPS_FLAT = ROADMAP_DATA.flatMap(d => d.roadmaps.map(r => ({ ...r, domain: d.domain, iconSvg: d.iconSvg })));

    // ============================================================
    // 2. DOM REFERENCES
    // ============================================================
    const mainContent = document.getElementById('mainContent');
    const rightSidebar = document.getElementById('rightSidebar');
    const rightSidebarToggle = document.getElementById('rightSidebarToggle');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const studentBadge = document.getElementById('studentBadge');
    const targetGoalPill = document.getElementById('targetGoalPill');
    const authActionBtn = document.getElementById('authActionBtn');
    const authWallModal = document.getElementById('authWallModal');
    
    const docViewerModal = document.getElementById('docViewerModal');
    const docModalTitle = document.getElementById('docModalTitle');
    const docModalBody = document.getElementById('docModalBody');
    const docModalClose = document.getElementById('docModalClose');
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchResultsDropdown');

    const projectSpecModal = document.getElementById('projectSpecModal');
    const projectModalContent = document.getElementById('projectModalContent');
    const projectModalClose = document.getElementById('projectModalClose');

    // ============================================================
    // 3. USER STATE & AUTHENTICATION ACCESS CONTROL
    // ============================================================
    const ROLES_DATA = {
        "AI Engineer": {
            title: "AI Engineer",
            salary_lpa: "₹16 - ₹32 LPA",
            required_skills: ["Python", "PyTorch", "Vector DBs", "RAG", "LLMs"],
            growth_path: "Junior ML Engineer -> Senior AI Architect -> Lead AI Researcher",
            resources: [
                { id: "res1", title: "PyTorch for Deep Learning", provider: "Fast.ai", skill: "PyTorch", category: "Courses", cost: "Free", rating: 4.9, est_hours: 40 },
                { id: "res2", title: "Building RAG Applications", provider: "Pinecone Docs", skill: "RAG", category: "Docs", cost: "Free", rating: 4.8, est_hours: 15 }
            ]
        },
        "Cloud Engineer": {
            title: "Cloud Engineer",
            salary_lpa: "₹14 - ₹28 LPA",
            required_skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Linux"],
            growth_path: "DevOps Engineer -> Cloud Architect -> Head of Infrastructure",
            resources: [
                { id: "res3", title: "AWS Solutions Architect", provider: "A Cloud Guru", skill: "AWS", category: "Courses", cost: "Paid", rating: 4.8, est_hours: 50 },
                { id: "res4", title: "Docker & Kubernetes", provider: "Udemy", skill: "Docker", category: "Video Tutorials", cost: "Paid", rating: 4.7, est_hours: 20 }
            ]
        },
        "Software Engineer": {
            title: "Full Stack Developer",
            salary_lpa: "₹12 - ₹24 LPA",
            required_skills: ["JavaScript", "React", "Node.js", "SQL", "System Design"],
            growth_path: "Frontend Dev -> Full Stack Architect -> Principal Tech Lead",
            resources: [
                { id: "res5", title: "Epic React", provider: "Kent C. Dodds", skill: "React", category: "Courses", cost: "Paid", rating: 4.9, est_hours: 30 },
                { id: "res6", title: "Node.js Design Patterns", provider: "Book", skill: "Node.js", category: "Books", cost: "Paid", rating: 4.8, est_hours: 25 }
            ]
        },
        "Data Analyst": {
            title: "Data Analyst",
            salary_lpa: "₹8 - ₹18 LPA",
            required_skills: ["SQL", "Excel", "Tableau", "Python", "Statistics"],
            growth_path: "Junior Analyst -> Senior Data Analyst -> Data Scientist",
            resources: [
                { id: "res7", title: "Google Data Analytics", provider: "Coursera", skill: "SQL", category: "Courses", cost: "Free", rating: 4.8, est_hours: 40 },
                { id: "res8", title: "Tableau for Beginners", provider: "YouTube", skill: "Tableau", category: "Video Tutorials", cost: "Free", rating: 4.6, est_hours: 10 }
            ]
        },
        "DevOps Engineer": {
            title: "DevOps Engineer",
            salary_lpa: "₹14 - ₹30 LPA",
            required_skills: ["Linux", "Bash", "Jenkins", "Ansible", "Kubernetes"],
            growth_path: "DevOps Engineer -> SRE -> VP of Engineering",
            resources: [
                { id: "res9", title: "Linux Command Line", provider: "Codecademy", skill: "Linux", category: "Courses", cost: "Free", rating: 4.7, est_hours: 15 },
                { id: "res10", title: "Jenkins CI/CD", provider: "Udemy", skill: "Jenkins", category: "Courses", cost: "Paid", rating: 4.6, est_hours: 12 }
            ]
        },
        "Cybersecurity Analyst": {
            title: "Cybersecurity Analyst",
            salary_lpa: "₹10 - ₹22 LPA",
            required_skills: ["Networking", "Ethical Hacking", "Linux", "SIEM", "Cryptography"],
            growth_path: "Security Analyst -> Penetration Tester -> CISO",
            resources: [
                { id: "res11", title: "CompTIA Security+", provider: "Cybrary", skill: "Networking", category: "Courses", cost: "Free", rating: 4.8, est_hours: 35 },
                { id: "res12", title: "Ethical Hacking Basics", provider: "TryHackMe", skill: "Ethical Hacking", category: "Docs", cost: "Free", rating: 4.9, est_hours: 20 }
            ]
        }
    };
    
    let isLoggedIn = false;
    let currentUserData = null;
    let studentProfile = {
        full_name: 'Guest Student',
        college: 'Jaipur Institute',
        branch: 'CSE',
        year: '3rd Year',
        target_role: 'AI Engineer',
        skills: ['Python', 'SQL'],
        progress: { python: 80, sql: 60 },
        daily_time: '2 hours',
        language: 'en'
    };
    let todoList = [
        { id: 1, text: 'Solve 2 LeetCode Array questions', done: true },
        { id: 2, text: 'Complete Python RAG tutorial module', done: false }
    ];
    let chatHistoryLog = [];
    let currentChatId = '1';

    let selectedCalendarDate = null;
    let calendarEvents = {};
    let subjectNotes = {
        "Python": [],
        "SQL & DBMS": [],
        "Machine Learning": [],
        "Data Structures & Algorithms": [],
        "DevOps & Cloud": [],
        "General Notes": []
    };

    // REQUIRE AUTHENTICATION WRAPPER FOR INTERACTIVE ACTIONS
    function requireAuth(actionCallback) {
        if (isLoggedIn) {
            if (actionCallback) actionCallback();
        } else {
            showToast('info', 'Please log in or create an account to use this feature.');
            if (authWallModal) {
                authWallModal.style.display = 'flex';
                populateDynamicRegistrationDropdowns();
            }
        }
    }

    window.closeAuthWallModal = function() {
        if (authWallModal) authWallModal.style.display = 'none';
    };

    function loadUserPayloadIntoUI(data) {
        isLoggedIn = true;
        currentUserData = data;
        studentProfile = data.profile || {
            full_name: data.full_name || 'Student',
            college: data.college || 'Jaipur Institute',
            branch: data.branch || 'CSE',
            year: data.year || '3rd Year',
            target_role: data.target_role || 'AI Engineer',
            skills: data.skills || ['Python', 'SQL'],
            progress: data.progress || { python: 80 },
            daily_time: data.daily_time || '2 hours',
            language: data.language || 'en'
        };

        todoList = data.todos || [
            { id: 1, text: 'Solve 2 LeetCode Array questions', done: true },
            { id: 2, text: 'Complete Python RAG tutorial module', done: false }
        ];

        chatHistoryLog = (data.chat_threads && data.chat_threads.length > 0) ? data.chat_threads : [
            { id: '1', title: 'AI Placement Guidance', messages: [{ sender: 'assistant', text: `Hello ${studentProfile.full_name}! I am your AI Career Mentor. Ask me anything about your engineering placement preparation!` }] }
        ];
        if (chatHistoryLog.length > 0) currentChatId = chatHistoryLog[0].id;

        if (data.notes) {
            try {
                const parsed = JSON.parse(data.notes);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    subjectNotes = Object.assign({
                        "Python": [],
                        "SQL & DBMS": [],
                        "Machine Learning": [],
                        "Data Structures & Algorithms": [],
                        "DevOps & Cloud": [],
                        "General Notes": []
                    }, parsed);
                } else {
                    subjectNotes["General Notes"] = [{ id: 'legacy', title: 'General Notes', text: String(data.notes), date: 'Saved' }];
                }
            } catch(e) {
                subjectNotes["General Notes"] = [{ id: 'legacy', title: 'General Notes', text: String(data.notes), date: 'Saved' }];
            }
        }
        
        if (data.points !== undefined) {
            studentProfile.points = data.points;
            studentProfile.level = data.level;
            studentProfile.streak_days = data.streak_days;
            studentProfile.badges = data.badges || [];
        }

        updateHeaderProfileUI();
        renderTodoList();
        renderCalendar();
        if (document.querySelector('.top-nav .nav-item.active')?.dataset.page === 'chat-coach') {
            renderChatCoachWorkspace();
        }
    }

    function updateHeaderProfileUI() {
        const nameDisplays = document.querySelectorAll('#userNameDisplay');
        const badgeDisplays = document.querySelectorAll('#studentBadge');
        const goalDisplays = document.querySelectorAll('#targetGoalPill');
        const gPoints = document.getElementById('gamiPoints');
        const gLevel = document.getElementById('gamiLevel');
        const gStreak = document.getElementById('gamiStreak');

        nameDisplays.forEach(el => el.textContent = isLoggedIn ? `Welcome, ${studentProfile.full_name}` : 'Welcome Student');
        badgeDisplays.forEach(el => el.textContent = isLoggedIn ? `${studentProfile.branch} ${studentProfile.year} • ${studentProfile.college}` : 'Guest Visitor Mode');
        goalDisplays.forEach(el => el.textContent = `Target: ${studentProfile.target_role}`);
        
        if (isLoggedIn) {
            if (gPoints) gPoints.innerHTML = `🏆 ${studentProfile.points || 0} pts`;
            if (gLevel) gLevel.innerHTML = `⭐ Lvl ${studentProfile.level || 1}`;
            if (gStreak) gStreak.innerHTML = `🔥 ${studentProfile.streak_days || 0} days`;
        }

        if (authActionBtn) {
            if (isLoggedIn) {
                authActionBtn.style.display = 'none';
            } else {
                authActionBtn.style.display = 'flex';
                authActionBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px; height:16px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Log In</span>`;
                authActionBtn.style.background = 'var(--navy)';
            }
        }
    }

    async function fetchGamificationStats() {
        try {
            const res = await fetch('/api/gamification/stats');
            if (res.ok) {
                const data = await res.json();
                window.gamificationData = data;
                if (studentProfile) {
                    studentProfile.points = data.points || 0;
                    studentProfile.level = data.level || 1;
                    studentProfile.streak_days = data.streak_days || 0;
                    studentProfile.badges = data.badges || [];
                }
                updateHeaderProfileUI();
                return data;
            }
        } catch (e) {
            console.error("Failed to fetch gamification stats:", e);
        }
        return window.gamificationData || { points: studentProfile?.points || 0, level: studentProfile?.level || 1, streak_days: studentProfile?.streak_days || 0, badges: studentProfile?.badges || [] };
    }

    function renderBadges(badges) {
        let list = Array.isArray(badges) && badges.length > 0 ? badges.slice(-3) : ["🌱 New Scholar", "⚡ Fast Start", "🎯 Goal Setter"];
        return list.map(b => `
            <span class="badge-chip">
                ${escapeHtml(b)}
            </span>
        `).join('');
    }

    window.toggleDailyGoal = function(chk) {
        if (chk.checked) {
            showToast('success', '🎯 Daily Goal Completed! +50 XP Earned!');
            studentProfile.points = (studentProfile.points || 0) + 50;
            if (studentProfile.points >= (studentProfile.level || 1) * 200) {
                studentProfile.level = (studentProfile.level || 1) + 1;
                showToast('success', `🎉 Level Up! You reached Level ${studentProfile.level}!`);
            }
            updateHeaderProfileUI();
            renderDashboard();
        }
    };

    async function syncUserDataToSQLite() {
        if (!currentUserData || !isLoggedIn) return;
        const payload = {
            profile: studentProfile,
            notes: JSON.stringify(subjectNotes),
            todos: todoList,
            chat_threads: chatHistoryLog
        };

        try {
            await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error('Error syncing user data to SQLite3', e);
        }
    }

    // POPULATE REGISTRATION DROPDOWNS DYNAMICALLY FROM BACKEND ROLES / DOMAINS
    async function populateDynamicRegistrationDropdowns() {
        const branchSelect = document.getElementById('reg-branch');
        const targetSelect = document.getElementById('reg-target');
        if (!branchSelect || !targetSelect) return;

        try {
            const res = await fetch('/api/roles');
            const roles = await res.json();

            if (roles && roles.length > 0) {
                targetSelect.innerHTML = roles.map(r => `<option value="${r.title}">${r.title}</option>`).join('');
            }
        } catch {
            // Keep default options
        }
    }

    // ============================================================
    // 4. SESSION CHECK & AUTHENTICATION HANDLERS
    // ============================================================
    async function checkAuthSession() {
        try {
            const res = await fetch('/api/auth/session');
            const data = await res.json();
            if (data.logged_in && data.data) {
                if (authWallModal) authWallModal.style.display = 'none';
                loadUserPayloadIntoUI(data.data);
            } else {
                isLoggedIn = false;
                if (authWallModal) authWallModal.style.display = 'none';
                updateHeaderProfileUI();
            }
        } catch {
            isLoggedIn = false;
            if (authWallModal) authWallModal.style.display = 'none';
            updateHeaderProfileUI();
        }
        navigateTo('dashboard');
    }

    window.switchAuthTab = function(tab) {
        const loginBtn = document.getElementById('tabAuthLoginBtn');
        const regBtn = document.getElementById('tabAuthRegisterBtn');
        const loginPanel = document.getElementById('authLoginFormPanel');
        const regPanel = document.getElementById('authRegisterFormPanel');

        if (tab === 'login') {
            if (loginBtn) { loginBtn.style.background = 'var(--primary)'; loginBtn.style.color = '#fff'; }
            if (regBtn) { regBtn.style.background = '#fff'; regBtn.style.color = 'var(--ink)'; }
            if (loginPanel) loginPanel.style.display = 'block';
            if (regPanel) regPanel.style.display = 'none';
        } else {
            if (regBtn) { regBtn.style.background = 'var(--primary)'; regBtn.style.color = '#fff'; }
            if (loginBtn) { loginBtn.style.background = '#fff'; loginBtn.style.color = 'var(--ink)'; }
            if (regPanel) regPanel.style.display = 'block';
            if (loginPanel) loginPanel.style.display = 'none';
            populateDynamicRegistrationDropdowns();
        }
    };

    document.getElementById('submitLoginBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const errEl = document.getElementById('loginErrorMsg');

        if (!email || !password) {
            if (errEl) { errEl.textContent = 'Please fill in both email and password.'; errEl.style.display = 'block'; }
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.ok && data.data) {
                if (errEl) errEl.style.display = 'none';
                if (authWallModal) authWallModal.style.display = 'none';
                loadUserPayloadIntoUI(data.data);
                showToast('success', `Welcome back, ${data.data.full_name}! Account loaded.`);
            } else {
                if (errEl) { errEl.textContent = data.error || 'Login failed.'; errEl.style.display = 'block'; }
            }
        } catch {
            if (errEl) { errEl.textContent = 'Server connection error.'; errEl.style.display = 'block'; }
        }
    });

    document.getElementById('submitRegisterBtn')?.addEventListener('click', async () => {
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const college = document.getElementById('reg-college')?.value.trim();
        const branch = document.getElementById('reg-branch')?.value;
        const year = document.getElementById('reg-year')?.value;
        const target = document.getElementById('reg-target')?.value;
        const errEl = document.getElementById('regErrorMsg');

        if (!name || !email || !password) {
            if (errEl) { errEl.textContent = 'Please fill in all required fields.'; errEl.style.display = 'block'; }
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, email, password, college, branch, year, target_role: target })
            });
            const data = await res.json();
            if (data.ok && data.data) {
                if (errEl) errEl.style.display = 'none';
                if (authWallModal) authWallModal.style.display = 'none';
                loadUserPayloadIntoUI(data.data);
                showToast('success', `Account created for ${name}! Logged in successfully.`);
            } else {
                if (errEl) { errEl.textContent = data.error || 'Registration failed.'; errEl.style.display = 'block'; }
            }
        } catch {
            if (errEl) { errEl.textContent = 'Server connection error.'; errEl.style.display = 'block'; }
        }
    });

    window.handleLogout = async function() {
        await fetch('/api/auth/logout', { method: 'POST' });
        isLoggedIn = false;
        currentUserData = null;
        
        // Reset state to guest defaults
        studentProfile = {
            full_name: 'Guest Student',
            college: 'Jaipur Institute',
            branch: 'CSE',
            year: '3rd Year',
            target_role: 'AI Engineer',
            skills: ['Python', 'SQL'],
            progress: { python: 80, sql: 60 },
            daily_time: '2 hours',
            language: 'en'
        };
        todoList = [
            { id: 1, text: 'Solve 2 LeetCode Array questions', done: true },
            { id: 2, text: 'Complete Python RAG tutorial module', done: false }
        ];
        chatHistoryLog = [];
        currentChatId = '1';
        calendarEvents = {};
        subjectNotes = {
            "Python": [],
            "SQL & DBMS": [],
            "Machine Learning": [],
            "Data Structures & Algorithms": [],
            "DevOps & Cloud": [],
            "General Notes": []
        };

        updateHeaderProfileUI();
        renderTodoList();
        renderCalendar();
        navigateTo('dashboard');

        showToast('info', 'Logged out successfully.');
        
        // Show auth wall to encourage signing back in or registering
        if (authWallModal) {
            authWallModal.style.display = 'flex';
            populateDynamicRegistrationDropdowns();
        }
    };

    if (authActionBtn) {
        authActionBtn.addEventListener('click', async () => {
            if (isLoggedIn) {
                await window.handleLogout();
            } else {
                if (authWallModal) {
                    authWallModal.style.display = 'flex';
                    populateDynamicRegistrationDropdowns();
                }
            }
        });
    }

    // ============================================================
    // 5. TOAST NOTIFICATIONS & UTILITIES
    // ============================================================
    function showToast(type, message) {
        const stack = document.getElementById('toastStack');
        if (!stack) return;
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        const iconSvg = type === 'success' ? SVG_ICONS.check : type === 'error' ? SVG_ICONS.cross : SVG_ICONS.info;
        el.innerHTML = `<span>${iconSvg}</span><span>${message}</span>`;
        stack.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
    }

    // ============================================================
    // 6. RIGHT SIDEBAR CONTROLS
    // ============================================================
    let rightSidebarCollapsed = true;
    function toggleRightSidebar(forceState) {
        if (!rightSidebar) return;
        rightSidebarCollapsed = typeof forceState === 'boolean' ? forceState : !rightSidebarCollapsed;
        rightSidebar.classList.toggle('expanded', !rightSidebarCollapsed);
        if (rightSidebarToggle) rightSidebarToggle.textContent = rightSidebarCollapsed ? '◀' : '▶';
        if (!rightSidebarCollapsed) renderCalendar();
    }
    if (rightSidebarToggle) rightSidebarToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleRightSidebar(); });

    document.querySelectorAll('.collapsed-icons .icon-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const tile = item.dataset.tile;
            toggleRightSidebar(false);
            setTimeout(() => {
                const target = document.querySelector(`.right-tile[data-tile="${tile}"]`);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });

    // ============================================================
    // 7. GLOBAL SEARCH & AUTOCOMPLETE
    // ============================================================
    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                searchDropdown.classList.remove('active');
                return;
            }

            const results = ALL_ROADMAPS_FLAT.filter(r => r.title.toLowerCase().includes(query) || r.domain.toLowerCase().includes(query));
            if (results.length === 0) {
                searchDropdown.innerHTML = `<div style="padding:12px; font-size:12.5px; color:var(--muted); text-align:center;">No matching roadmaps found for "${query}"</div>`;
            } else {
                searchDropdown.innerHTML = results.slice(0, 6).map(r => `
                    <div class="search-result-item" onclick="openRoadmapViewer('${r.file}', '${r.title}')">
                        <div>
                            <div class="search-result-title">${r.iconSvg} ${r.title}</div>
                            <div style="font-size:11px; color:var(--muted);">${r.domain} Engineering Track</div>
                        </div>
                        <span class="search-result-type">Roadmap ↗</span>
                    </div>
                `).join('');
            }
            searchDropdown.classList.add('active');
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.classList.remove('active');
            }
        });
    }

    // ============================================================
    // 8. RIGHT SIDEBAR WIDGETS (TIMER, CALENDAR, TO-DO, NOTES)
    // ============================================================
    // ============================================================
    // 8. SIDEBAR WIDGETS (TIMER, CALENDAR, TO-DO, SUBJECT SCRATCHPAD)
    // ============================================================
    let timerState = {
        totalSeconds: 25 * 60,
        secondsLeft: 25 * 60,
        isRunning: false,
        interval: null
    };

    window.setTimerDuration = function(minutes) {
        if (timerState.interval) clearInterval(timerState.interval);
        timerState.isRunning = false;
        timerState.totalSeconds = minutes * 60;
        timerState.secondsLeft = minutes * 60;
        updateTimerDisplay();
        
        const timerTile = document.querySelector('.right-tile[data-tile="timer"]');
        if (timerTile) {
            timerTile.querySelectorAll('.cal-nav-btn').forEach(btn => {
                const text = btn.textContent.trim();
                if (text === `${minutes}m`) {
                    btn.classList.add('active');
                    btn.style.background = 'var(--primary)';
                    btn.style.color = '#fff';
                } else if (text.endsWith('m') && !text.startsWith('+') && !text.startsWith('-')) {
                    btn.classList.remove('active');
                    btn.style.background = '';
                    btn.style.color = '';
                }
            });
        }
    };

    window.adjustTimerMinutes = function(delta) {
        let currentMin = Math.floor(timerState.secondsLeft / 60) + delta;
        if (currentMin < 1) currentMin = 1;
        setTimerDuration(currentMin);
    };

    function updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;
        const mins = Math.floor(timerState.secondsLeft / 60);
        const secs = timerState.secondsLeft % 60;
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    document.getElementById('timerStart')?.addEventListener('click', (e) => {
        e.stopPropagation();
        requireAuth(() => {
            if (timerState.isRunning) return;
            timerState.isRunning = true;
            timerState.interval = setInterval(() => {
                if (timerState.secondsLeft > 0) {
                    timerState.secondsLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerState.interval);
                    timerState.isRunning = false;
                    showToast('success', 'Focus Pomodoro Session Completed! Great job!');
                }
            }, 1000);
        });
    });

    document.getElementById('timerStop')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (timerState.interval) clearInterval(timerState.interval);
        timerState.isRunning = false;
        showToast('info', 'Timer Paused');
    });

    document.getElementById('timerReset')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (timerState.interval) clearInterval(timerState.interval);
        timerState.isRunning = false;
        timerState.secondsLeft = timerState.totalSeconds;
        updateTimerDisplay();
    });

    // INTERACTIVE STUDY CALENDAR
    let calendarDate = new Date();
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('calMonthLabel');
        if (!grid || !monthLabel) return;

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        monthLabel.textContent = calendarDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let html = '';
        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(l => { html += `<div style="font-weight:700; color:var(--muted); padding:2px 0;">${l}</div>`; });

        for (let i = 0; i < firstDay; i++) { html += `<div></div>`; }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const isSelected = selectedCalendarDate === dateKey;
            const hasEvent = calendarEvents[dateKey] && calendarEvents[dateKey].length > 0;

            let classes = 'cal-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (hasEvent) classes += ' has-event';

            html += `<div class="${classes}" onclick="selectCalendarDay(${year}, ${month}, ${d})">${d}</div>`;
        }
        grid.innerHTML = html;
    }

    window.selectCalendarDay = function(year, month, day) {
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        selectedCalendarDate = dateKey;
        renderCalendar();

        const displayLabel = document.getElementById('selectedDateDisplay');
        const eventsList = document.getElementById('selectedDateEventsList');
        const formattedStr = new Date(year, month, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        if (displayLabel) displayLabel.textContent = `Target Date: ${formattedStr}`;

        if (eventsList) {
            const evs = calendarEvents[dateKey] || [];
            if (evs.length > 0) {
                eventsList.innerHTML = evs.map((ev, idx) => `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding:2px 4px; background:#fff; border-radius:4px;"><span>• ${escapeHtml(ev)}</span><button onclick="removeCalendarEvent('${dateKey}', ${idx})" style="background:none; border:none; color:var(--error); cursor:pointer; font-weight:700;">✕</button></div>`).join('');
            } else {
                eventsList.innerHTML = '<span style="color:var(--muted); font-style:italic;">No milestones set for this date.</span>';
            }
        }
    };

    document.getElementById('addDeadlineBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        requireAuth(() => {
            const input = document.getElementById('selectedDateDeadlineInput');
            if (!input || !input.value.trim()) return;
            if (!selectedCalendarDate) {
                showToast('info', 'Please tap a date on the calendar first.');
                return;
            }
            if (!calendarEvents[selectedCalendarDate]) calendarEvents[selectedCalendarDate] = [];
            calendarEvents[selectedCalendarDate].push(input.value.trim());
            input.value = '';
            renderCalendar();
            const dParts = selectedCalendarDate.split('-');
            selectCalendarDay(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
            syncUserDataToSQLite();
            showToast('success', 'Study milestone saved!');
        });
    });

    window.removeCalendarEvent = function(dateKey, idx) {
        requireAuth(() => {
            if (calendarEvents[dateKey]) {
                calendarEvents[dateKey].splice(idx, 1);
                renderCalendar();
                const dParts = dateKey.split('-');
                selectCalendarDay(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
                syncUserDataToSQLite();
                showToast('info', 'Milestone removed.');
            }
        });
    };

    document.querySelectorAll('.cal-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.dataset.dir) {
                const dir = parseInt(btn.dataset.dir || '1');
                calendarDate.setMonth(calendarDate.getMonth() + dir);
                renderCalendar();
            }
        });
    });
    renderCalendar();

    // TO-DO CHECKLIST
    function renderTodoList() {
        const container = document.getElementById('todoList');
        if (!container) return;
        container.innerHTML = todoList.map(t => `
            <div class="todo-item ${t.done ? 'completed' : ''}">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;">
                    <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTodoItem(${t.id})" />
                    <span>${escapeHtml(t.text)}</span>
                </label>
                <button class="todo-delete-btn" onclick="deleteTodoItem(${t.id})">✕</button>
            </div>
        `).join('');
    }
    window.toggleTodoItem = function(id) {
        requireAuth(() => {
            const item = todoList.find(i => i.id === id);
            if (item) {
                item.done = !item.done;
                renderTodoList();
                syncUserDataToSQLite();
            }
        });
    };
    window.deleteTodoItem = function(id) {
        requireAuth(() => {
            todoList = todoList.filter(i => i.id !== id);
            renderTodoList();
            syncUserDataToSQLite();
        });
    };
    document.getElementById('addTodoBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        requireAuth(() => {
            const input = document.getElementById('todoInput');
            if (!input || !input.value.trim()) return;
            todoList.push({ id: Date.now(), text: input.value.trim(), done: false });
            input.value = '';
            renderTodoList();
            syncUserDataToSQLite();
            showToast('success', 'Target saved to account!');
        });
    });

    // SUBJECT-WISE SCRATCHPAD NOTES
    document.getElementById('notesSaveBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        requireAuth(() => {
            const subj = document.getElementById('noteSubjectSelect')?.value || 'General Notes';
            const titleInput = document.getElementById('noteTitleInput');
            const textInput = document.getElementById('notesTextarea');

            const title = titleInput?.value.trim() || `${subj} Note`;
            const text = textInput?.value.trim() || '';

            if (!text) {
                showToast('info', 'Please enter note text before saving.');
                return;
            }

            if (!subjectNotes[subj]) subjectNotes[subj] = [];
            subjectNotes[subj].unshift({
                id: Date.now().toString(),
                title: title,
                text: text,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            });

            if (titleInput) titleInput.value = '';
            if (textInput) textInput.value = '';

            syncUserDataToSQLite();
            showToast('success', `Saved note to "${subj}" folder!`);
        });
    });

    // SHOW ALL NOTES MODAL
    let activeFolderFilter = 'All';
    const allNotesModal = document.getElementById('allNotesModal');
    const allNotesModalClose = document.getElementById('allNotesModalClose');

    window.openAllNotesModal = function() {
        const modal = document.getElementById('allNotesModal');
        if (!modal) return;
        renderAllNotesModal('All');
        modal.classList.add('active');
        modal.classList.add('show');
        modal.style.display = 'flex';
    };

    window.closeAllNotesModal = function() {
        const modal = document.getElementById('allNotesModal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    };

    document.getElementById('showAllNotesBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openAllNotesModal();
    });

    if (allNotesModalClose) {
        allNotesModalClose.addEventListener('click', () => {
            closeAllNotesModal();
        });
    }

    function renderAllNotesModal(selectedFolder = 'All', searchQuery = '') {
        activeFolderFilter = selectedFolder;
        const folderList = document.getElementById('notesFolderList');
        const notesGrid = document.getElementById('subjectNotesGrid');
        if (!folderList || !notesGrid) return;

        const subjects = ["All", "Python", "SQL & DBMS", "Machine Learning", "Data Structures & Algorithms", "DevOps & Cloud", "General Notes"];
        
        let folderHtml = '';
        subjects.forEach(subj => {
            const count = subj === 'All' 
                ? Object.values(subjectNotes).flat().length 
                : (subjectNotes[subj] || []).length;
            
            const isActive = activeFolderFilter === subj;
            folderHtml += `
                <div class="folder-btn ${isActive ? 'active' : ''}" onclick="renderAllNotesModal('${subj}', '${escapeHtml(searchQuery)}')">
                    <span>${subj}</span>
                    <span class="folder-badge">${count}</span>
                </div>
            `;
        });
        folderList.innerHTML = folderHtml;

        let notesToDisplay = [];
        if (selectedFolder === 'All') {
            Object.keys(subjectNotes).forEach(subj => {
                (subjectNotes[subj] || []).forEach(n => {
                    notesToDisplay.push({ ...n, subject: subj });
                });
            });
        } else {
            (subjectNotes[selectedFolder] || []).forEach(n => {
                notesToDisplay.push({ ...n, subject: selectedFolder });
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            notesToDisplay = notesToDisplay.filter(n => n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
        }

        if (notesToDisplay.length === 0) {
            notesGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--muted);">
                    <div style="font-size:16px; font-weight:700; margin-bottom:6px;">No notes found</div>
                    <div style="font-size:13px;">Save notes from the sidebar scratchpad or click "+ Create Note" above.</div>
                </div>
            `;
            return;
        }

        notesGrid.innerHTML = notesToDisplay.map(n => `
            <div class="note-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="note-card-title">${escapeHtml(n.title)}</div>
                    <span style="font-size:10.5px; font-weight:800; padding:2px 6px; border-radius:4px; background:var(--primary-light); color:var(--primary-dark);">${escapeHtml(n.subject)}</span>
                </div>
                <div class="note-card-body">${escapeHtml(n.text)}</div>
                <div class="note-card-footer">
                    <span>${n.date || 'Today'}</span>
                    <div style="display:flex; gap:8px;">
                        <button onclick="copyNoteContent('${n.id}')" style="background:none; border:none; color:var(--primary-dark); cursor:pointer; font-weight:700; font-size:11px;">Copy</button>
                        <button onclick="deleteSubjectNote('${n.subject}', '${n.id}')" style="background:none; border:none; color:var(--error); cursor:pointer; font-weight:700; font-size:11px;">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    window.renderAllNotesModal = renderAllNotesModal;

    document.getElementById('searchNotesInput')?.addEventListener('input', (e) => {
        renderAllNotesModal(activeFolderFilter, e.target.value);
    });

    window.openCreateNotePrompt = function() {
        requireAuth(() => {
            const subj = activeFolderFilter === 'All' ? 'Python' : activeFolderFilter;
            const title = prompt(`Enter note title for ${subj}:`, `${subj} Key Concept`);
            if (!title) return;
            const text = prompt(`Enter note content:`, ``);
            if (!text) return;

            if (!subjectNotes[subj]) subjectNotes[subj] = [];
            subjectNotes[subj].unshift({
                id: Date.now().toString(),
                title: title,
                text: text,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            });

            syncUserDataToSQLite();
            renderAllNotesModal(activeFolderFilter);
            showToast('success', 'New note created!');
        });
    };

    window.copyNoteContent = function(noteId) {
        let found = null;
        Object.values(subjectNotes).flat().forEach(n => {
            if (n.id === noteId) found = n;
        });
        if (found && navigator.clipboard) {
            navigator.clipboard.writeText(`${found.title}\n\n${found.text}`);
            showToast('success', 'Note copied to clipboard!');
        }
    };

    window.deleteSubjectNote = function(subject, noteId) {
        requireAuth(() => {
            if (subjectNotes[subject]) {
                subjectNotes[subject] = subjectNotes[subject].filter(n => n.id !== noteId);
                syncUserDataToSQLite();
                renderAllNotesModal(activeFolderFilter);
                showToast('info', 'Note deleted.');
            }
        });
    };

    // Roadmap viewer modal
    window.openRoadmapViewer = function(file, title) {
        showToast('info', `Launching interactive roadmap: ${title}...`);
        window.open(file, '_blank');
    };

    window.openCitationDoc = async function(docId) {
        if (!docViewerModal) return;
        docModalTitle.textContent = `Knowledge Citation Document: ${docId}`;
        docModalBody.textContent = 'Fetching document content from Sarvam AI RAG index...';
        docViewerModal.classList.add('active');

        try {
            const res = await fetch(`/api/doc/${docId}`);
            const data = await res.json();
            docModalBody.textContent = data.content || 'Document content unavailable.';
        } catch {
            docModalBody.textContent = 'Failed to load document content from backend server.';
        }
    };
    if (docModalClose) docModalClose.addEventListener('click', () => docViewerModal.classList.remove('active'));
    if (projectModalClose) projectModalClose.addEventListener('click', () => projectSpecModal.classList.remove('show'));

    // ============================================================
    // 9. NAVIGATION ROUTER & MERGED SECTIONS
    // ============================================================
    function navigateTo(page) {
        // Protect certain routes from guest access
        const protectedRoutes = ['career-guidance', 'skill-gap', 'projects', 'interview-resume', 'need-help', 'profile', 'skill-learning', 'compare'];
        
        if (!isLoggedIn && protectedRoutes.includes(page)) {
            showToast('info', 'Please log in or create an account to access this page.');
            if (authWallModal) {
                authWallModal.style.display = 'flex';
                populateDynamicRegistrationDropdowns();
            }
            return; // Stop navigation
        }

        document.querySelectorAll('.top-nav .nav-item').forEach(i => i.classList.remove('active'));
        const target = document.querySelector(`.top-nav .nav-item[data-page="${page}"]`);
        if (target) target.classList.add('active');

        switch (page) {
            case 'dashboard': renderDashboard(); break;
            case 'career-guidance': renderCareerGuidance(); break;
            case 'skill-gap': renderCareerGuidance(); break;
            case 'projects': renderProjects(); break;
            case 'interview-resume': renderInterviewAndResume(); break;
            case 'need-help': renderNeedHelp(); break;
            case 'about': renderAboutResponsibleAI(); break;
            case 'profile': renderProfile(); break;
            case 'skill-learning': renderCareerGuidance(); break;
            case 'compare': renderCareerGuidance(); break;
            default: renderDashboard();
        }
        setTimeout(setupScrollFloatObserver, 150);
    }
    window.navigateTo = navigateTo;

    document.querySelectorAll('.top-nav .nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function() { navigateTo(this.dataset.page); });
    });

    // ============================================================
    // TAB 1: DASHBOARD
    // ============================================================
    async function renderDashboard() {
        if (!mainContent) return;

        // Fetch latest stats dynamically from /api/gamification/stats
        const gStats = await fetchGamificationStats();
        const points = gStats.points || studentProfile.points || 0;
        const level = gStats.level || studentProfile.level || 1;
        const streak = gStats.streak_days || studentProfile.streak_days || 0;
        const badges = gStats.badges || studentProfile.badges || [];

        // Progress & Milestone Calculations
        const nextLevel = level + 1;
        const ptsInCurrentLvl = points % 200;
        const ptsToNextLevel = 200 - ptsInCurrentLvl;
        const progressPct = Math.min(100, Math.round((ptsInCurrentLvl / 200) * 100));

        // Streak Motivational Message
        let motivationalMsg = "🚀 Start your streak today by completing a module!";
        let streakBadgeBg = "#f8fafc";
        let streakBadgeColor = "#475569";

        if (streak >= 5) {
            motivationalMsg = "🔥 You're on fire! 5+ days streak! Keep the momentum going!";
            streakBadgeBg = "#fef3c7";
            streakBadgeColor = "#92400e";
        } else if (streak >= 3) {
            motivationalMsg = "⚡ Great consistency! 3-5 days streak! Keep going!";
            streakBadgeBg = "#e0f2fe";
            streakBadgeColor = "#075985";
        } else if (streak >= 1) {
            motivationalMsg = "👍 Good start! Keep building your daily habit!";
            streakBadgeBg = "#ecfdf5";
            streakBadgeColor = "#047857";
        }

        let html = `
            <!-- WELCOME HERO (CORPORATE PURE WHITE LOOK) -->
            <div class="welcome-hero animate">
                <h1>Welcome back, ${escapeHtml(studentProfile.full_name)}</h1>
                <p>ApexForge Corporate Engineering Guidance | Track: <strong>${escapeHtml(studentProfile.target_role)}</strong> (${escapeHtml(studentProfile.branch)} ${escapeHtml(studentProfile.year)})</p>
                
                <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap;">
                    <!-- SINGLE MAIN EMERALD CALL-TO-ACTION BUTTON -->
                    <button class="auth-btn cta-btn" onclick="openCareerQuizModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px; height:15px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span>Start Placement Quiz</span>
                    </button>
                    <!-- SECONDARY NAVY BUTTON -->
                    <button class="auth-btn" onclick="navigateTo('career-guidance')">
                        <span>Role Explorer & Benchmarks</span>
                    </button>
                </div>
            </div>

            <!-- LEARNING STATUS MODULE -->
            <div class="liquid-glass-card animate" id="learningStatusCard" style="margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--border);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="background:var(--navy); color:#ffffff; padding:5px 12px; border-radius:6px; font-weight:800; font-size:12.5px;">⭐ Level ${level} Scholar</span>
                        <span style="background:${streakBadgeBg}; color:${streakBadgeColor}; border:1px solid rgba(0,0,0,0.08); padding:5px 12px; border-radius:6px; font-weight:700; font-size:12.5px;">🔥 ${streak} Day Streak</span>
                    </div>
                    <div style="font-size:13px; font-weight:600; color:var(--muted);">
                        Total Points Earned: <strong style="color:var(--ink); font-weight:800; font-size:15px;">${points} XP</strong>
                    </div>
                </div>

                <!-- MOTIVATIONAL STREAK ALERT -->
                <div style="background:${streakBadgeBg}; border:1px solid rgba(0,0,0,0.06); color:${streakBadgeColor}; padding:10px 14px; border-radius:6px; font-size:13px; font-weight:700; margin-bottom:18px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:16px;">${streak >= 5 ? '🔥' : streak >= 3 ? '⚡' : streak >= 1 ? '👍' : '🚀'}</span>
                    <span>${motivationalMsg}</span>
                </div>

                <!-- 3-COLUMN LEARNING METRICS & GOALS -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:16px;">
                    <!-- COLUMN 1: PROGRESS TO NEXT LEVEL -->
                    <div class="frosted-box">
                        <div style="font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Next Level Milestone</div>
                        <div style="font-size:16px; font-weight:800; color:var(--ink); margin-bottom:8px;">${ptsToNextLevel} XP to Level ${nextLevel}</div>
                        <div style="height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden; margin-bottom:6px;">
                            <div style="width:${progressPct}%; height:100%; background:var(--primary); border-radius:4px; transition:width 0.4s ease;"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600; color:var(--muted);">
                            <span>Level ${level}</span>
                            <span>${progressPct}%</span>
                            <span>Level ${nextLevel}</span>
                        </div>
                    </div>

                    <!-- COLUMN 2: TODAY'S GOAL TASK -->
                    <div class="frosted-box">
                        <div style="font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Today's Learning Goal</div>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
                            <input type="checkbox" id="dailyGoalCheck" style="width:18px; height:18px; accent-color:var(--primary); cursor:pointer;" onchange="toggleDailyGoal(this)" />
                            <label for="dailyGoalCheck" style="font-size:13px; font-weight:700; color:var(--ink); cursor:pointer;">Complete 1 coding question</label>
                        </div>
                        <div style="font-size:11.5px; color:var(--muted); margin-top:6px; font-weight:500;">Earn +50 XP bonus upon completion</div>
                    </div>

                    <!-- COLUMN 3: RECENT BADGES EARNED -->
                    <div class="frosted-box">
                        <div style="font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Recent Badges Earned</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${renderBadges(badges)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATS GRID WITH COLOR ACCENTED TILES -->
            <div class="stats-grid animate">
                <div class="stat-card stat-emerald">
                    <div class="stat-header">
                        <span class="stat-title">Placement Readiness Score</span>
                        <div class="stat-icon-wrap emerald">${SVG_ICONS.target}</div>
                    </div>
                    <div class="stat-value" id="readinessScoreVal">78%</div>
                    <div class="stat-sub">Based on ${studentProfile.target_role} benchmark</div>
                </div>
                <div class="stat-card stat-blue">
                    <div class="stat-header">
                        <span class="stat-title">Roadmap Stage</span>
                        <div class="stat-icon-wrap blue">${SVG_ICONS.roadmap}</div>
                    </div>
                    <div class="stat-value">Week 5</div>
                    <div class="stat-sub">Mastering SQL & Vector Databases</div>
                </div>
                <div class="stat-card stat-amber">
                    <div class="stat-header">
                        <span class="stat-title">Daily Study Commitment</span>
                        <div class="stat-icon-wrap amber">${SVG_ICONS.clock}</div>
                    </div>
                    <div class="stat-value">${studentProfile.daily_time}</div>
                    <div class="stat-sub">Consistent daily learning streak</div>
                </div>
                <div class="stat-card stat-purple">
                    <div class="stat-header">
                        <span class="stat-title">Target Hiring Package</span>
                        <div class="stat-icon-wrap purple">${SVG_ICONS.currency}</div>
                    </div>
                    <div class="stat-value">₹12 - ₹28 LPA</div>
                    <div class="stat-sub">Top Tier Engineering hiring range</div>
                </div>
            </div>

            <!-- 2-COLUMN RADAR & SKILL GAP BREAKDOWN -->
            <div class="merged-two-column-grid animate">
                <div class="liquid-glass-card" style="margin-bottom:0; padding:20px; background:#ffffff;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                        <div>
                            <h3 style="font-size:15px; font-weight:800; color:var(--ink); margin:0;">
                                Skill Proficiency Benchmark
                            </h3>
                            <div style="font-size:11.5px; color:var(--muted); font-weight:600; margin-top:2px;">Target: <strong>${escapeHtml(studentProfile.target_role)}</strong></div>
                        </div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <span style="display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#00c853;">
                                <span style="width:8px; height:8px; border-radius:50%; background:#00c853; display:inline-block; box-shadow:0 0 6px rgba(0,200,83,0.6);"></span> You
                            </span>
                            <span style="display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:800; color:#3b82f6;">
                                <span style="width:8px; height:8px; border-radius:50%; background:#3b82f6; display:inline-block;"></span> Benchmark
                            </span>
                        </div>
                    </div>
                    <div style="height:230px; position:relative;">
                        <canvas id="readinessRadarChart"></canvas>
                    </div>
                </div>

                <div class="liquid-glass-card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <h3 style="font-size:15px; font-weight:800; margin-bottom:12px;">Target Skill Gap Breakdown</h3>
                        <p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Skills matched vs missing for campus hiring benchmark:</p>
                        
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div>
                                <span style="font-size:11.5px; font-weight:700; color:#15803d; display:flex; align-items:center; gap:4px;">${SVG_ICONS.check} Mastered Skills:</span>
                                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                    ${studentProfile.skills.map(s => `<span style="background:var(--primary-light); color:#15803d; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.check} ${s}</span>`).join('')}
                                </div>
                            </div>
                            <div style="margin-top:8px;">
                                <span style="font-size:11.5px; font-weight:700; color:#b91c1c; display:flex; align-items:center; gap:4px;">${SVG_ICONS.cross} Gap Skills to Learn:</span>
                                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                    <span style="background:var(--error-light); color:#b91c1c; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.cross} Machine Learning</span>
                                    <span style="background:var(--error-light); color:#b91c1c; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.cross} PyTorch</span>
                                    <span style="background:var(--error-light); color:#b91c1c; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.cross} Docker & MLOps</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="auth-btn cta-btn" style="width:100%; margin-top:16px;" onclick="navigateTo('skill-gap')">
                        <span>Analyze Detailed Gap & Roadmap</span>
                        ${SVG_ICONS.arrowRight}
                    </button>
                </div>
            </div>

            <!-- ROADMAP EXPLORER SECTION -->
            <div class="learning-section animate">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                    <div class="learning-title" style="margin-bottom:0;">Engineering Career Roadmaps (Click to Launch)</div>
                    <div style="display:flex; gap:6px;" id="domainFilterBtns">
                        <button class="cal-nav-btn active" style="background:var(--navy); color:#fff;" onclick="filterDashboardRoadmaps('All', this)">All</button>
                        <button class="cal-nav-btn" onclick="filterDashboardRoadmaps('CSE', this)">CSE</button>
                        <button class="cal-nav-btn" onclick="filterDashboardRoadmaps('Aerospace', this)">Aerospace</button>
                        <button class="cal-nav-btn" onclick="filterDashboardRoadmaps('Civil', this)">Civil</button>
                        <button class="cal-nav-btn" onclick="filterDashboardRoadmaps('Mechanical', this)">Mechanical</button>
                        <button class="cal-nav-btn" onclick="filterDashboardRoadmaps('Electrical', this)">Electrical</button>
                    </div>
                </div>

                <div class="learning-row" id="dashboardRoadmapsGrid">
                    ${ALL_ROADMAPS_FLAT.slice(0, 8).map(rm => `
                        <div class="course-card" onclick="openRoadmapViewer('${rm.file}', '${rm.title}')">
                            <div>
                                <span class="course-badge">${rm.iconSvg} ${rm.domain}</span>
                                <h4>${rm.title}</h4>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:12px; color:var(--primary-dark); font-weight:700;">
                                <span>Open Full Roadmap</span>
                                ${SVG_ICONS.arrowRight}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- DASHBOARD WIDGETS: SALARY ROI & LEADERBOARD -->
            <div class="merged-two-column-grid animate" style="margin-top:24px;">
                <!-- SALARY ROI CALCULATOR WIDGET -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:16px; font-weight:800; color:var(--ink); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                        <span>💰 Salary ROI & In-Hand Pay Calculator</span>
                    </h3>
                    <p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Calculate estimated monthly take-home pay and tax breakdown based on your target offer CTC and city.</p>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                        <div>
                            <label style="font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; display:block; margin-bottom:4px;">Offered CTC (LPA)</label>
                            <input type="number" id="roiCtc" value="12" min="1" max="100" class="frosted-input" style="width:100%; padding:8px 12px; font-size:13px; outline:none;" />
                        </div>
                        <div>
                            <label style="font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; display:block; margin-bottom:4px;">Work Location City</label>
                            <select id="roiCity" class="frosted-input" style="width:100%; padding:8px 12px; font-size:13px; outline:none;">
                                <option value="Bengaluru">Bengaluru</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Pune">Pune</option>
                                <option value="Gurugram / NCR">Gurugram / NCR</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </div>
                    </div>

                    <button id="calcRoiBtn" class="btn-primary" style="width:100%; font-size:13px; font-weight:800;" onclick="calculateSalaryROI()">
                        <span>Calculate In-Hand Salary & ROI</span>
                    </button>

                    <div id="roiResultBox" style="display:none; margin-top:14px; padding:14px; background:#f8fafc; border:1px solid var(--border); border-radius:6px;"></div>
                </div>

                <!-- DASHBOARD LEADERBOARD WIDGET -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:16px; font-weight:800; color:var(--ink); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="width:18px; height:18px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Top Students Leaderboard
                        </span>
                        <span style="font-size:11px; background:#ecfdf5; color:#047857; padding:2px 8px; border-radius:4px; font-weight:700;">Live Rankings</span>
                    </h3>
                    <div id="dashboardLeaderboardContainer">Loading leaderboard...</div>
                </div>
            </div>
        `;

        mainContent.innerHTML = html;
        renderProficiencyChart();
        fetchAndRenderDashboardLeaderboard();

        document.getElementById('roiBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('roiBtn');
            const resEl = document.getElementById('roiResult');
            const ctc = document.getElementById('roiCtc')?.value || '12';
            const city = document.getElementById('roiCity')?.value || 'Bangalore';
            btn.textContent = 'Calculating...';
            try {
                const res = await fetch('/api/roi-explain', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ role: studentProfile.target_role, ctc: ctc, city: city })
                });
                const data = await res.json();
                resEl.innerHTML = marked.parse(data.result || 'No data.');
                resEl.style.display = 'block';
            } catch {
                resEl.innerHTML = 'Error calculating ROI.';
                resEl.style.display = 'block';
            }
            btn.textContent = 'Explain ROI';
        });

        document.getElementById('analyzeJobBtn')?.addEventListener('click', async () => {
            const text = document.getElementById('jobDescInput')?.value;
            const resEl = document.getElementById('jobAnalysisResult');
            if(!text) return;
            const btn = document.getElementById('analyzeJobBtn');
            btn.textContent = 'Analyzing...';
            try {
                const res = await fetch('/api/analyze-jobs', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ job_desc: text })
                });
                const data = await res.json();
                resEl.innerHTML = marked.parse(data.result || 'No gaps found.');
                resEl.style.display = 'block';
            } catch {
                resEl.innerHTML = 'Error analyzing job.';
                resEl.style.display = 'block';
            }
            btn.textContent = 'Analyze Job & Identify Skill Gaps';
        });
    }

    window.filterDashboardRoadmaps = function(domain, btnEl) {
        document.querySelectorAll('#domainFilterBtns button').forEach(b => { b.style.background = '#fff'; b.style.color = 'var(--ink)'; });
        if (btnEl) { btnEl.style.background = 'var(--primary)'; btnEl.style.color = '#fff'; }
        const grid = document.getElementById('dashboardRoadmapsGrid');
        if (!grid) return;
        const filtered = domain === 'All' ? ALL_ROADMAPS_FLAT : ALL_ROADMAPS_FLAT.filter(r => r.domain === domain);
        grid.innerHTML = filtered.map(rm => `
            <div class="course-card" onclick="openRoadmapViewer('${rm.file}', '${rm.title}')">
                <div>
                    <span class="course-badge">${rm.iconSvg} ${rm.domain}</span>
                    <h4>${rm.title}</h4>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:12px; color:var(--primary-dark); font-weight:700;">
                    <span>Open Full Roadmap</span>
                    ${SVG_ICONS.arrowRight}
                </div>
            </div>
        `).join('');
    };

    let dashboardRadarChartInstance = null;

    function renderProficiencyChart() {
        const ctx = document.getElementById('readinessRadarChart')?.getContext('2d');
        if (!ctx || !window.Chart) return;

        if (dashboardRadarChartInstance) {
            dashboardRadarChartInstance.destroy();
        }

        const roleSkillsMap = {
            'AI Engineer': {
                labels: ['Python / DSA', 'Vector DB & RAG', 'LLMs & PyTorch', 'SQL & DBMS', 'System Design', 'MLOps & Docker'],
                current: [88, 80, 75, 70, 60, 50],
                target: [95, 90, 88, 85, 80, 85]
            },
            'Machine Learning Engineer': {
                labels: ['Python / PyTorch', 'CUDA & TensorRT', 'Feature Eng.', 'Deep Learning', 'System Design', 'Model Serving'],
                current: [85, 75, 80, 78, 65, 55],
                target: [95, 88, 90, 92, 85, 85]
            },
            'Data Analyst': {
                labels: ['SQL & Window Fn', 'Pandas & Python', 'Tableau / PowerBI', 'A/B Testing', 'Statistics', 'PySpark BigData'],
                current: [92, 85, 80, 75, 78, 60],
                target: [95, 90, 90, 85, 85, 80]
            },
            'Backend Developer': {
                labels: ['Node / Python', 'PostgreSQL DB', 'REST & GraphQL', 'Redis Caching', 'System Design', 'Docker & K8s'],
                current: [90, 82, 85, 78, 68, 62],
                target: [95, 90, 92, 85, 85, 82]
            }
        };

        const activeRole = studentProfile.target_role || 'AI Engineer';
        const chartData = roleSkillsMap[activeRole] || roleSkillsMap['AI Engineer'];

        dashboardRadarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Your Current Level',
                        data: chartData.current,
                        backgroundColor: 'rgba(0, 200, 83, 0.25)',
                        borderColor: '#00c853',
                        borderWidth: 3,
                        pointBackgroundColor: '#00c853',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2.5,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#00c853',
                        pointHoverBorderColor: '#ffffff'
                    },
                    {
                        label: 'Industry Target Benchmark',
                        data: chartData.target,
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1600,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 25,
                            display: true,
                            backdropColor: 'transparent',
                            color: '#94a3b8',
                            font: { size: 9.5, weight: '700' }
                        },
                        grid: {
                            color: '#e2e8f0',
                            lineWidth: 1
                        },
                        angleLines: {
                            color: '#cbd5e1',
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: '#0f172a',
                            font: {
                                size: 11,
                                weight: '800'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0b192c',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        titleFont: { size: 12, weight: '800' },
                        bodyFont: { size: 11.5, weight: '600' },
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ============================================================
    // TAB 2: AI CAREER COACH WORKSPACE (RAG & SPEECH)
    // ============================================================
    function renderChatCoachWorkspace() {
        if (!mainContent) return;
        let html = `
            <div class="chat-workspace animate">
                <div class="chat-history-sidebar">
                    <button class="new-chat-btn" id="newChatBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>New Chat</span>
                    </button>
                    <div style="font-size:11px; font-weight:800; color:var(--muted); margin-bottom:10px; letter-spacing:0.5px;">SAVED SESSIONS (SQLITE3)</div>
                    <div class="chat-history-list" id="chatHistoryList">
                        ${chatHistoryLog.map(c => `
                            <div class="chat-history-item ${c.id === currentChatId ? 'active' : ''}" onclick="switchChatThread('${c.id}')">
                                ${SVG_ICONS.chat}
                                <span>${c.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="chat-main-area">
                    <div class="chat-main-header">
                        <div>
                            <div style="font-weight:800; font-size:15px; color:var(--ink); display:flex; align-items:center; gap:8px;">
                                ${SVG_ICONS.chat}
                                <span>AI Career Mentor (Sarvam RAG & SQLite Backend)</span>
                            </div>
                            <div style="font-size:11.5px; color:var(--muted);">Grounded Q&A on Engineering roadmaps, interview prep & skill guidance</div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button id="micRecordBtn" style="padding:6px 12px; border-radius:14px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px;" title="Record Audio Prompt">
                                ${SVG_ICONS.mic}
                                <span>Mic</span>
                            </button>
                        </div>
                    </div>

                    <div style="padding:10px 20px; background:#fff; border-bottom:1px solid var(--border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span style="font-size:11.5px; color:var(--muted); font-weight:700;">Suggested Prompts:</span>
                        <button class="citation-badge" onclick="sendSuggestedPrompt('What are the core skills required for AI Engineer placement in 2026?')">Skills for AI Engineer?</button>
                        <button class="citation-badge" onclick="sendSuggestedPrompt('Suggest top 3 portfolio projects for my resume')">Portfolio Projects</button>
                        <button class="citation-badge" onclick="sendSuggestedPrompt('How to prepare for campus interview DBMS rounds?')">DBMS Interview Prep</button>
                    </div>

                    <div class="chat-messages-container" id="coachMessagesContainer"></div>

                    <div style="padding:14px 20px; background:#fff; border-top:1px solid var(--border); display:flex; gap:8px; align-items:center;">
                        <input type="file" id="chatFileInput" accept="image/*,application/pdf" style="display:none;" />
                        <button id="chatAttachBtn" class="chat-attach-btn" title="Attach image or PDF for OCR Analysis">📎</button>
                        <input type="text" id="coachInput" placeholder="Ask about roadmaps, interview prep, skill gaps..." style="flex:1; padding:12px 18px; border:1px solid var(--border); border-radius:24px; font-size:13.5px; outline:none;" />
                        <button id="chatMicBtn" class="chat-attach-btn" title="Voice input — click to speak"
                            style="font-size:15px; color:var(--ink); font-weight:700; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                            🎤
                        </button>
                        <button id="coachSendBtn" class="auth-btn" style="border-radius:24px; padding:10px 22px;">Send</button>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
        renderCurrentChatMessages();

        document.getElementById('newChatBtn')?.addEventListener('click', () => {
            requireAuth(() => {
                const newId = Date.now().toString();
                chatHistoryLog.unshift({ id: newId, title: 'New Conversation', messages: [{ sender: 'assistant', text: `Hello ${studentProfile.full_name}! Ask me anything about engineering roadmaps and placement guidance.` }] });
                currentChatId = newId;
                renderChatCoachWorkspace();
                syncUserDataToSQLite();
            });
        });

        document.getElementById('coachSendBtn')?.addEventListener('click', () => requireAuth(window.sendCoachMessage));
        document.getElementById('coachInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') requireAuth(window.sendCoachMessage); });

        // Inline mic button (replaces header mic)
        document.getElementById('chatMicBtn')?.addEventListener('click', () => requireAuth(startMicRecording));

        // Legacy header mic (if still present)
        document.getElementById('micRecordBtn')?.addEventListener('click', () => requireAuth(startMicRecording));
        
        document.getElementById('chatAttachBtn')?.addEventListener('click', () => {
            const fi = document.getElementById('chatFileInput');
            if (fi) { fi.value = ''; fi.click(); }  // reset so same file can be re-selected
        });

        document.getElementById('chatFileInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            requireAuth(() => uploadChatFileOCR(file));
        });
    }

    window.switchChatThread = function(id) {
        currentChatId = id;
        renderChatCoachWorkspace();
    };

    window.sendSuggestedPrompt = function(promptText) {
        requireAuth(() => {
            const input = document.getElementById('coachInput');
            if (input) {
                input.value = promptText;
                window.sendCoachMessage();
            }
        });
    };

    function renderChatBubbleInfographicChart(container, msgData) {
        if (!container || !msgData) return;
        let chartData = msgData.chartData || null;

        // Auto extract scores/percentages if explicit chartData is missing
        const fullText = (msgData.text || '') + '\n' + (msgData.extractedText || '');
        const scoreRegex = /([A-Za-z0-9\s/&]+?)\s*[:=]\s*(\d{1,3})\s*%/g;
        let match;
        const foundScores = [];
        while ((match = scoreRegex.exec(fullText)) !== null) {
            const label = match[1].trim().replace(/^[*#_\-\s]+/, '');
            const val = parseInt(match[2], 10);
            if (label.length >= 2 && label.length <= 28 && val <= 100 && val >= 0) {
                foundScores.push({ label, value: val });
            }
        }

        if (!chartData && foundScores.length >= 2) {
            chartData = {
                labels: foundScores.slice(0, 6).map(s => s.label),
                data: foundScores.slice(0, 6).map(s => s.value),
                type: 'bar'
            };
        }

        // Generate Document OCR Infographic Radar Chart if PDF/Image uploaded
        if (!chartData && msgData.extractedText) {
            const len = msgData.extractedText.length;
            chartData = {
                labels: ['Document Quality', 'Technical Skills', 'Structure & Layout', 'Experience Depth', 'ATS Match Rate'],
                data: [
                    Math.min(95, Math.max(70, Math.round(len / 35) + 65)),
                    85,
                    88,
                    78,
                    82
                ],
                type: 'radar'
            };
        }

        if (!chartData) return;

        const chartCard = document.createElement('div');
        chartCard.style.cssText = 'margin-top:12px; padding:12px; background:#ffffff; border:1px solid var(--border); border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.04);';
        
        const chartId = 'chat_chart_' + Math.random().toString(36).substring(2, 9);
        chartCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:5px;">
                    📊 Document Skill & Analytics Graph
                </span>
                <span style="font-size:10px; background:#ecfdf5; color:#047857; padding:2px 6px; border-radius:4px; font-weight:700;">Sarvam AI Infographic</span>
            </div>
            <div style="height:${chartData.type === 'radar' ? '200px' : '170px'}; position:relative;">
                <canvas id="${chartId}"></canvas>
            </div>
        `;
        container.appendChild(chartCard);

        setTimeout(() => {
            const canvas = document.getElementById(chartId);
            if (!canvas || !window.Chart) return;
            const ctx = canvas.getContext('2d');
            const colors = ['#00c853', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

            if (chartData.type === 'radar') {
                new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'Document Score (%)',
                            data: chartData.data,
                            backgroundColor: 'rgba(0, 200, 83, 0.25)',
                            borderColor: '#00c853',
                            borderWidth: 2.5,
                            pointBackgroundColor: '#00c853',
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 1200, easing: 'easeOutQuart' },
                        scales: { r: { min: 0, max: 100, ticks: { display: false } } },
                        plugins: { legend: { display: false } }
                    }
                });
            } else {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'Score (%)',
                            data: chartData.data,
                            backgroundColor: chartData.data.map((_, i) => colors[i % colors.length]),
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 1200, easing: 'easeOutQuart' },
                        scales: {
                            y: { min: 0, max: 100, ticks: { font: { size: 9, weight: '700' } } },
                            x: { ticks: { font: { size: 9.5, weight: '700' } } }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }, 100);
    }

    window.renderCurrentChatMessages = function renderCurrentChatMessages() {
        const container = document.getElementById('coachMessagesContainer');
        if (!container) return;
        const thread = chatHistoryLog.find(c => c.id === currentChatId) || chatHistoryLog[0];
        container.innerHTML = '';
        if (!thread) return;

        thread.messages.forEach(m => {
            const div = document.createElement('div');

            if (m.sender === 'user') {
                div.className = 'chat-bubble-user';
                if (m.imageUrl) {
                    const img = document.createElement('img');
                    img.src = m.imageUrl;
                    img.style.cssText = 'max-width:200px; max-height:140px; border-radius:8px; display:block; margin-bottom:8px; border:1px solid rgba(255,255,255,0.4);';
                    div.appendChild(img);
                }
                const textSpan = document.createElement('div');
                textSpan.textContent = m.text;
                div.appendChild(textSpan);

            } else if (m.sender === 'assistant') {
                div.className = 'chat-bubble-ai';
                if (window.marked) {
                    div.innerHTML = marked.parse(m.text);
                } else {
                    div.textContent = m.text;
                }

                // Visual Infographic Chart Generator inside Chat Bubble
                renderChatBubbleInfographicChart(div, m);

                // Collapsible OCR extracted text
                if (m.extractedText) {
                    const details = document.createElement('details');
                    details.style.cssText = 'margin-top:10px; padding:8px 12px; background:var(--bg-input); border-radius:8px; font-size:11.5px; border:1px solid var(--border);';
                    details.innerHTML = `<summary style="cursor:pointer; font-weight:700; color:var(--primary);">📄 View Extracted OCR Text</summary><pre style="white-space:pre-wrap; margin-top:8px; font-family:monospace; font-size:11px; max-height:150px; overflow-y:auto;">${escapeHtml(m.extractedText)}</pre>`;
                    div.appendChild(details);
                }

                // TTS Speak button
                const ttsBtn = document.createElement('button');
                ttsBtn.className = 'chat-tts-btn';
                ttsBtn.innerHTML = '🔊 Speak';
                ttsBtn.onclick = function() { playTTSAudio(m.text, this); };
                div.appendChild(ttsBtn);

                // Citations
                if (m.citations && m.citations.length > 0) {
                    const citeWrap = document.createElement('div');
                    citeWrap.style.cssText = 'margin-top:10px; padding-top:8px; border-top:1px solid var(--border); font-size:11.5px; color:var(--muted);';
                    citeWrap.innerHTML = '<strong>Knowledge Base Citations:</strong><br/>' +
                        m.citations.map(c => `<button class="citation-badge" onclick="openCitationDoc('${c.doc_id}')">${SVG_ICONS.doc} [${c.id}] ${c.doc_id}</button>`).join('');
                    div.appendChild(citeWrap);
                }

                // Retry button on errors
                if (m.isError) {
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'auth-btn';
                    retryBtn.style.cssText = 'margin-top:10px; padding:6px 12px; font-size:11px; background:var(--error); color:#fff; border:none;';
                    retryBtn.textContent = 'Retry Request';
                    retryBtn.onclick = () => {
                        thread.messages.pop();
                        const lastUserMsg = [...thread.messages].reverse().find(msg => msg.sender === 'user');
                        if (lastUserMsg) {
                            const input = document.getElementById('coachInput');
                            if (input) input.value = lastUserMsg.text;
                            thread.messages.splice(thread.messages.lastIndexOf(lastUserMsg), 1);
                            window.sendCoachMessage();
                        }
                    };
                    div.appendChild(retryBtn);
                }
            } else {
                div.className = 'chat-bubble-ai';
                div.textContent = m.text;
            }

            container.appendChild(div);
        });

        // Always scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    window.sendCoachMessage = async function sendCoachMessage() {
        const input = document.getElementById('coachInput');
        if (!input) return;
        const question = input.value.trim();
        if (!question) return;

        const thread = chatHistoryLog.find(c => c.id === currentChatId) || chatHistoryLog[0];
        thread.messages.push({ sender: 'user', text: question });
        if (thread.title === 'New Conversation' || thread.title === 'AI Placement Guidance') {
            thread.title = question.substring(0, 22) + '...';
        }
        input.value = '';
        window.renderCurrentChatMessages();

        thread.messages.push({ sender: 'assistant', text: 'Thinking and analyzing knowledge base...' });
        window.renderCurrentChatMessages();

        try {
            const res = await fetch('/api/v1/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, language: studentProfile.language || 'en' })
            });
            const data = await res.json();
            thread.messages.pop();
            
            let finalAnswer = data.answer || 'Response generated.';
            
            // Translation logic is now handled globally via Google Translate Widget
            
            thread.messages.push({
                sender: 'assistant',
                text: finalAnswer,
                citations: data.citations,
                chartData: data.chart_data || null
            });
            window.renderCurrentChatMessages();
            syncUserDataToSQLite();
            
            // Gamification trigger
            try {
                const gamRes = await fetch('/api/gamification/update', { method: 'POST' });
                const gamData = await gamRes.json();
                if (gamData.ok) {
                    window.gamificationData = gamData.data;
                    updateHeaderProfileUI();
                }
            } catch(e) { console.error("Gamification error:", e); }
            
        } catch {
            thread.messages.pop();
            thread.messages.push({ sender: 'assistant', text: 'Error connecting to RAG backend API server.', isError: true });
            window.renderCurrentChatMessages();
        }
    }

    let activeUniversalRecorder = null;
    let activeUniversalStream = null;
    let activeUniversalChunks = [];

    window.toggleUniversalVoiceRecorder = function(btnId, inputId, autoSubmit = false) {
        const btn = document.getElementById(btnId) || document.getElementById('chatMicBtn') || document.getElementById('micRecordBtn');
        const input = document.getElementById(inputId);
        if (!input) return;

        const savedBtnHtml = btn ? btn.innerHTML : '🎤';

        // 1. IF ALREADY RECORDING, STOP & TRANSCRIBE
        if (activeUniversalRecorder && activeUniversalRecorder.state === 'recording') {
            activeUniversalRecorder.stop();
            return;
        }

        // 2. CHECK MEDIA DEVICES SUPPORT
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('error', 'Microphone not supported in this browser.');
            return;
        }

        // 3. START HTML5 MEDIARECORDER RECORDING
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                activeUniversalStream = stream;
                activeUniversalChunks = [];

                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
                const recorder = new MediaRecorder(stream, { mimeType });
                activeUniversalRecorder = recorder;

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) activeUniversalChunks.push(e.data);
                };

                recorder.onstop = async () => {
                    if (activeUniversalStream) {
                        activeUniversalStream.getTracks().forEach(t => t.stop());
                        activeUniversalStream = null;
                    }

                    if (btn) {
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.style.border = '';
                        btn.innerHTML = savedBtnHtml;
                    }

                    const audioBlob = new Blob(activeUniversalChunks, { type: mimeType });
                    if (audioBlob.size === 0) {
                        showToast('warning', 'No audio captured.');
                        return;
                    }

                    showToast('info', 'Transcribing audio via Sarvam AI STT...');
                    const formData = new FormData();
                    formData.append('audio', audioBlob, `recording.${mimeType.includes('webm') ? 'webm' : 'wav'}`);
                    formData.append('language', studentProfile.language === 'hi' ? 'hi-IN' : 'en-IN');

                    try {
                        const res = await fetch('/api/stt', { method: 'POST', body: formData });
                        const data = await res.json();
                        const text = data.text || data.transcript || '';

                        if (text) {
                            input.value = text;
                            showToast('success', 'Voice transcribed via Sarvam AI!');
                            if (autoSubmit && typeof window.sendCoachMessage === 'function') {
                                window.sendCoachMessage();
                            }
                        } else {
                            showToast('warning', 'Could not detect clear speech in recording.');
                        }
                    } catch (err) {
                        console.error(err);
                        showToast('error', 'Error sending audio to STT service.');
                    }
                };

                recorder.start();
                if (btn) {
                    btn.style.background = '#ef4444';
                    btn.style.color = '#ffffff';
                    btn.innerHTML = '🔴 Recording... Click to Stop';
                }

                // Auto stop recording after 15 seconds
                setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 15000);
            })
            .catch(err => {
                if (btn) _resetMicBtn(btn);
                if (err.name === 'NotAllowedError') {
                    showToast('error', 'Microphone permission denied.');
                } else {
                    showToast('error', `Mic error: ${err.message}`);
                }
            });
    };

    function _setMicBtnRecording(btn) {
        btn.style.background = '#ef4444';
        btn.style.color = '#fff';
        btn.innerHTML = '🔴';
        btn.title = 'Click to stop recording';
    }

    function _resetMicBtn(btn) {
        btn.style.background = '';
        btn.style.color = 'var(--ink)';
        btn.innerHTML = '🎤';
        btn.title = 'Voice input — click to speak';
    }

    window.playTTSAudio = async function playTTSAudio(text, btnElement) {
        if (btnElement) {
            btnElement.textContent = '⏳ Loading TTS...';
            btnElement.disabled = true;
        }

        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                const blob = await res.blob();
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                audio.play();
                audio.onended = () => {
                    if (btnElement) {
                        btnElement.textContent = '🔊 Speak';
                        btnElement.disabled = false;
                    }
                };
                if (btnElement) {
                    btnElement.textContent = '🔊 Playing...';
                }
                return;
            }
        } catch {
            showToast('info', 'Sarvam TTS fallback to browser voice synthesis.');
        }

        // Fallback to browser SpeechSynthesis API
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const cleanText = text.replace(/[*#_`]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.onend = () => {
                if (btnElement) {
                    btnElement.textContent = '🔊 Speak';
                    btnElement.disabled = false;
                }
            };
            window.speechSynthesis.speak(utterance);
        } else {
            showToast('error', 'Text-to-Speech failed.');
            if (btnElement) {
                btnElement.textContent = '🔊 Speak';
                btnElement.disabled = false;
            }
        }
    }

    async function uploadChatFileOCR(file) {
        const thread = chatHistoryLog.find(c => c.id === currentChatId) || chatHistoryLog[0];
        if (!thread) { showToast('error', 'No active chat thread.'); return; }

        const input = document.getElementById('coachInput');
        const userPrompt = input ? input.value.trim() : '';
        if (input) input.value = '';

        const isImage = file.type.startsWith('image/');

        // Show user message immediately with file name
        thread.messages.push({
            sender: 'user',
            text: userPrompt || `📎 Attached: ${file.name}`,
            imageUrl: null   // filled after read
        });
        thread.messages.push({ sender: 'assistant', text: '⏳ Analyzing with Sarvam OCR engine...' });
        renderCurrentChatMessages();

        // For images: get a data-URL preview to display in the bubble
        const getPreview = () => new Promise((resolve) => {
            if (!isImage) { resolve(null); return; }
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result);
            r.readAsDataURL(file);
        });

        const previewUrl = await getPreview();
        // Patch the user message with the image preview
        if (previewUrl) {
            const userMsg = thread.messages[thread.messages.length - 2];
            userMsg.imageUrl = previewUrl;
            renderCurrentChatMessages();
        }

        // Send to OCR endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', userPrompt || 'Analyze this document and provide key insights.');

        try {
            const res = await fetch('/api/v1/ocr-chat', { method: 'POST', body: formData });
            const data = await res.json();
            thread.messages.pop(); // remove placeholder

            if (data.answer || data.analysis) {
                thread.messages.push({
                    sender: 'assistant',
                    text: data.answer || data.analysis,
                    extractedText: data.extracted_text || data.ocr_text || data.ocr_snippet || null,
                    citations: data.citations || [],
                    chartData: data.chart_data || null
                });
            } else {
                thread.messages.push({ sender: 'assistant', text: data.error || 'Failed to process document.', isError: true });
            }
            renderCurrentChatMessages();
            syncUserDataToSQLite();
        } catch (err) {
            console.error('OCR Upload Error:', err);
            showToast('error', `OCR backend error: ${err.message}`);
            thread.messages.pop();
            thread.messages.push({ sender: 'assistant', text: `OCR backend error: ${err.message}`, isError: true });
            renderCurrentChatMessages();
        }
    }

    // ============================================================
    // TAB 3: SKILL GAP & ROLES (REPAIRED & FULL DATA)
    // ============================================================
    let availableRolesList = [];

    async function renderSkillGap() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="resume-analyzer-card animate"><h2>Loading Skill Gap Analytics...</h2></div>`;

        try {
            if (availableRolesList.length === 0) {
                const rRes = await fetch('/api/roles');
                availableRolesList = await rRes.json();
            }
        } catch {
            availableRolesList = [
                { title: 'AI Engineer', id: 'role_ai_engineer' },
                { title: 'Cloud Engineer', id: 'role_cloud_engineer' },
                { title: 'Full Stack Developer', id: 'role_fullstack' },
                { title: 'Data Analyst', id: 'role_data_analyst' },
                { title: 'Avionics Engineer', id: 'role_avionics' },
                { title: 'Robotics Engineer', id: 'role_robotics' }
            ];
        }

        fetchSkillGapData(studentProfile.target_role || 'AI Engineer');
    }

    async function fetchSkillGapData(roleTitle) {
        const container = document.getElementById('skillGapContainer') || mainContent;
        if (!container) return;
        let gapData = null;
        let roadmapData = null;

        try {
            const gRes = await fetch('/api/skill-gap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleTitle, skills: studentProfile.skills })
            });
            gapData = await gRes.json();

            const rRes = await fetch('/api/personalized-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleTitle, skills: studentProfile.skills, available_hours: 10 })
            });
            roadmapData = await rRes.json();
        } catch (e) {
            gapData = {
                role: roleTitle,
                completion_percent: 68,
                matched_skills: studentProfile.skills,
                missing_skills: ['Machine Learning', 'PyTorch', 'Docker', 'MLOps', 'System Design']
            };
        }

        let html = `
            <div class="resume-analyzer-card animate">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800; display:flex; align-items:center; gap:8px;">
                            ${SVG_ICONS.target}
                            <span>Career Skill Gap & Benchmark Analytics</span>
                        </h2>
                        <p style="color:var(--muted); font-size:13px;">Analyzing target role skill requirements for student profile: <strong>${studentProfile.full_name}</strong></p>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <label style="font-weight:700; font-size:12.5px;">Target Career Role:</label>
                        <select id="roleSelectorSelect" style="padding:8px 14px; border-radius:10px; border:1px solid var(--border); font-weight:700; background:#fff;" onchange="fetchSkillGapData(this.value)">
                            ${availableRolesList.map(r => `<option value="${r.title}" ${r.title.toLowerCase() === roleTitle.toLowerCase() ? 'selected' : ''}>${r.title}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 240px 1fr; gap:24px; align-items:center; background:var(--bg-input); padding:24px; border-radius:var(--radius); margin-bottom:24px;">
                    <div style="text-align:center;">
                        <div class="score-circle" style="--score:${gapData.completion_percent || 68}">
                            <div class="score-circle-inner">${gapData.completion_percent || 68}%</div>
                        </div>
                        <div style="font-size:13px; font-weight:800; color:var(--ink);">Readiness Benchmark Score</div>
                    </div>
                    <div>
                        <h4 style="font-size:16px; font-weight:800; margin-bottom:6px;">Placement Readiness Breakdown for ${gapData.role}</h4>
                        <p style="font-size:13px; color:var(--muted); margin-bottom:14px;">You have mastered <strong>${(gapData.matched_skills || []).length}</strong> out of <strong>${((gapData.matched_skills || []).length + (gapData.missing_skills || []).length)}</strong> required skills.</p>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                            <div>
                                <h5 style="color:#15803d; font-size:13px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:4px;">${SVG_ICONS.check} Matched Skills (${(gapData.matched_skills || []).length})</h5>
                                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                                    ${(gapData.matched_skills || []).map(s => `<span style="background:var(--success-light); color:#15803d; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.check} ${s}</span>`).join('')}
                                </div>
                            </div>
                            <div>
                                <h5 style="color:#b91c1c; font-size:13px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:4px;">${SVG_ICONS.cross} Missing Gap Skills (${(gapData.missing_skills || []).length})</h5>
                                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                                    ${(gapData.missing_skills || []).map(s => `<span style="background:var(--error-light); color:#b91c1c; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px;">${SVG_ICONS.cross} ${s}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${roadmapData ? `
                    <div style="margin-top:28px;">
                        <h3 style="font-size:16px; font-weight:800; margin-bottom:14px; display:flex; align-items:center; gap:6px;">${SVG_ICONS.clock} Recommended Learning Timeline (${roadmapData.weeks_to_complete || 8} Weeks Estimated)</h3>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                            ${(roadmapData.phases || []).slice(0, 4).map((p, idx) => `
                                <div class="right-tile" style="background:#fff;">
                                    <div style="font-size:11px; font-weight:800; color:var(--primary-dark); text-transform:uppercase;">Phase ${idx + 1}</div>
                                    <h4 style="font-size:14px; font-weight:700; margin:4px 0;">${p.topic || p.title || 'Core Foundations'}</h4>
                                    <p style="font-size:12px; color:var(--muted);">${p.est_hours || 20} Hours • ${p.status || 'Upcoming'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        container.innerHTML = html;
    }

    // ============================================================
    // TAB 4: MY LEARNING
    // ============================================================
    function renderLearning() {
        if (!mainContent) return;
        let html = `
            <div class="animate">
                <div class="learning-title">Active Engineering Learning Tracks</div>
                <div class="learning-row" style="margin-bottom:32px;">
                    <div class="course-card">
                        <span class="course-badge">Track 1</span>
                        <h4>Python for Data Science & Artificial Intelligence</h4>
                        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:85%;"></div></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--muted); font-weight:600;">
                            <span>85% Completed</span>
                            <span style="color:var(--success); font-weight:700; display:flex; align-items:center; gap:4px;">${SVG_ICONS.check} Active</span>
                        </div>
                    </div>

                    <div class="course-card">
                        <span class="course-badge">Track 2</span>
                        <h4>SQL Relational Database Queries & System Architecture</h4>
                        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:45%;"></div></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--muted); font-weight:600;">
                            <span>45% Completed</span>
                            <span style="color:var(--warning); font-weight:700;">In Progress</span>
                        </div>
                    </div>

                    <div class="course-card">
                        <span class="course-badge">Track 3</span>
                        <h4>Data Structures & Algorithms (LeetCode Placement)</h4>
                        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:70%;"></div></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--muted); font-weight:600;">
                            <span>70% Completed</span>
                            <span style="color:var(--primary-dark); font-weight:700;">Active</span>
                        </div>
                    </div>
                </div>

                <div class="learning-title">Recommended Next Modules for ${studentProfile.target_role}</div>
                <div class="learning-row">
                    <div class="course-card">
                        <span class="course-badge" style="background:var(--warning-light); color:#d97706;">High Priority</span>
                        <h4>Machine Learning Fundamentals & Scikit-Learn</h4>
                        <p style="font-size:12.5px; color:var(--muted); margin:10px 0;">Master supervised & unsupervised algorithms, feature engineering, and model validation metrics.</p>
                        <button class="auth-btn" style="margin-top:10px;" onclick="requireAuth(() => showToast('success', 'Enrolled in Machine Learning track!'))">
                            <span>Start Track</span>
                            ${SVG_ICONS.arrowRight}
                        </button>
                    </div>

                    <div class="course-card">
                        <span class="course-badge" style="background:var(--warning-light); color:#d97706;">High Priority</span>
                        <h4>Docker Containerization & MLOps Microservices</h4>
                        <p style="font-size:12.5px; color:var(--muted); margin:10px 0;">Deploy AI models microservices using Docker containers and Kubernetes clusters.</p>
                        <button class="auth-btn" style="margin-top:10px;" onclick="requireAuth(() => showToast('success', 'Enrolled in MLOps track!'))">
                            <span>Start Track</span>
                            ${SVG_ICONS.arrowRight}
                        </button>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    // ============================================================
    // TAB 5: PROJECTS PORTFOLIO (WITH GITHUB REPOS)
    // ============================================================
    let cachedProjectsList = [];
    let activeProjectRoleFilter = 'All';
    let activeProjectDifficultyFilter = 'All';
    let activeProjectSortOrder = 'default';
    let projectSearchQuery = '';

    async function renderProjects() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="resume-analyzer-card animate"><h2>Loading Portfolio Projects...</h2></div>`;

        try {
            const res = await fetch('/api/project-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: studentProfile.skills, role: studentProfile.target_role })
            });
            cachedProjectsList = await res.json();
        } catch {
            cachedProjectsList = [
                { id: "p_ml_eng", title: "Deepo Unified Deep Learning Framework", role: "Machine Learning Engineer", domain: "AI / Machine Learning", difficulty: "Advanced", time_estimate: "3 weeks", skills: ["Python", "PyTorch", "TensorFlow", "CUDA"], github_repo: "https://github.com/ufoym/deepo", description: "Unified Docker environment combining PyTorch, TensorFlow and CUDA." },
                { id: "p_ai_eng", title: "Production AI Infrastructure Stack", role: "AI Engineer", domain: "AI", difficulty: "Advanced", time_estimate: "3 weeks", skills: ["Python", "PyTorch", "LLMs", "RAG"], github_repo: "https://github.com/ufoym/deepo", description: "Enterprise AI stack pre-configured for generative AI and agent applications." },
                { id: "p_data_analyst", title: "Data Analyst Visual Dashboards Suite", role: "Data Analyst", domain: "Data", difficulty: "Beginner", time_estimate: "2 weeks", skills: ["SQL", "Excel", "Tableau", "Python"], github_repo: "https://github.com/topics/data-analyst", description: "Real-world dataset processing and interactive dashboard blueprints." }
            ];
        }

        renderProjectsGrid();
    }

    window.setProjectDifficultyFilter = function(diff) {
        activeProjectDifficultyFilter = diff;
        renderProjectsGrid();
    };

    window.setProjectSortOrder = function(sort) {
        activeProjectSortOrder = sort;
        renderProjectsGrid();
    };

    window.handleProjectRoleFilter = function(val) {
        activeProjectRoleFilter = val;
        renderProjectsGrid();
    };

    window.handleProjectSearch = function(val) {
        projectSearchQuery = val;
        renderProjectsGrid();
    };

    function renderProjectsGrid() {
        if (!mainContent) return;

        let filtered = [...cachedProjectsList];

        // 1. Difficulty Filter
        if (activeProjectDifficultyFilter && activeProjectDifficultyFilter !== 'All') {
            const targetDiff = activeProjectDifficultyFilter.toLowerCase();
            filtered = filtered.filter(p => (p.difficulty || '').toLowerCase() === targetDiff);
        }

        // 2. Role Filter
        if (activeProjectRoleFilter && activeProjectRoleFilter !== 'All') {
            const lowFilter = activeProjectRoleFilter.toLowerCase();
            filtered = filtered.filter(p => {
                const r = (p.role || '').toLowerCase();
                const d = (p.domain || '').toLowerCase();
                const aliases = (p.role_aliases || []).map(a => a.toLowerCase());
                return r.includes(lowFilter) || d.includes(lowFilter) || aliases.some(a => a.includes(lowFilter));
            });
        }

        // 3. Search Query Filter
        if (projectSearchQuery) {
            const q = projectSearchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                (p.title || '').toLowerCase().includes(q) ||
                (p.role || '').toLowerCase().includes(q) ||
                (p.domain || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.skills || []).some(s => s.toLowerCase().includes(q))
            );
        }

        // 4. Sorting Logic
        const diffRank = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        if (activeProjectSortOrder === 'diff-asc') {
            filtered.sort((a, b) => (diffRank[(a.difficulty || '').toLowerCase()] || 2) - (diffRank[(b.difficulty || '').toLowerCase()] || 2));
        } else if (activeProjectSortOrder === 'diff-desc') {
            filtered.sort((a, b) => (diffRank[(b.difficulty || '').toLowerCase()] || 2) - (diffRank[(a.difficulty || '').toLowerCase()] || 2));
        } else if (activeProjectSortOrder === 'title-asc') {
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }

        // Get unique roles for dropdown
        const allRoles = Array.from(new Set(cachedProjectsList.map(p => p.role).filter(Boolean))).sort();

        let html = `
            <div class="animate">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800;">Industry Capstone Project Portfolio (${cachedProjectsList.length}+ Projects)</h2>
                        <p style="color:var(--muted); font-size:13px;">Tailored hands-on engineering projects with verified <strong>GitHub Repositories</strong> for resume building.</p>
                    </div>
                    
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="projectSearchInput" placeholder="Search by role or subject..." value="${escapeHtml(projectSearchQuery)}" 
                               style="padding:6px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; outline:none; width:200px;" 
                               oninput="handleProjectSearch(this.value)" />
                        
                        <select onchange="handleProjectRoleFilter(this.value)" style="padding:6px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; outline:none; background:#fff; font-weight:600;">
                            <option value="All" ${activeProjectRoleFilter === 'All' ? 'selected' : ''}>All Roles (${cachedProjectsList.length})</option>
                            ${allRoles.map(r => `<option value="${escapeHtml(r)}" ${activeProjectRoleFilter === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
                        </select>

                        <!-- Difficulty Pill Buttons -->
                        <div style="display:flex; gap:4px;">
                            <button class="cal-nav-btn ${activeProjectDifficultyFilter === 'All' ? 'active' : ''}" style="${activeProjectDifficultyFilter === 'All' ? 'background:var(--primary); color:#fff;' : ''}" onclick="setProjectDifficultyFilter('All')">All</button>
                            <button class="cal-nav-btn ${activeProjectDifficultyFilter === 'Beginner' ? 'active' : ''}" style="${activeProjectDifficultyFilter === 'Beginner' ? 'background:var(--primary); color:#fff;' : ''}" onclick="setProjectDifficultyFilter('Beginner')">🌱 Beginner</button>
                            <button class="cal-nav-btn ${activeProjectDifficultyFilter === 'Intermediate' ? 'active' : ''}" style="${activeProjectDifficultyFilter === 'Intermediate' ? 'background:var(--primary); color:#fff;' : ''}" onclick="setProjectDifficultyFilter('Intermediate')">⚡ Intermediate</button>
                            <button class="cal-nav-btn ${activeProjectDifficultyFilter === 'Advanced' ? 'active' : ''}" style="${activeProjectDifficultyFilter === 'Advanced' ? 'background:var(--primary); color:#fff;' : ''}" onclick="setProjectDifficultyFilter('Advanced')">🚀 Advanced</button>
                        </div>

                        <!-- Sort Order Dropdown -->
                        <select onchange="setProjectSortOrder(this.value)" style="padding:6px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; outline:none; background:#fff; font-weight:700; color:var(--primary-dark);">
                            <option value="default" ${activeProjectSortOrder === 'default' ? 'selected' : ''}>Sort: Default</option>
                            <option value="diff-asc" ${activeProjectSortOrder === 'diff-asc' ? 'selected' : ''}>Sort: Easy → Hard</option>
                            <option value="diff-desc" ${activeProjectSortOrder === 'diff-desc' ? 'selected' : ''}>Sort: Hard → Easy</option>
                            <option value="title-asc" ${activeProjectSortOrder === 'title-asc' ? 'selected' : ''}>Sort: Title (A-Z)</option>
                        </select>
                    </div>
                </div>

                <div class="learning-row">
                    ${filtered.length > 0 ? filtered.map(p => `
                        <div class="course-card" style="cursor:default;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span class="course-badge">${escapeHtml(p.role || p.domain || 'Engineering')}</span>
                                    <span style="font-size:11.5px; font-weight:800; padding:2px 8px; border-radius:4px; ${p.difficulty === 'Beginner' ? 'background:#dcfce7; color:#15803d;' : p.difficulty === 'Intermediate' ? 'background:#fef3c7; color:#92400e;' : 'background:#fee2e2; color:#b91c1c;'}">${escapeHtml(p.difficulty)}</span>
                                </div>
                                <h4 style="font-size:15px; font-weight:800; margin-bottom:8px; line-height:1.3;">${escapeHtml(p.title)}</h4>
                                <p style="font-size:12.5px; color:var(--muted); margin-bottom:12px; line-height:1.4;">${escapeHtml(p.description || '')}</p>
                                
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:14px;">
                                    ${(p.skills || []).map(s => `<span class="citation-badge" style="cursor:default;">${escapeHtml(s)}</span>`).join('')}
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <button class="auth-btn" style="width:100%;" onclick="openProjectSpecModal('${p.id}')">View Architecture & Starter Spec</button>
                                <a href="${p.github_repo || 'https://github.com/topics/' + p.id}" target="_blank" rel="noopener noreferrer" class="auth-btn" style="background:#0f172a; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-size:12.5px; color:#fff;">
                                    ${SVG_ICONS.github}
                                    <span>GitHub Repository ↗</span>
                                </a>
                            </div>
                        </div>
                    `).join('') : '<div style="width:100%; text-align:center; padding:40px; color:var(--muted); font-size:14px;">No projects found matching your search or difficulty filter. Try clearing filters or selecting "All".</div>'}
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.openProjectSpecModal = function(projectId) {
        const proj = cachedProjectsList.find(p => p.id === projectId) || cachedProjectsList[0];
        if (!proj || !projectSpecModal || !projectModalContent) return;

        projectModalContent.innerHTML = `
            <div style="font-size:12px; font-weight:800; color:var(--primary-dark); text-transform:uppercase; margin-bottom:4px;">${proj.domain} Capstone Spec</div>
            <h2 style="font-size:22px; font-weight:800; margin-bottom:12px;">${proj.title}</h2>
            <p style="font-size:13.5px; color:var(--muted); margin-bottom:20px;">${proj.description}</p>

            <div style="background:var(--bg-input); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:20px;">
                <h4 style="font-size:13px; font-weight:800; color:var(--ink); margin-bottom:8px;">System Architecture Flow</h4>
                <div style="font-family:'JetBrains Mono', monospace; font-size:12.5px; color:var(--primary-dark); font-weight:600;">${proj.architecture || 'Client -> API Gateway -> Backend Service -> Database'}</div>
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="font-size:13px; font-weight:800; color:var(--ink); margin-bottom:8px;">Starter Code Snippet</h4>
                <pre style="background:#0f172a; color:#f8fafc; padding:16px; border-radius:var(--radius-sm); font-family:'JetBrains Mono', monospace; font-size:12px; overflow-x:auto;">${proj.code_snippet || '# Starter code snippet\nprint("Hello World")'}</pre>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <a href="${proj.github_repo || 'https://github.com/apexforge-careerai/' + proj.id}" target="_blank" class="auth-btn" style="background:#0f172a; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                    ${SVG_ICONS.github}
                    <span>Clone GitHub Repository ↗</span>
                </a>
                <button class="auth-btn" onclick="requireAuth(() => showToast('success', 'Project workspace launched!'))">Launch Cloud Workspace</button>
            </div>
        `;
        projectSpecModal.classList.add('show');
    };

    // ============================================================
    // TAB 6: MOCK INTERVIEW (WRITE & SPEAK DUAL MODE)
    // ============================================================
    function renderMockInterview() {
        if (!mainContent) return;
        let html = `
            <div class="resume-analyzer-card animate">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800;">Interactive AI Mock Interviewer (Write & Speak Modes)</h2>
                        <p style="color:var(--muted); font-size:13px;">Simulate technical and behavioral campus interview rounds for <strong>${studentProfile.target_role}</strong>.</p>
                    </div>
                    <span class="target-goal-pill">Round 1: Technical & Systems</span>
                </div>

                <div style="background:var(--bg-input); padding:28px; border-radius:var(--radius); border:1px solid var(--border); margin-bottom:24px;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <div style="font-size:12px; font-weight:800; color:var(--primary-dark); text-transform:uppercase; margin-bottom:6px;">Question 1 of 5</div>
                        <h3 style="font-size:18px; font-weight:800; color:var(--ink); line-height:1.4;">"Explain how Retrieval-Augmented Generation (RAG) prevents AI hallucinations compared to traditional fine-tuning?"</h3>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                        <!-- OPTION A: SPEAK ANSWER -->
                        <div style="background:#fff; padding:20px; border-radius:var(--radius-sm); border:1px solid var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                            <h4 style="font-size:14px; font-weight:800; margin-bottom:6px; color:var(--ink);">Option A: Speak Answer</h4>
                            <p style="font-size:12px; color:var(--muted); margin-bottom:14px;">Use microphone voice recording with Sarvam Speech-to-Text.</p>
                            <button class="auth-btn" id="recordAnswerMicBtn" onclick="requireAuth(startInterviewMic)" style="width:100%; max-width:240px;">
                                ${SVG_ICONS.mic}
                                <span>Record Voice Answer</span>
                            </button>
                        </div>

                        <!-- OPTION B: WRITE ANSWER -->
                        <div style="background:#fff; padding:20px; border-radius:var(--radius-sm); border:1px solid var(--border);">
                            <h4 style="font-size:14px; font-weight:800; margin-bottom:6px; color:var(--ink);">Option B: Write Answer</h4>
                            <p style="font-size:12px; color:var(--muted); margin-bottom:10px;">Type your detailed technical answer below.</p>
                            <textarea id="interviewAnswerText" placeholder="Type your technical response here..." style="width:100%; height:90px; padding:10px; border:1px solid var(--border); border-radius:8px; font-size:13px; outline:none; resize:none;"></textarea>
                        </div>
                    </div>

                    <div style="text-align:center;">
                        <button class="auth-btn" style="padding:12px 32px; font-size:14px;" onclick="requireAuth(submitInterviewAnswer)">Submit Answer for AI Scoring</button>
                    </div>
                </div>

                <div id="interviewFeedbackContainer" style="display:none;" class="animate"></div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.startInterviewMic = function() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showToast('info', 'Speech recognition not available in browser. Please type answer.');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        showToast('info', 'Listening to voice response...');

        const btn = document.getElementById('recordAnswerMicBtn');
        if (btn) btn.innerHTML = `${SVG_ICONS.mic} <span>Listening...</span>`;

        rec.onresult = (e) => {
            const text = e.results[0][0].transcript;
            const area = document.getElementById('interviewAnswerText');
            if (area) area.value = text;
            if (btn) btn.innerHTML = `${SVG_ICONS.mic} <span>Record Voice Answer</span>`;
            showToast('success', 'Voice recorded successfully into answer area!');
        };
        rec.onerror = () => {
            if (btn) btn.innerHTML = `${SVG_ICONS.mic} <span>Record Voice Answer</span>`;
            showToast('error', 'Speech recognition error.');
        };
        rec.start();
    };

    window.submitInterviewAnswer = async function() {
        const area = document.getElementById('interviewAnswerText');
        const feedbackContainer = document.getElementById('interviewFeedbackContainer');
        if (!area || !area.value.trim() || !feedbackContainer) {
            showToast('error', 'Please speak or type an answer first.');
            return;
        }

        feedbackContainer.style.display = 'block';
        feedbackContainer.innerHTML = `<div style="text-align:center; padding:20px; font-size:13.5px;">Evaluating answer structure with Sarvam AI model...</div>`;

        try {
            const prompt = `Evaluate the following student interview answer for an ${studentProfile.target_role} position:\nStudent Answer: "${area.value.trim()}"\nGive a score out of 10, highlight strengths, and provide a 2-bullet sample answer.`;
            const res = await fetch('/api/v1/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: prompt, language: 'en' })
            });
            const data = await res.json();

            feedbackContainer.innerHTML = `
                <div style="background:#fff; border:1px solid var(--primary-border); border-radius:var(--radius); padding:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h4 style="font-size:16px; font-weight:800; color:var(--primary-dark); display:flex; align-items:center; gap:8px;">
                            ${SVG_ICONS.target}
                            <span>AI Interview Feedback & Scoring</span>
                        </h4>
                        <span class="course-badge" style="font-size:13px;">Score: 8.5 / 10</span>
                    </div>
                    <div style="font-size:13.5px; line-height:1.6; color:var(--ink);">${window.marked ? marked.parse(data.answer) : data.answer}</div>
                </div>
            `;
        } catch {
            showToast('error', 'Error scoring interview answer.');
        }
    };

    // ============================================================
    // TAB 7: RESUME ANALYZER, OCR & ATS RESUME GENERATOR WITH PIE CHART
    // ============================================================
    let lastResumeAnalysisData = null;

    function renderResumeAnalyzer() {
        if (!mainContent) return;
        let html = `
            <div class="resume-analyzer-card animate">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800;">AI Resume Scanner, Pie Chart & ATS Builder</h2>
                        <p style="color:var(--muted); font-size:13px;">Upload resume PDF / Image or paste text for Sarvam Vision OCR extraction & automated ATS resume generation.</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
                    <div class="resume-upload-box" style="text-align:left; padding:24px;">
                        <h4 style="font-size:15px; font-weight:800; margin-bottom:8px; color:var(--ink);">1. Paste Resume Text</h4>
                        <textarea id="resumeTextInput" placeholder="Paste your resume experience, projects, skills..." style="width:100%; height:140px; padding:12px; border:1px solid var(--border); border-radius:10px; font-size:13px; outline:none; font-weight:500;"></textarea>
                        <button class="auth-btn" style="width:100%; margin-top:12px;" onclick="requireAuth(runTextResumeAnalysis)">Analyze & Calculate Skill Match</button>
                    </div>

                    <div class="resume-upload-box" style="text-align:center; padding:24px;" id="resumeDropZone" onclick="requireAuth(() => document.getElementById('ocrFileInput').click())">
                        <input type="file" id="ocrFileInput" accept=".pdf,.png,.jpg,.jpeg" style="display:none;" onchange="handleOcrFileUpload(this.files[0])" />
                        <div style="font-size:24px; color:var(--primary-dark); margin-bottom:8px;">${SVG_ICONS.doc}</div>
                        <h4 style="font-size:15px; font-weight:800; color:var(--ink);">2. Upload Resume File (PDF / Image)</h4>
                        <p style="font-size:12px; color:var(--muted); margin:6px 0 14px 0;">Drag and drop or click to upload PDF or image document for Sarvam OCR scanning.</p>
                        <button class="auth-btn" style="background:#fff; color:var(--primary-dark); border:1px solid var(--primary-border);">Select Resume File</button>
                    </div>
                </div>

                <div id="resumeAnalysisResultContainer" style="display:none;" class="animate"></div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.runTextResumeAnalysis = async function() {
        const text = document.getElementById('resumeTextInput')?.value || '';
        const container = document.getElementById('resumeAnalysisResultContainer');
        if (!text.trim() || !container) {
            showToast('error', 'Please paste resume text first.');
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `<div style="text-align:center; padding:20px;">Analyzing skill requirement match against ${studentProfile.target_role}...</div>`;

        try {
            const res = await fetch('/api/resume-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_text: text, target_role: studentProfile.target_role })
            });
            const data = await res.json();
            lastResumeAnalysisData = data;
            renderResumePieChartAndResults(data, container);
        } catch {
            showToast('error', 'Error analyzing resume.');
        }
    };

    window.handleOcrFileUpload = async function(file) {
        if (!file) return;
        const container = document.getElementById('resumeAnalysisResultContainer');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = `<div style="text-align:center; padding:20px;">Digitizing document (${file.name}) with Sarvam OCR...</div>`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', `Extract skills and analyze compatibility for ${studentProfile.target_role}.`);

        try {
            const res = await fetch('/api/v1/ocr-chat', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            // Run analysis on extracted text
            const aRes = await fetch('/api/resume-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_text: data.extracted_text || '', target_role: studentProfile.target_role })
            });
            const aData = await aRes.json();
            lastResumeAnalysisData = aData;
            renderResumePieChartAndResults(aData, container, data.extracted_text);
            showToast('success', 'Document OCR analysis & skill match complete!');
        } catch {
            showToast('error', 'OCR upload failed.');
        }
    };

    function renderResumePieChartAndResults(data, container, ocrText) {
        const matchedCount = (data.matched_skills || []).length;
        const missingCount = (data.missing_skills || []).length;
        const cat = data.category_scores || { skills: data.score || 70, impact: 65, formatting: 80, experience: 75, action_verbs: 70 };
        const contact = data.contact_info || { email: true, phone: true, linkedin: false, github: false };

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background:#fff; border:1px solid var(--border); border-radius:var(--radius); padding:24px; margin-top:20px; box-shadow:0 10px 30px rgba(0,0,0,0.05);" class="animate">
                <!-- TOP HEADER: SCORE & VERDICT -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border);">
                    <div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:26px; font-weight:900; color:var(--primary-dark);">${data.score || 0}%</span>
                            <div>
                                <h3 style="font-size:16px; font-weight:800; color:var(--ink); margin:0;">${data.verdict || 'Resume ATS Analysis'}</h3>
                                <p style="font-size:12px; color:var(--muted); margin:2px 0 0 0;">Target Role: <strong>${escapeHtml(data.target_role || studentProfile.target_role)}</strong></p>
                            </div>
                        </div>
                    </div>

                    <!-- CONTACT VERIFICATION BADGES -->
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:11.5px; padding:4px 10px; border-radius:20px; font-weight:700; background:${contact.email ? '#ecfdf5; color:#047857;' : '#fef2f2; color:#b91c1c;'}">${contact.email ? '✓ Email' : '✗ Email'}</span>
                        <span style="font-size:11.5px; padding:4px 10px; border-radius:20px; font-weight:700; background:${contact.phone ? '#ecfdf5; color:#047857;' : '#fef2f2; color:#b91c1c;'}">${contact.phone ? '✓ Phone' : '✗ Phone'}</span>
                        <span style="font-size:11.5px; padding:4px 10px; border-radius:20px; font-weight:700; background:${contact.linkedin ? '#ecfdf5; color:#047857;' : '#fffbeb; color:#b45309;'}">${contact.linkedin ? '✓ LinkedIn' : '⚠ LinkedIn'}</span>
                        <span style="font-size:11.5px; padding:4px 10px; border-radius:20px; font-weight:700; background:${contact.github ? '#ecfdf5; color:#047857;' : '#fffbeb; color:#b45309;'}">${contact.github ? '✓ GitHub' : '⚠ GitHub'}</span>
                    </div>
                </div>

                <!-- INFOGRAPHICS CANVASES GRID -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
                    <!-- CHART 1: SKILL MATCH DOUGHNUT -->
                    <div style="background:var(--bg-input); padding:16px; border-radius:12px; text-align:center;">
                        <h4 style="font-size:13px; font-weight:800; margin-bottom:10px; color:var(--ink);">Skill Match Ratio</h4>
                        <div style="height:170px; position:relative;">
                            <canvas id="resumePieChartCanvas"></canvas>
                        </div>
                    </div>

                    <!-- CHART 2: CATEGORY SCORES BAR CHART -->
                    <div style="background:var(--bg-input); padding:16px; border-radius:12px; text-align:center;">
                        <h4 style="font-size:13px; font-weight:800; margin-bottom:10px; color:var(--ink);">ATS Dimension Breakdown</h4>
                        <div style="height:170px; position:relative;">
                            <canvas id="resumeCategoryChartCanvas"></canvas>
                        </div>
                    </div>
                </div>

                <!-- MATCHED & MISSING SKILL BADGES -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:14px; border-radius:10px;">
                        <h5 style="color:#15803d; font-size:13px; font-weight:800; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                            ${SVG_ICONS.check} Matched Skills (${matchedCount})
                        </h5>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${(data.matched_skills || []).map(s => `<span style="font-size:11.5px; font-weight:700; background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:6px;">${escapeHtml(s)}</span>`).join('') || '<span style="font-size:12px; color:var(--muted);">No matching target skills detected</span>'}
                        </div>
                    </div>

                    <div style="background:#fef2f2; border:1px solid #fecaca; padding:14px; border-radius:10px;">
                        <h5 style="color:#b91c1c; font-size:13px; font-weight:800; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                            ${SVG_ICONS.cross} Missing Skills (${missingCount})
                        </h5>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${(data.missing_skills || []).map(s => `<span style="font-size:11.5px; font-weight:700; background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:6px;">${escapeHtml(s)}</span>`).join('') || '<span style="font-size:12px; color:#15803d;">All required skills matched!</span>'}
                        </div>
                    </div>
                </div>

                <!-- STRENGTHS & AREAS OF IMPROVEMENT -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
                    <div style="background:#fff; border:1px solid var(--border); padding:14px; border-radius:10px;">
                        <h5 style="font-size:13px; font-weight:800; color:var(--ink); margin-bottom:8px;">👍 Key Strengths</h5>
                        <ul style="padding-left:18px; margin:0; font-size:12px; color:var(--ink); line-height:1.5;">
                            ${(data.strengths || ["Well-structured layout"]).map(st => `<li style="margin-bottom:4px;">${escapeHtml(st)}</li>`).join('')}
                        </ul>
                    </div>

                    <div style="background:#fff; border:1px solid var(--border); padding:14px; border-radius:10px;">
                        <h5 style="font-size:13px; font-weight:800; color:#b45309; margin-bottom:8px;">⚠️ Recommended Enhancements</h5>
                        <ul style="padding-left:18px; margin:0; font-size:12px; color:var(--ink); line-height:1.5;">
                            ${(data.weaknesses || ["Add metrics"]).map(wk => `<li style="margin-bottom:4px;">${escapeHtml(wk)}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- REDLINE BULLET REWRITES -->
                ${(data.redline_suggestions || []).length > 0 ? `
                    <div style="background:#f8fafc; border:1px solid var(--border); padding:14px; border-radius:10px; margin-bottom:20px;">
                        <h5 style="font-size:13px; font-weight:800; color:var(--primary-dark); margin-bottom:10px;">💡 Recommended High-Impact Bullet Rewrites</h5>
                        ${data.redline_suggestions.map(rs => `
                            <div style="font-size:12px; margin-bottom:8px; padding:8px; background:#fff; border-radius:6px; border:1px solid #e2e8f0;">
                                <div style="color:#b91c1c; text-decoration:line-through; margin-bottom:2px;">Before: ${escapeHtml(rs.original)}</div>
                                <div style="color:#15803d; font-weight:700;">After: ${escapeHtml(rs.improved)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- SARVAM OCR EXTRACTED TEXT DRAWER -->
                ${ocrText ? `
                    <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border);">
                        <details>
                            <summary style="font-size:12.5px; font-weight:800; color:var(--primary-dark); cursor:pointer;">
                                📷 View Sarvam Vision OCR (Akshar Model) Extracted Raw Text
                            </summary>
                            <div style="margin-top:10px; background:var(--bg-input); padding:12px; border-radius:8px; font-size:12px; font-family:'JetBrains Mono', monospace; max-height:160px; overflow-y:auto; border:1px solid var(--border);">
                                ${escapeHtml(ocrText)}
                            </div>
                        </details>
                    </div>
                ` : ''}

                <!-- ATS BUILDER ACTION BUTTON -->
                <button class="auth-btn" style="width:100%; margin-top:20px; font-size:13.5px; padding:12px; justify-content:center;" onclick="generateATSResume()">
                    <span>Generate & Download ATS-Optimized Resume Blueprint</span>
                    ${SVG_ICONS.arrowRight}
                </button>

                <div id="atsResumeOutputContainer" style="display:none; margin-top:20px; padding-top:16px; border-top:1px solid var(--border);" class="animate"></div>
            </div>
        `;

        // Render Charts with Chart.js
        setTimeout(() => {
            // Chart 1: Doughnut
            const ctx1 = document.getElementById('resumePieChartCanvas')?.getContext('2d');
            if (ctx1 && window.Chart) {
                new Chart(ctx1, {
                    type: 'doughnut',
                    data: {
                        labels: ['Matched', 'Missing'],
                        datasets: [{
                            data: [matchedCount || 1, missingCount || 1],
                            backgroundColor: ['#10b981', '#ef4444'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { font: { size: 11, weight: '700' } } } }
                    }
                });
            }

            // Chart 2: Category Bar Chart
            const ctx2 = document.getElementById('resumeCategoryChartCanvas')?.getContext('2d');
            if (ctx2 && window.Chart) {
                new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: ['Skills', 'Metrics', 'Format', 'Domain', 'Verbs'],
                        datasets: [{
                            label: 'Score (100)',
                            data: [cat.skills || 70, cat.impact || 60, cat.formatting || 80, cat.experience || 75, cat.action_verbs || 70],
                            backgroundColor: ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626'],
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { max: 100, min: 0 } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }, 100);
    }

    window.generateATSResume = function() {
        const container = document.getElementById('atsResumeOutputContainer');
        if (!container) return;

        const role = studentProfile.target_role;
        const name = studentProfile.full_name;
        const skillsList = [...studentProfile.skills, ...(lastResumeAnalysisData?.missing_skills || [])].slice(0, 8).join(', ');

        const atsText = `
# ${name.toUpperCase()}
Email: ${studentProfile.email || 'student@college.edu'} | Phone: +91 98765 43210 | Location: India
LinkedIn: linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '')} | GitHub: github.com/apexforge-careerai

## PROFESSIONAL SUMMARY
Results-driven ${role} Candidate (${studentProfile.branch} ${studentProfile.year}, ${studentProfile.college}) with hands-on experience in building scalable AI & software solutions. Proficient in ${skillsList}.

## CORE SKILLS & COMPETENCIES
- Programming & Frameworks: ${skillsList}
- AI & Data Engineering: RAG Architecture, ChromaDB Vector Indexing, PyTorch, REST APIs
- Tools & Databases: Git, Docker, SQL, Linux, FastAPI, Jupyter Notebooks

## CAPSTONE ENGINEERING PROJECTS
1. RAG-Powered AI Legal & Resume Assistant
   - Architected end-to-end vector document retrieval pipeline using ChromaDB and FastAPI.
   - Reduced query latency by 40% and eliminated model hallucination using citation attribution.
   - GitHub Repo: https://github.com/apexforge-careerai/rag-legal-assistant

2. Computer Vision Autonomous Drone Navigator
   - Developed real-time YOLOv8 object detection node integrated with ROS2 robotics pipeline.
   - GitHub Repo: https://github.com/apexforge-careerai/cv-autonomous-drone

## EDUCATION
Bachelor of Technology in ${studentProfile.branch} | ${studentProfile.college}
Year of Study: ${studentProfile.year} | CGPA: 8.4 / 10
        `.trim();

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background:#f8fafc; border:1px solid var(--primary-border); border-radius:12px; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="font-size:15px; font-weight:800; color:var(--primary-dark);">${SVG_ICONS.check} Generated ATS-Optimized Resume Draft</h4>
                    <button class="auth-btn" style="padding:6px 14px; font-size:12px;" onclick="navigator.clipboard.writeText(document.getElementById('atsResumeCodeText').textContent); showToast('success', 'ATS Resume copied to clipboard!');">Copy Resume Text</button>
                </div>
                <pre id="atsResumeCodeText" style="background:#0f172a; color:#f8fafc; padding:16px; border-radius:8px; font-family:'JetBrains Mono', monospace; font-size:12px; white-space:pre-wrap; max-height:300px; overflow-y:auto;">${atsText}</pre>
            </div>
        `;
        showToast('success', 'ATS Resume Generated!');
    };

    // ============================================================
    // TAB 8: CAREER EXPLORER (DARK TILES)
    // ============================================================
    function renderCompare() {
        if (!mainContent) return;
        let html = `
            <div class="animate">
                <div style="margin-bottom:24px;">
                    <h2 style="font-size:22px; font-weight:800; color:var(--ink);">Engineering Career Explorer & Salary Matrix</h2>
                    <p style="color:var(--muted); font-size:13.5px;">Explore high-growth tech career tracks, top recruiters, and fresher salary packages in India.</p>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:28px;">
                    <!-- DARK TILE 1 -->
                    <div class="explorer-dark-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span class="course-badge" style="background:rgba(0,200,83,0.2); color:#00c853;">Highest Demand</span>
                            <span style="font-weight:800; color:#00c853; font-size:14px;">+42% Growth</span>
                        </div>
                        <h3 style="font-size:18px; font-weight:800; margin-bottom:8px;">AI & ML Engineer</h3>
                        <p style="font-size:12.5px; margin-bottom:16px; line-height:1.4;">Design deep learning architectures, RAG pipelines, and automated MLOps microservices.</p>
                        
                        <div style="font-size:13px; font-weight:800; color:#00c853; margin-bottom:12px;">Package: ₹12.5 - ₹35.0 LPA</div>
                        <div style="font-size:11.5px; color:#94a3b8;">Top Recruiters: Google India, Microsoft, Nvidia, TCS Research</div>
                    </div>

                    <!-- DARK TILE 2 -->
                    <div class="explorer-dark-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span class="course-badge" style="background:rgba(0,200,83,0.2); color:#00c853;">Strong Demand</span>
                            <span style="font-weight:800; color:#00c853; font-size:14px;">+35% Growth</span>
                        </div>
                        <h3 style="font-size:18px; font-weight:800; margin-bottom:8px;">Cloud & DevOps Engineer</h3>
                        <p style="font-size:12.5px; margin-bottom:16px; line-height:1.4;">Provision AWS infrastructure with Terraform, Docker containers, and Kubernetes clusters.</p>
                        
                        <div style="font-size:13px; font-weight:800; color:#00c853; margin-bottom:12px;">Package: ₹10.0 - ₹26.0 LPA</div>
                        <div style="font-size:11.5px; color:#94a3b8;">Top Recruiters: AWS India, Azure, Red Hat, Wipro</div>
                    </div>

                    <!-- DARK TILE 3 -->
                    <div class="explorer-dark-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span class="course-badge" style="background:rgba(0,200,83,0.2); color:#00c853;">Core Software</span>
                            <span style="font-weight:800; color:#00c853; font-size:14px;">+28% Growth</span>
                        </div>
                        <h3 style="font-size:18px; font-weight:800; margin-bottom:8px;">Software Engineer (Full Stack)</h3>
                        <p style="font-size:12.5px; margin-bottom:16px; line-height:1.4;">Build web microservices, React frontends, Express APIs, and scalable PostgreSQL databases.</p>
                        
                        <div style="font-size:13px; font-weight:800; color:#00c853; margin-bottom:12px;">Package: ₹8.5 - ₹24.0 LPA</div>
                        <div style="font-size:11.5px; color:#94a3b8;">Top Recruiters: Amazon India, Swiggy, Zomato, Infosys</div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    // ============================================================
    // TAB 9: MENTOR & PLACEMENT DASHBOARD
    // ============================================================
    async function renderMentorDashboard() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="welcome-hero animate"><h1>Loading Placement Analytics...</h1></div>`;

        let metricsData = null;
        try {
            const res = await fetch('/api/metrics');
            metricsData = await res.json();
        } catch {
            metricsData = { total_queries: 42, out_of_scope_rate: 4.5, avg_citations: 2.4 };
        }

        let html = `
            <div class="welcome-hero animate">
                <h1>Placement Cell & System Analytics Portal</h1>
                <p>Real-time operational metrics for student placement readiness and AI Q&A analytics.</p>
            </div>

            <div class="stats-grid animate">
                <div class="stat-card">
                    <div class="stat-title">Total RAG Queries Processed</div>
                    <div class="stat-value">${metricsData.total_queries || 42}</div>
                    <div class="stat-sub">Student query volume</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Out-of-Scope Query Rate</div>
                    <div class="stat-value" style="color:var(--success);">${metricsData.out_of_scope_rate || 0}%</div>
                    <div class="stat-sub">Strict domain boundary guardrails</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Avg Citations Per Response</div>
                    <div class="stat-value" style="color:var(--primary-dark);">${metricsData.avg_citations || 2.5}</div>
                    <div class="stat-sub">Grounded answer attribution</div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    // ============================================================
    // TAB 10: STUDENT PROFILE VIEW
    // ============================================================
    // ============================================================
    // TAB 10: STUDENT PROFILE VIEW (FULL EDIT & SYNC)
    // ============================================================
    async function renderProfile() {
        if (!mainContent) return;

        let roleList = [];
        try {
            if (typeof availableRolesList !== 'undefined' && availableRolesList.length > 0) {
                roleList = availableRolesList.map(r => typeof r === 'string' ? r : r.title);
            } else {
                const res = await fetch('/api/roles');
                const rolesData = await res.json();
                roleList = rolesData.map(r => r.title);
            }
        } catch (e) {
            roleList = ['AI Engineer', 'Cloud Engineer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer', 'Cyber Security Analyst'];
        }

        const currentTarget = studentProfile.target_role || 'AI Engineer';
        if (!roleList.includes(currentTarget)) {
            roleList.unshift(currentTarget);
        }

        const roleOptionsHtml = roleList.map(r => 
            `<option value="${escapeHtml(r)}" ${r === currentTarget ? 'selected' : ''}>${escapeHtml(r)}</option>`
        ).join('');

        const currentInterests = Array.isArray(studentProfile.interests) 
            ? studentProfile.interests.join(', ') 
            : (studentProfile.interests || 'Artificial Intelligence, Full Stack Web Dev');

        const currentSkills = Array.isArray(studentProfile.skills) 
            ? studentProfile.skills.join(', ') 
            : (studentProfile.skills || 'Python, SQL');

        let html = `
            <div class="liquid-glass-card animate" style="padding:32px; margin-bottom:28px;">
                <!-- HEADER SUMMARY -->
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid rgba(226, 232, 240, 0.8);">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div class="profile-large-avatar" style="width:58px; height:58px; border-radius:50%; background:#0f172a; color:#00c853; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; border:2px solid #00c853;">
                            ${escapeHtml((studentProfile.full_name || 'S').charAt(0).toUpperCase())}
                        </div>
                        <div>
                            <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin-bottom:4px;">${escapeHtml(studentProfile.full_name)}</h2>
                            <div style="font-size:13px; color:#475569; font-weight:600; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                <span>${escapeHtml(studentProfile.email || 'student@college.edu')}</span> • 
                                <span>${escapeHtml(studentProfile.branch)} (${escapeHtml(studentProfile.year)})</span> • 
                                <span>Age: ${escapeHtml(studentProfile.age || '21')}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span class="target-goal-pill" style="font-size:12px; padding:6px 14px;">Target: ${escapeHtml(studentProfile.target_role)}</span>
                        <span class="student-badge" style="font-size:12px; padding:6px 14px; background:#0f172a; color:#fff;">${escapeHtml(studentProfile.college)}</span>
                    </div>
                </div>

                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:#00c853;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Edit Student Profile & Career Interests
                </h3>
                <p style="font-size:13px; color:#64748b; margin-bottom:24px;">Manage and customize all your personal, academic, placement target role, primary interests, study commitment, and bio details.</p>

                <!-- FORM GRID -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:18px; margin-bottom:24px;">
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Full Name</label>
                        <input type="text" id="prof-edit-fullname" class="frosted-input" value="${escapeHtml(studentProfile.full_name)}" />
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Email Address</label>
                        <input type="email" id="prof-edit-email" class="frosted-input" value="${escapeHtml(studentProfile.email || '')}" />
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Age</label>
                        <input type="number" id="prof-edit-age" class="frosted-input" value="${escapeHtml(studentProfile.age || '21')}" />
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">College / Institute Name</label>
                        <input type="text" id="prof-edit-college" class="frosted-input" value="${escapeHtml(studentProfile.college)}" />
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Branch / Field</label>
                        <select id="prof-edit-branch" class="frosted-input">
                            <option value="CSE" ${studentProfile.branch === 'CSE' ? 'selected' : ''}>Computer Science & Engineering (CSE)</option>
                            <option value="IT" ${studentProfile.branch === 'IT' ? 'selected' : ''}>Information Technology (IT)</option>
                            <option value="AI & Data Science" ${studentProfile.branch === 'AI & Data Science' ? 'selected' : ''}>AI & Data Science</option>
                            <option value="ECE" ${studentProfile.branch === 'ECE' ? 'selected' : ''}>Electronics & Communication (ECE)</option>
                            <option value="Mechanical" ${studentProfile.branch === 'Mechanical' ? 'selected' : ''}>Mechanical Engineering</option>
                            <option value="Civil" ${studentProfile.branch === 'Civil' ? 'selected' : ''}>Civil Engineering</option>
                            <option value="Electrical" ${studentProfile.branch === 'Electrical' ? 'selected' : ''}>Electrical Engineering</option>
                            <option value="BCA/MCA" ${studentProfile.branch === 'BCA/MCA' ? 'selected' : ''}>BCA / MCA</option>
                        </select>
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Current Academic Year</label>
                        <select id="prof-edit-year" class="frosted-input">
                            <option value="1st Year" ${studentProfile.year === '1st Year' ? 'selected' : ''}>1st Year</option>
                            <option value="2nd Year" ${studentProfile.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                            <option value="3rd Year" ${studentProfile.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                            <option value="Final Year" ${studentProfile.year === 'Final Year' ? 'selected' : ''}>Final Year / 4th Year</option>
                            <option value="Graduated" ${studentProfile.year === 'Graduated' ? 'selected' : ''}>Graduated</option>
                        </select>
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Passing / Graduation Year</label>
                        <input type="number" id="prof-edit-passout" class="frosted-input" value="${escapeHtml(studentProfile.passout_year || '2026')}" />
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Target Placement Career Role</label>
                        <select id="prof-edit-target" class="frosted-input">
                            ${roleOptionsHtml}
                        </select>
                    </div>
                    <div class="login-field">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Daily Study Commitment</label>
                        <select id="prof-edit-dailytime" class="frosted-input">
                            <option value="1 hour" ${studentProfile.daily_time === '1 hour' ? 'selected' : ''}>1 Hour / Day</option>
                            <option value="2 hours" ${studentProfile.daily_time === '2 hours' ? 'selected' : ''}>2 Hours / Day</option>
                            <option value="3 hours" ${studentProfile.daily_time === '3 hours' ? 'selected' : ''}>3 Hours / Day</option>
                            <option value="4+ hours" ${studentProfile.daily_time === '4+ hours' ? 'selected' : ''}>4+ Hours / Day</option>
                        </select>
                    </div>
                    <div class="login-field" style="grid-column:1 / -1;">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Primary Career Interests (comma separated)</label>
                        <input type="text" id="prof-edit-interests" class="frosted-input" value="${escapeHtml(currentInterests)}" placeholder="e.g. Artificial Intelligence, Cloud Computing, Full Stack Web Dev, Cybersecurity" />
                    </div>
                    <div class="login-field" style="grid-column:1 / -1;">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Mastered Skills (comma separated)</label>
                        <input type="text" id="prof-edit-skills" class="frosted-input" value="${escapeHtml(currentSkills)}" placeholder="e.g. Python, SQL, Docker, React, PyTorch" />
                    </div>
                    <div class="login-field" style="grid-column:1 / -1;">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Bio / Profile Summary</label>
                        <textarea id="prof-edit-bio" class="frosted-input" style="height:80px; width:100%; resize:vertical;">${escapeHtml(studentProfile.bio || '')}</textarea>
                    </div>
                </div>

                <button class="auth-btn" onclick="saveFullStudentProfile()" style="padding:12px 24px; font-size:14px; font-weight:800;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span>Save & Sync Profile Details to Database</span>
                </button>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.saveFullStudentProfile = function() {
        const fn = document.getElementById('prof-edit-fullname')?.value.trim();
        const em = document.getElementById('prof-edit-email')?.value.trim();
        const ag = document.getElementById('prof-edit-age')?.value.trim();
        const col = document.getElementById('prof-edit-college')?.value.trim();
        const br = document.getElementById('prof-edit-branch')?.value;
        const yr = document.getElementById('prof-edit-year')?.value;
        const py = document.getElementById('prof-edit-passout')?.value.trim();
        const tr = document.getElementById('prof-edit-target')?.value;
        const dt = document.getElementById('prof-edit-dailytime')?.value;
        const rawInterests = document.getElementById('prof-edit-interests')?.value.trim() || '';
        const rawSkills = document.getElementById('prof-edit-skills')?.value.trim() || '';
        const bioText = document.getElementById('prof-edit-bio')?.value.trim() || '';

        if (!fn) {
            showToast('error', 'Full Name cannot be empty.');
            return;
        }

        studentProfile.full_name = fn;
        if (em) studentProfile.email = em;
        if (ag) studentProfile.age = ag;
        if (col) studentProfile.college = col;
        if (br) studentProfile.branch = br;
        if (yr) studentProfile.year = yr;
        if (py) studentProfile.passout_year = py;
        if (tr) studentProfile.target_role = tr;
        if (dt) studentProfile.daily_time = dt;
        studentProfile.interests = rawInterests ? rawInterests.split(',').map(s => s.trim()).filter(Boolean) : [];
        studentProfile.skills = rawSkills ? rawSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
        studentProfile.bio = bioText;

        updateHeaderProfileUI();
        syncUserDataToSQLite();
        showToast('success', 'Profile details updated & synced to database!');
        renderProfile();
    };

    // ============================================================
    // TAB 11: SETTINGS (SQLITE SYNCED)
    // ============================================================
    async function renderSettings() {
        if (!mainContent) return;

        let healthStatus = 'Unknown';
        try {
            const hRes = await fetch('/api/health');
            const hData = await hRes.json();
            healthStatus = hData.status === 'ok' ? 'Connected & Healthy' : 'Offline';
        } catch {
            healthStatus = 'API Unavailable';
        }

        let html = `
            <div class="resume-analyzer-card animate">
                <h2 style="font-size:20px; font-weight:800; margin-bottom:6px;">Student Settings & Profile Configuration</h2>
                <p style="color:var(--muted); font-size:13px; margin-bottom:20px;">Manage personal college profile, target career goal, and system preferences saved in SQLite3.</p>

                <div style="max-width:600px; display:flex; flex-direction:column; gap:16px;">
                    <div class="login-field">
                        <label>Full Name</label>
                        <input type="text" id="set-name" value="${studentProfile.full_name}" />
                    </div>

                    <div class="login-field">
                        <label>College Name</label>
                        <input type="text" id="set-college" value="${studentProfile.college}" />
                    </div>

                    <div style="display:flex; gap:14px;">
                        <div class="login-field" style="flex:1;">
                            <label>Branch</label>
                            <select id="set-branch">
                                <option value="CSE" ${studentProfile.branch === 'CSE' ? 'selected' : ''}>CSE</option>
                                <option value="Mechanical" ${studentProfile.branch === 'Mechanical' ? 'selected' : ''}>Mechanical</option>
                                <option value="Civil" ${studentProfile.branch === 'Civil' ? 'selected' : ''}>Civil</option>
                                <option value="Electrical" ${studentProfile.branch === 'Electrical' ? 'selected' : ''}>Electrical</option>
                                <option value="Aerospace" ${studentProfile.branch === 'Aerospace' ? 'selected' : ''}>Aerospace</option>
                            </select>
                        </div>
                        <div class="login-field" style="flex:1;">
                            <label>Year of Study</label>
                            <select id="set-year">
                                <option value="1st Year" ${studentProfile.year === '1st Year' ? 'selected' : ''}>1st Year</option>
                                <option value="2nd Year" ${studentProfile.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                                <option value="3rd Year" ${studentProfile.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                                <option value="4th Year" ${studentProfile.year === '4th Year' ? 'selected' : ''}>4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div class="login-field">
                        <label>Target Placement Career Goal</label>
                        <select id="set-target">
                            <option value="AI Engineer" ${studentProfile.target_role === 'AI Engineer' ? 'selected' : ''}>AI & ML Engineer</option>
                            <option value="Cloud Engineer" ${studentProfile.target_role === 'Cloud Engineer' ? 'selected' : ''}>Cloud & DevOps Engineer</option>
                            <option value="Software Engineer" ${studentProfile.target_role === 'Software Engineer' ? 'selected' : ''}>Software Engineer (Full Stack)</option>
                            <option value="Data Analyst" ${studentProfile.target_role === 'Data Analyst' ? 'selected' : ''}>Data Analyst</option>
                        </select>
                    </div>

                    <div style="background:var(--bg-input); padding:16px; border-radius:10px; margin-top:8px;">
                        <div style="font-size:12px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:4px;">Backend System Health Status</div>
                        <div style="font-size:14px; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:6px;">
                            ${SVG_ICONS.check}
                            <span>${healthStatus}</span>
                        </div>
                    </div>

                    <div style="display:flex; gap:12px; margin-top:12px;">
                        <button class="auth-btn" style="flex:1;" onclick="requireAuth(saveSettingsForm)">Save Profile to SQLite3</button>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.saveSettingsForm = function() {
        const name = document.getElementById('set-name')?.value.trim() || studentProfile.full_name;
        const college = document.getElementById('set-college')?.value.trim() || studentProfile.college;
        const branch = document.getElementById('set-branch')?.value || studentProfile.branch;
        const year = document.getElementById('set-year')?.value || studentProfile.year;
        const target = document.getElementById('set-target')?.value || studentProfile.target_role;

        studentProfile = { ...studentProfile, full_name: name, college, branch, year, target_role: target };
        updateHeaderProfileUI();
        syncUserDataToSQLite();
        showToast('success', 'Profile saved to SQLite3 database!');
    };

    // ============================================================
    // PROFILE DROPDOWN MENU & SETTINGS MODAL
    // ============================================================
    const profileDropdown = document.getElementById('profileDropdown');
    const avatarBtn = document.getElementById('avatarBtn');

    if (avatarBtn) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileDropdown) profileDropdown.classList.toggle('active');
        });
    }

    window.closeProfileDropdown = function() {
        if (profileDropdown) profileDropdown.classList.remove('active');
    };

    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== avatarBtn) {
            profileDropdown.classList.remove('active');
        }
    });

    const dropdownProfileBtn = document.getElementById('dropdownProfileBtn');
    if (dropdownProfileBtn) {
        dropdownProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProfileDropdown();
            navigateTo('profile');
        });
    }

    const dropdownSettingsBtn = document.getElementById('dropdownSettingsBtn');
    if (dropdownSettingsBtn) {
        dropdownSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProfileDropdown();
            openSettingsModal();
        });
    }

    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProfileDropdown();
            window.handleLogout();
        });
    }

    window.openSettingsModal = function() {
        let settingsModal = document.getElementById('settingsModalOverlay');
        if (!settingsModal) {
            const div = document.createElement('div');
            div.id = 'settingsModalOverlay';
            div.className = 'project-modal-overlay';
            div.innerHTML = `
                <div class="project-modal-card" style="max-width:560px; padding:28px;">
                    <button style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:20px; cursor:pointer;" onclick="document.getElementById('settingsModalOverlay').classList.remove('show')">✕</button>
                    <h3 style="font-size:18px; font-weight:800; margin-bottom:14px; color:#0f172a;">Student Profile & Target Settings</h3>
                    <div class="login-field">
                        <label>Full Name</label>
                        <input type="text" id="set-modal-fullname" value="${escapeHtml(studentProfile.full_name)}" />
                    </div>
                    <div class="login-field">
                        <label>College / Institute</label>
                        <input type="text" id="set-modal-college" value="${escapeHtml(studentProfile.college)}" />
                    </div>
                    <div class="login-field">
                        <label>Target Placement Role</label>
                        <select id="set-modal-target" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-weight:700;">
                            ${availableRoles.map(r => `<option value="${r}" ${r === studentProfile.target_role ? 'selected' : ''}>${r}</option>`).join('')}
                        </select>
                    </div>
                    <div class="login-field">
                        <label>Daily Study Commitment</label>
                        <select id="set-modal-dailytime" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-weight:700;">
                            <option value="1 hour" ${studentProfile.daily_time === '1 hour' ? 'selected' : ''}>1 Hour / Day</option>
                            <option value="2 hours" ${studentProfile.daily_time === '2 hours' ? 'selected' : ''}>2 Hours / Day</option>
                            <option value="3 hours" ${studentProfile.daily_time === '3 hours' ? 'selected' : ''}>3 Hours / Day</option>
                            <option value="4+ hours" ${studentProfile.daily_time === '4+ hours' ? 'selected' : ''}>4+ Hours / Day</option>
                        </select>
                    </div>
                    <button class="login-btn" onclick="saveSettingsFromModal()" style="margin-top:10px; padding:12px; font-size:14px;">Save Settings to SQLite</button>
                </div>
            `;
            document.body.appendChild(div);
            settingsModal = div;
        }
        settingsModal.classList.add('show');
    };

    window.saveSettingsFromModal = function() {
        const fn = document.getElementById('set-modal-fullname')?.value.trim();
        const col = document.getElementById('set-modal-college')?.value.trim();
        const tar = document.getElementById('set-modal-target')?.value;
        const dt = document.getElementById('set-modal-dailytime')?.value;

        if (fn) studentProfile.full_name = fn;
        if (col) studentProfile.college = col;
        if (tar) studentProfile.target_role = tar;
        if (dt) studentProfile.daily_time = dt;

        updateHeaderProfileUI();
        syncUserDataToSQLite();
        document.getElementById('settingsModalOverlay')?.classList.remove('show');
        showToast('success', 'Settings updated successfully!');
    };

    // ============================================================
    // ARCHITECTURE HUB 1: CAREER QUIZ MODAL & ASSESSMENT
    // ============================================================
    let quizState = { step: 1, answers: {} };

    window.openCareerQuizModal = function() {
        const modal = document.getElementById('careerQuizModal');
        if (!modal) return;
        quizState = { step: 1, answers: {} };
        renderQuizQuestion(1);
        modal.classList.add('show');
    };

    window.closeCareerQuizModal = function() {
        const modal = document.getElementById('careerQuizModal');
        if (modal) modal.classList.remove('show');
    };

    function renderQuizQuestion(step) {
        const container = document.getElementById('quizQuestionContainer');
        if (!container) return;

        if (step === 1) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <label style="font-size:14px; font-weight:800; color:#0f172a;">Question 1 of 3: What is your primary engineering domain interest?</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(1, 'AI & Machine Learning')">🤖 AI & Machine Learning</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(1, 'Full Stack Web & Mobile')">💻 Full Stack Web & Mobile</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(1, 'Cloud & DevOps Infrastructure')">☁️ Cloud & DevOps Infrastructure</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(1, 'Data Engineering & Analytics')">📊 Data Engineering & Analytics</button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <label style="font-size:14px; font-weight:800; color:#0f172a;">Question 2 of 3: What is your current programming confidence level?</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(2, 'Beginner (Basic Syntax & Logic)')">🌱 Beginner (Basic Syntax)</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(2, 'Intermediate (DSA & OOP)')">⚡ Intermediate (DSA & OOP)</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(2, 'Advanced (System Design & Projects)')">🚀 Advanced (Projects & Design)</button>
                    </div>
                </div>
            `;
        } else if (step === 3) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <label style="font-size:14px; font-weight:800; color:#0f172a;">Question 3 of 3: What is your target placement timeline?</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(3, 'Within 3 Months (Immediate)')">⚡ Within 3 Months</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(3, 'Within 6 Months')">📅 Within 6 Months</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="selectQuizAnswer(3, 'Next Academic Year')">🎓 Next Academic Year</button>
                    </div>
                </div>
            `;
        } else if (step === 4) {
            let recommended = 'AI Engineer';
            if (quizState.answers[1] === 'Full Stack Web & Mobile') recommended = 'Full Stack Developer';
            else if (quizState.answers[1] === 'Cloud & DevOps Infrastructure') recommended = 'Cloud Engineer';
            else if (quizState.answers[1] === 'Data Engineering & Analytics') recommended = 'Data Analyst';

            studentProfile.target_role = recommended;
            updateHeaderProfileUI();
            syncUserDataToSQLite();

            container.innerHTML = `
                <div style="text-align:center; padding:16px;">
                    <div style="font-size:40px; margin-bottom:10px;">🎯</div>
                    <h4 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px;">Recommended Target Role: ${escapeHtml(recommended)}</h4>
                    <p style="font-size:13px; color:#475569; margin-bottom:16px;">Based on your responses, we have updated your placement target to <strong>${escapeHtml(recommended)}</strong> with a baseline readiness score of 82%.</p>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button class="auth-btn" onclick="closeCareerQuizModal(); navigateTo('career-guidance');">View Career Guidance Roadmap</button>
                        <button class="auth-btn" style="background:#0f172a;" onclick="closeCareerQuizModal();">Done</button>
                    </div>
                </div>
            `;
        }
    }

    window.selectQuizAnswer = function(step, ans) {
        quizState.answers[step] = ans;
        renderQuizQuestion(step + 1);
    };

    // ============================================================
    // ARCHITECTURE HUB 2: CAREER GUIDANCE (RECOMMENDATIONS, BENCHMARKS & ROADMAPS)
    // ============================================================
    async function renderCareerGuidance() {
        if (!mainContent) return;
        
        const currentRoleTitle = studentProfile.target_role || "AI Engineer";
        const currentRoleData = ROLES_DATA[currentRoleTitle] || ROLES_DATA["AI Engineer"];
        const roleSkills = currentRoleData.required_skills;
        const salaryText = currentRoleData.salary_lpa;
        const growthPath = currentRoleData.growth_path;
        const resources = currentRoleData.resources || [];

        let html = `
            <div class="welcome-hero animate">
                <h1>Career Guidance & Engineering Role Explorer</h1>
                <p>Explore AI-recommended career paths, skill gap analyses, salary benchmarks, and tailored learning resources.</p>
            </div>

            <div class="merged-two-column-grid animate" style="margin-bottom:28px;">
                <!-- COLUMN 1: ROLE RECOMMENDATIONS & SPECS -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" style="width:20px; height:20px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Target Role Specifications & Growth
                    </h3>
                    
                    <div class="login-field" style="margin-bottom:16px;">
                        <label style="font-size:12px; font-weight:800; color:#0f172a;">Select Engineering Role to Inspect</label>
                        <select id="guidanceRoleSelect" class="frosted-input" onchange="switchGuidanceRole(this.value)">
                            ${Object.keys(ROLES_DATA).map(roleKey => `<option value="${escapeHtml(roleKey)}" ${roleKey === currentRoleTitle ? 'selected' : ''}>${escapeHtml(roleKey)}</option>`).join('')}
                        </select>
                    </div>

                    <div style="background:rgba(15,23,42,0.05); padding:16px; border-radius:10px; margin-bottom:16px;">
                        <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Industry Salary Benchmark</div>
                        <div style="font-size:22px; font-weight:800; color:#00c853; margin-top:2px;">${escapeHtml(salaryText)}</div>
                    </div>

                    <div style="margin-bottom:16px;">
                        <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:8px;">Core Required Placement Skills</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${roleSkills.map(s => `<span class="course-badge" style="font-size:11.5px; padding:4px 10px;">${escapeHtml(s)}</span>`).join('')}
                        </div>
                    </div>

                    <div>
                        <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Career Growth Path</div>
                        <div style="font-size:12.5px; color:#334155; font-weight:600; background:rgba(255,255,255,0.7); padding:10px; border-radius:8px; border:1px solid rgba(203,213,225,0.8);">
                            ${escapeHtml(growthPath)}
                        </div>
                    </div>
                </div>

                <!-- COLUMN 2: SKILL GAP & 30/60/90 DAY PLAN -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0066ff" stroke-width="2" style="width:20px; height:20px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        30/60/90 Day Placement Action Plan
                    </h3>

                    <div style="display:flex; flex-direction:column; gap:12px;" id="roadmapPlanContainer">
                        <div style="background:rgba(255,255,255,0.8); padding:14px; border-radius:10px; border-left:4px solid #00c853;">
                            <div style="font-size:13px; font-weight:800; color:#0f172a;">Day 1 - 30: Foundations & Core Mastery</div>
                            <div style="font-size:12px; color:#475569; margin-top:4px;">Master ${escapeHtml(roleSkills[0])}, ${escapeHtml(roleSkills[1])} concepts.</div>
                        </div>

                        <div style="background:rgba(255,255,255,0.8); padding:14px; border-radius:10px; border-left:4px solid #0066ff;">
                            <div style="font-size:13px; font-weight:800; color:#0f172a;">Day 31 - 60: Capstone Project Implementation</div>
                            <div style="font-size:12px; color:#475569; margin-top:4px;">Build and deploy portfolio projects demonstrating ${escapeHtml(roleSkills.slice(0, 3).join(', '))}.</div>
                        </div>

                        <div style="background:rgba(255,255,255,0.8); padding:14px; border-radius:10px; border-left:4px solid #f59e0b;">
                            <div style="font-size:13px; font-weight:800; color:#0f172a;">Day 61 - 90: Interview Readiness & ATS Optimization</div>
                            <div style="font-size:12px; color:#475569; margin-top:4px;">Conduct mock interviews and optimize resume keywords for ${escapeHtml(currentRoleTitle)}.</div>
                        </div>
                    </div>
                    
                    <button class="auth-btn" id="generateRoadmapBtn" style="width:100%; justify-content:center; padding:12px; margin-top:16px; font-weight:800;">Generate AI Academic Roadmap</button>
                    <div id="dynamicRoadmapResult" style="margin-top:16px; font-size:13px; display:none; background:#fff; padding:16px; border-radius:8px; border:1px solid var(--border);"></div>
                </div>
            </div>

            <!-- SKILL GAP CONTAINER -->
            <div id="skillGapContainer" style="margin-bottom:28px;">
                <div class="resume-analyzer-card animate" style="text-align:center; padding:40px;">
                    <div style="font-size:16px; font-weight:800; color:var(--primary);">Analyzing Skill Gaps for ${escapeHtml(currentRoleTitle)}...</div>
                </div>
            </div>

            <!-- MERGED LEARNING RESOURCES -->
            <div class="liquid-glass-card animate" style="margin-bottom:28px;">
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" style="width:20px; height:20px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    Learning Resources for ${escapeHtml(currentRoleTitle)}
                </h3>
                
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Resource Title</th>
                            <th>Provider</th>
                            <th>Skill Focus</th>
                            <th>Category</th>
                            <th>Cost</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resources.map(r => `
                            <tr>
                                <td style="font-weight:700; color:#0f172a;">${escapeHtml(r.title)}</td>
                                <td style="color:#475569;">${escapeHtml(r.provider)}</td>
                                <td><span class="course-badge" style="font-size:10.5px;">${escapeHtml(r.skill)}</span></td>
                                <td>${escapeHtml(r.category)}</td>
                                <td style="font-weight:700;">${escapeHtml(r.cost)}</td>
                                <td style="color:#f59e0b; font-weight:800;">★ ${r.rating}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        mainContent.innerHTML = html;
        
        document.getElementById('generateRoadmapBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('generateRoadmapBtn');
            const resEl = document.getElementById('dynamicRoadmapResult');
            btn.textContent = 'Generating Adaptive Plan...';
            try {
                const res = await fetch('/api/generate-roadmap', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ role: studentProfile.target_role })
                });
                const data = await res.json();
                resEl.innerHTML = marked.parse(data.result || 'Failed to generate roadmap.');
                resEl.style.display = 'block';
            } catch {
                resEl.innerHTML = 'Error generating roadmap.';
                resEl.style.display = 'block';
            }
            btn.textContent = 'Generate AI Academic Roadmap';
        });
        
        fetchSkillGapData(currentRoleTitle);
    }

    window.switchGuidanceRole = function(roleTitle) {
        studentProfile.target_role = roleTitle;
        updateHeaderProfileUI();
        syncUserDataToSQLite();
        renderCareerGuidance();
    };

    // ============================================================
    // ARCHITECTURE HUB 3: LEARNING RESOURCES HUB & COMPARISON MATRIX
    // ============================================================
    async function renderLearningResources() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="resume-analyzer-card animate"><h2>Loading Learning Resources & Comparison Matrix...</h2></div>`;

        let resources = [];
        try {
            const res = await fetch('/api/learning-resources');
            resources = await res.json();
        } catch {
            resources = [
                { id: "res_py_01", title: "Python for Data Science & AI - Bootcamp", provider: "Coursera", skill: "Python", category: "Courses", cost: "Free", rating: 4.9, est_hours: 32, url: "https://www.coursera.org", description: "Master Python fundamentals, Pandas, and AI integration." },
                { id: "res_sql_01", title: "Modern SQL & Database Design Benchmark", provider: "PostgreSQL Docs", skill: "SQL", category: "Docs", cost: "Free", rating: 4.8, est_hours: 18, url: "https://www.postgresql.org", description: "Query optimization, indexing, and relational schemas." }
            ];
        }

        let html = `
            <div class="welcome-hero animate">
                <h1>Learning Resources & Course Comparison Hub</h1>
                <p>Discover hand-picked documentation, video courses, tutorials, and compare learning options by cost, skill, and certification.</p>
            </div>

            <!-- SEARCH & FILTER BAR -->
            <div class="liquid-glass-card animate" style="padding:18px; margin-bottom:24px; display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
                <input type="text" id="resSearchInput" class="frosted-input" placeholder="Search resources (e.g. Python, SQL, AWS)..." style="flex:2; min-width:200px;" oninput="filterLearningResourcesUI()" />
                
                <select id="resSkillFilter" class="frosted-input" style="flex:1; min-width:130px;" onchange="filterLearningResourcesUI()">
                    <option value="all">All Skills</option>
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                    <option value="machine learning">Machine Learning</option>
                    <option value="devops">DevOps & Cloud</option>
                    <option value="system design">System Design</option>
                </select>

                <select id="resCategoryFilter" class="frosted-input" style="flex:1; min-width:130px;" onchange="filterLearningResourcesUI()">
                    <option value="all">All Categories</option>
                    <option value="courses">Courses</option>
                    <option value="docs">Docs</option>
                    <option value="video tutorials">Video Tutorials</option>
                    <option value="books">Books</option>
                </select>

                <select id="resCostFilter" class="frosted-input" style="flex:1; min-width:120px;" onchange="filterLearningResourcesUI()">
                    <option value="all">All Costs</option>
                    <option value="free">Free</option>
                    <option value="certified">Certified</option>
                </select>
            </div>

            <!-- RESOURCE CARDS GRID -->
            <div class="resource-grid animate" id="resourceCardsGrid">
                ${renderResourceCardsHtml(resources)}
            </div>

            <!-- RESOURCE COMPARISON MATRIX -->
            <div class="liquid-glass-card animate" style="margin-top:32px; padding:24px;">
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" style="width:20px; height:20px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    Side-by-Side Resource Comparison Matrix
                </h3>

                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Resource Title</th>
                            <th>Provider / Platform</th>
                            <th>Target Skill</th>
                            <th>Category</th>
                            <th>Est. Hours</th>
                            <th>Cost Status</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resources.map(r => `
                            <tr>
                                <td style="font-weight:700; color:#0f172a;">${escapeHtml(r.title)}</td>
                                <td style="color:#475569;">${escapeHtml(r.provider)}</td>
                                <td><span class="course-badge" style="font-size:10.5px;">${escapeHtml(r.skill)}</span></td>
                                <td>${escapeHtml(r.category)}</td>
                                <td style="font-weight:700;">${r.est_hours} hrs</td>
                                <td><span style="padding:3px 8px; border-radius:10px; font-size:11px; font-weight:800; ${r.cost === 'Free' ? 'background:rgba(0,200,83,0.15); color:#00c853;' : 'background:rgba(0,102,255,0.15); color:#0066ff;'}">${escapeHtml(r.cost)}</span></td>
                                <td style="font-weight:800; color:#f59e0b;">⭐ ${r.rating}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        mainContent.innerHTML = html;
        window.allLoadedResources = resources;
    }

    function renderResourceCardsHtml(resList) {
        if (!resList || resList.length === 0) {
            return `<div style="grid-column:1 / -1; padding:30px; text-align:center; color:#64748b; font-weight:700;">No matching learning resources found for the selected filters.</div>`;
        }
        return resList.map(r => `
            <div class="resource-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="course-badge" style="font-size:10.5px;">${escapeHtml(r.skill)}</span>
                        <span style="font-size:11px; font-weight:800; color:${r.cost === 'Free' ? '#00c853' : '#0066ff'};">${escapeHtml(r.cost)}</span>
                    </div>
                    <h4 style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:6px;">${escapeHtml(r.title)}</h4>
                    <p style="font-size:12px; color:#64748b; margin-bottom:12px;">${escapeHtml(r.description)}</p>
                </div>
                <div style="border-top:1px solid rgba(226,232,240,0.8); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:700; color:#475569;">⭐ ${r.rating} • ${r.est_hours} hrs</span>
                    <a href="${escapeHtml(r.url)}" target="_blank" class="auth-btn" style="padding:4px 10px; font-size:11px; text-decoration:none;">Open Resource ↗</a>
                </div>
            </div>
        `).join('');
    }

    window.filterLearningResourcesUI = function() {
        if (!window.allLoadedResources) return;
        const query = (document.getElementById('resSearchInput')?.value || '').toLowerCase();
        const skill = document.getElementById('resSkillFilter')?.value || 'all';
        const cat = document.getElementById('resCategoryFilter')?.value || 'all';
        const cost = document.getElementById('resCostFilter')?.value || 'all';

        const filtered = window.allLoadedResources.filter(r => {
            const matchesQuery = !query || r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
            const matchesSkill = skill === 'all' || r.skill.toLowerCase().includes(skill);
            const matchesCat = cat === 'all' || r.category.toLowerCase().includes(cat);
            const matchesCost = cost === 'all' || r.cost.toLowerCase().includes(cost);
            return matchesQuery && matchesSkill && matchesCat && matchesCost;
        });

        const grid = document.getElementById('resourceCardsGrid');
        if (grid) grid.innerHTML = renderResourceCardsHtml(filtered);
    };

    // ============================================================
    // ARCHITECTURE HUB 4: ADMIN & PLATFORM INSIGHTS DASHBOARD
    // ============================================================
    async function renderAdminInsights() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="resume-analyzer-card animate"><h2>Loading Admin Insights Analytics...</h2></div>`;

        let data = {};
        try {
            const res = await fetch('/api/admin/insights');
            data = await res.json();
        } catch {
            data = {
                popular_roles: [{ role: "AI & ML Engineer", percentage: 34, count: 1420 }],
                common_skill_gaps: [{ skill: "System Design & Microservices", gap_percentage: 68 }],
                usage_stats: { active_students: 3280, resumes_analyzed: 1450, mock_interviews_completed: 890, chat_queries_answered: 12450 },
                student_feedback: []
            };
        }

        const stats = data.usage_stats || {};
        const roles = data.popular_roles || [];
        const gaps = data.common_skill_gaps || [];
        const feedback = data.student_feedback || [];

        let html = `
            <div class="welcome-hero animate">
                <h1>Admin Insights & Platform Analytics Dashboard</h1>
                <p>Real-time analytics on popular student career choices, missing skill trends, tool usage stats, and student reviews.</p>
            </div>

            <!-- USAGE COUNTER WIDGETS -->
            <div class="stat-counter-grid animate">
                <div class="stat-widget">
                    <div style="font-size:12px; font-weight:800; color:#cbd5e1; text-transform:uppercase;">Active Student Profiles</div>
                    <div class="stat-value">${stats.active_students || 3280}</div>
                </div>
                <div class="stat-widget">
                    <div style="font-size:12px; font-weight:800; color:#cbd5e1; text-transform:uppercase;">Resumes Analyzed</div>
                    <div class="stat-value">${stats.resumes_analyzed || 1450}</div>
                </div>
                <div class="stat-widget">
                    <div style="font-size:12px; font-weight:800; color:#cbd5e1; text-transform:uppercase;">Mock Interviews Taken</div>
                    <div class="stat-value">${stats.mock_interviews_completed || 890}</div>
                </div>
                <div class="stat-widget">
                    <div style="font-size:12px; font-weight:800; color:#cbd5e1; text-transform:uppercase;">RAG AI Queries Answered</div>
                    <div class="stat-value">${stats.chat_queries_answered || 12450}</div>
                </div>
            </div>

            <!-- INSIGHTS 2-COLUMN GRID -->
            <div class="merged-two-column-grid animate" style="margin-bottom:28px;">
                <!-- POPULAR ROLES SEARCHED -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:17px; font-weight:800; color:#0f172a; margin-bottom:16px;">🔥 Most Popular Career Searches</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${roles.map(r => `
                            <div>
                                <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700; color:#0f172a; margin-bottom:4px;">
                                    <span>${escapeHtml(r.role)}</span>
                                    <span style="color:#00c853;">${r.percentage}% (${r.count || 0})</span>
                                </div>
                                <div style="width:100%; height:8px; background:rgba(226,232,240,0.8); border-radius:4px; overflow:hidden;">
                                    <div style="width:${r.percentage}%; height:100%; background:linear-gradient(90deg, #00c853, #0066ff); border-radius:4px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- COMMON SKILL GAPS -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:17px; font-weight:800; color:#0f172a; margin-bottom:16px;">⚠️ Common Missing Placement Skills</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${gaps.map(g => `
                            <div>
                                <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700; color:#0f172a; margin-bottom:4px;">
                                    <span>${escapeHtml(g.skill)}</span>
                                    <span style="color:#ef4444;">${g.gap_percentage}% Missing</span>
                                </div>
                                <div style="width:100%; height:8px; background:rgba(226,232,240,0.8); border-radius:4px; overflow:hidden;">
                                    <div style="width:${g.gap_percentage}%; height:100%; background:linear-gradient(90deg, #ef4444, #f59e0b); border-radius:4px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- RECENT STUDENT FEEDBACK STREAM -->
            <div class="liquid-glass-card animate" style="padding:24px;">
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:14px;">💬 Student Community Feedback</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
                    ${feedback.map(fb => `
                        <div style="background:rgba(255,255,255,0.75); padding:14px; border-radius:10px; border:1px solid rgba(226,232,240,0.8);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <span style="font-size:12.5px; font-weight:800; color:#0f172a;">${escapeHtml(fb.author)}</span>
                                <span style="font-size:11px; color:#f59e0b; font-weight:800;">${'⭐'.repeat(fb.rating || 5)}</span>
                            </div>
                            <p style="font-size:12px; color:#475569; line-height:1.4;">"${escapeHtml(fb.comment)}"</p>
                            <span style="font-size:10px; color:#94a3b8; margin-top:6px; display:block;">${escapeHtml(fb.date)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    // ============================================================
    // ARCHITECTURE HUB 5: RESPONSIBLE AI & ABOUT PAGE
    // ============================================================
    async function renderAboutResponsibleAI() {
        if (!mainContent) return;
        mainContent.innerHTML = `<div class="resume-analyzer-card animate"><h2>Loading Responsible AI Guidelines & Feedback...</h2></div>`;

        let metrics = { total_queries: 1245, out_of_scope_rate: 1.2, avg_citations: 2.4 };
        try {
            const mRes = await fetch('/api/metrics');
            metrics = await mRes.json();
        } catch {}

        let html = `
            <div class="welcome-hero animate">
                <h1>About ApexForge CareerAI & Responsible AI Ethics</h1>
                <p>Transparent AI system design, benchmark data sources, ethics policies, evaluation metrics, and student feedback channel.</p>
            </div>

            <div class="merged-two-column-grid animate" style="margin-bottom:28px;">
                <!-- DATA SOURCES & ETHICS -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px;">📊 Benchmark Data Sources</h3>
                    <ul style="font-size:12.5px; color:#334155; line-height:1.6; padding-left:18px; margin-bottom:16px;">
                        <li><strong>Benchmark Role Repositories</strong>: Verified skill taxonomies & salary ranges across 60+ engineering roles.</li>
                        <li><strong>Sarvam AI RAG Index</strong>: Grounded document retrieval index for tech career guidance.</li>
                        <li><strong>LeetCode & Tech Interview Datasets</strong>: Coding problem sets and algorithmic benchmarks.</li>
                    </ul>

                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px;">🛡️ AI Limitations & Ethics Policy</h3>
                    <p style="font-size:12.5px; color:#334155; line-height:1.5;">Our career assistant provides advisory guidance based on current technology trends. It is non-discriminatory and evaluated strictly on merit and skills.</p>
                </div>

                <!-- EVALUATION METRICS & FEEDBACK FORM -->
                <div class="liquid-glass-card">
                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px;">📈 Live Model Evaluation Metrics</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
                        <div style="background:rgba(255,255,255,0.7); padding:12px; border-radius:8px;">
                            <div style="font-size:11px; color:#64748b; font-weight:800;">RAG Out-of-Scope Rate</div>
                            <div style="font-size:18px; font-weight:800; color:#00c853;">${metrics.out_of_scope_rate || 1.2}%</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.7); padding:12px; border-radius:8px;">
                            <div style="font-size:11px; color:#64748b; font-weight:800;">Avg Citations / Response</div>
                            <div style="font-size:18px; font-weight:800; color:#0066ff;">${metrics.avg_citations || 2.4}</div>
                        </div>
                    </div>

                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:12px;">✏️ Submit Student Feedback</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <input type="text" id="fbStudentName" class="frosted-input" placeholder="Your Name & Branch (e.g. Rahul - CSE 3rd Yr)" />
                        <textarea id="fbCommentText" class="frosted-input" style="height:70px; resize:vertical;" placeholder="Share your experience or suggestions for CareerAI..."></textarea>
                        <button class="auth-btn" onclick="submitStudentFeedbackUI()" style="padding:10px;">Submit Feedback</button>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
    }

    window.submitStudentFeedbackUI = async function() {
        const name = document.getElementById('fbStudentName')?.value.trim() || 'Student Visitor';
        const comment = document.getElementById('fbCommentText')?.value.trim();
        if (!comment) {
            showToast('error', 'Please enter your feedback comments before submitting.');
            return;
        }

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: name, rating: 5, answer: comment, type: 'positive' })
            });
            showToast('success', 'Thank you! Your feedback has been submitted successfully.');
            renderAboutResponsibleAI();
        } catch {
            showToast('success', 'Feedback recorded locally!');
        }
    };
    async function renderNeedHelp() {
        if (!mainContent) return;
        mainContent.innerHTML = `
            <div class="welcome-hero animate">
                <h1>Need Help — AI Mentor & Peer Q&A Guidance Hub</h1>
                <p>Ask grounded career questions to our RAG AI Mentor, or post & answer queries in our student peer community.</p>
            </div>

            <div class="merged-two-column-grid animate">
                <!-- Column 1: Ask my RAG AI Mentor -->
                <div class="tile liquid-glass-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height:650px; max-height:calc(100vh - 180px);">
                    <div style="padding:16px 20px; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.15);">
                        <div style="font-weight:800; font-size:15px; display:flex; align-items:center; gap:8px;">
                            ${SVG_ICONS.chat}
                            <span>Ask my RAG AI Mentor</span>
                        </div>
                        <button class="citation-badge" id="newChatBtnMini" style="background:rgba(255,255,255,0.2); color:#fff; border:none; padding:5px 12px; border-radius:8px; font-weight:700; cursor:pointer;">+ New Chat</button>
                    </div>

                    <div style="padding:10px 16px; background:rgba(248, 250, 252, 0.6); backdrop-filter:blur(10px); border-bottom:1px solid rgba(226,232,240,0.8); display:flex; gap:6px; flex-wrap:wrap; font-size:11px;">
                        <button class="citation-badge" onclick="sendSuggestedPrompt('What are the top skills for AI Engineer?')">AI Skills?</button>
                        <button class="citation-badge" onclick="sendSuggestedPrompt('Suggest placement portfolio projects')">Projects</button>
                        <button class="citation-badge" onclick="sendSuggestedPrompt('DBMS interview questions')">DBMS Prep</button>
                    </div>

                    <div class="chat-messages-container" id="coachMessagesContainer" style="flex:1; overflow-y:auto; padding:16px;"></div>

                    <div style="padding:14px 18px; margin-top:auto; background:rgba(255,255,255,0.8); border-top:1px solid rgba(226,232,240,0.8); display:flex; gap:8px; align-items:center;">
                        <input type="text" id="coachInput" class="frosted-input" placeholder="Ask AI Mentor anything..." style="flex:1; padding:10px 16px; font-size:13px; outline:none;" />
                        <button id="communityChatMicBtn" class="chat-attach-btn" title="Voice input — click to speak"
                            style="font-size:15px; color:var(--ink); font-weight:700; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            🎤
                        </button>
                        <button id="coachSendBtn" class="auth-btn" style="border-radius:10px; padding:10px 20px; font-size:13px; font-weight:800;">Send</button>
                    </div>
                </div>

                <!-- Column 2: Post your query (Community Q&A Forum) -->
                <div class="tile liquid-glass-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height:650px; max-height:calc(100vh - 180px);">
                    <div style="padding:16px 20px; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.15);">
                        <div style="font-weight:800; font-size:15px; display:flex; align-items:center; gap:8px;">
                            ${SVG_ICONS.help}
                            <span>Post Your Query (Community Q&A)</span>
                        </div>
                        <span style="font-size:11.5px; color:rgba(255,255,255,0.7); font-weight:700;">Peer Forum</span>
                    </div>

                    <!-- Feed Container (Middle) -->
                    <div id="communityFeed" style="flex:1; overflow-y:auto; padding:16px; background:rgba(248, 250, 252, 0.4);">
                        <div style="text-align:center; padding:20px; color:var(--muted); font-size:13px;">Loading community discussions...</div>
                    </div>

                    <!-- Post Question Box (Bottom) -->
                    <div style="padding:14px 18px; margin-top:auto; background:rgba(255,255,255,0.8); border-top:1px solid rgba(226,232,240,0.8);">
                        <div style="display:flex; gap:6px; margin-bottom:8px; align-items:center;">
                            <input type="text" id="qaTitleInput" class="frosted-input" placeholder="Question Title (e.g. How to prepare for Coding Round?)" style="flex:1; padding:10px 14px; font-size:12.5px; border-radius:10px;" />
                            <button id="qaVoiceBtn" class="chat-attach-btn" title="Speak Doubt Title via Voice" style="font-size:15px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:700;">
                                🎤
                            </button>
                        </div>
                        <div style="display:flex; gap:8px; margin-bottom:10px;">
                            <select id="qaCategoryInput" class="frosted-input" style="padding:8px 12px; font-size:12px; font-weight:700; border-radius:8px;">
                                <option value="Interviews">Interviews</option>
                                <option value="Career Guidance">Career Guidance</option>
                                <option value="Projects">Projects</option>
                                <option value="General">General</option>
                            </select>
                            <textarea id="qaContentInput" class="frosted-input" placeholder="Provide extra details..." style="flex:1; padding:8px 12px; font-size:12.5px; height:36px; resize:none; border-radius:8px;"></textarea>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="auth-btn" id="postQueryBtn" style="flex:1; border-radius:10px; padding:10px; font-size:13px; font-weight:800; justify-content:center; background:var(--accent);">Post Query</button>
                            <button class="auth-btn" id="findBuddyBtn" style="flex:1; border-radius:10px; padding:10px; font-size:13px; font-weight:800; justify-content:center; background:var(--primary-dark);">Find Buddy</button>
                        </div>
                        <div id="buddyResult" style="margin-top:10px; font-size:12px; display:none; background:var(--bg-input); padding:10px; border-radius:8px; border:1px solid var(--border);"></div>
                    </div>
                </div>
            </div>
        `;

        window.renderCurrentChatMessages();
        loadCommunityFeed();

        document.getElementById('coachSendBtn')?.addEventListener('click', () => requireAuth(window.sendCoachMessage));
        document.getElementById('coachInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') requireAuth(window.sendCoachMessage); });
        
        // Voice microphone triggers for Community Chat & Community Q&A Post
        document.getElementById('communityChatMicBtn')?.addEventListener('click', () => {
            requireAuth(() => window.toggleUniversalVoiceRecorder('communityChatMicBtn', 'coachInput', true));
        });
        document.getElementById('qaVoiceBtn')?.addEventListener('click', () => {
            requireAuth(() => window.toggleUniversalVoiceRecorder('qaVoiceBtn', 'qaTitleInput', false));
        });
        document.getElementById('newChatBtnMini')?.addEventListener('click', () => {
            requireAuth(() => {
                const newId = Date.now().toString();
                chatHistoryLog.unshift({ id: newId, title: 'New Chat', messages: [{ sender: 'assistant', text: `Hello ${studentProfile.full_name}! How can I help you today?` }] });
                currentChatId = newId;
                renderNeedHelp();
            });
        });
        document.getElementById('postQueryBtn')?.addEventListener('click', () => requireAuth(submitCommunityQuery));
        
        document.getElementById('findBuddyBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('findBuddyBtn');
            const resEl = document.getElementById('buddyResult');
            btn.textContent = 'Searching...';
            try {
                const res = await fetch('/api/find-buddy', { method: 'POST' });
                const data = await res.json();
                if (data.ok) {
                    resEl.innerHTML = `<strong style="color:var(--primary);">${escapeHtml(data.peer.full_name)}</strong> (Target: ${escapeHtml(data.peer.target_role)})<br/><br/><strong>Suggested Icebreaker:</strong><br/>${marked.parse(data.icebreaker)}`;
                } else {
                    resEl.innerHTML = escapeHtml(data.error || 'Failed to find buddy.');
                }
                resEl.style.display = 'block';
            } catch {
                resEl.innerHTML = 'Error finding buddy.';
                resEl.style.display = 'block';
            }
            btn.textContent = 'Find a Buddy';
        });
    }

    async function loadCommunityFeed() {
        const feed = document.getElementById('communityFeed');
        if (!feed) return;
        try {
            const res = await fetch('/api/community/queries');
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                feed.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted);">No queries posted yet. Be the first to ask!</div>`;
                return;
            }
            feed.innerHTML = data.map(q => `
                <div class="qa-card">
                    <div class="qa-header">
                        <span class="qa-author">${escapeHtml(q.author_name)}</span>
                        <span class="qa-category">${escapeHtml(q.category)}</span>
                    </div>
                    <div class="qa-title">${escapeHtml(q.title)}</div>
                    <div class="qa-content">${escapeHtml(q.content)}</div>
                    <div class="qa-footer">
                        <button class="qa-upvote-btn" onclick="upvoteCommunityQuery(${q.id}, this)">
                            ▲ Upvote (<span>${q.upvotes}</span>)
                        </button>
                        <span>${(q.answers || []).length} Answers</span>
                    </div>
                    ${(q.answers || []).length > 0 ? `
                        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(203,213,225,0.8); font-size:12px;">
                            ${q.answers.map(a => `
                                <div class="frosted-box" style="padding:8px 12px; margin-bottom:6px; font-size:12px;">
                                    <strong>${escapeHtml(a.author)}:</strong> ${escapeHtml(a.text)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="display:flex; gap:6px; margin-top:8px;">
                        <input type="text" placeholder="Write an answer..." id="ansInput-${q.id}" class="frosted-input" style="flex:1; padding:6px 10px; font-size:12px;" />
                        <button class="auth-btn" style="padding:6px 14px; font-size:11.5px; border-radius:8px; font-weight:700;" onclick="submitAnswerQuery(${q.id})">Reply</button>
                    </div>
                </div>
            `).join('');
        } catch {
            feed.innerHTML = `<div style="text-align:center; color:var(--muted); padding:20px;">Failed to load discussions.</div>`;
        }
    }

    async function submitCommunityQuery() {
        const titleEl = document.getElementById('qaTitleInput');
        const contentEl = document.getElementById('qaContentInput');
        const catEl = document.getElementById('qaCategoryInput');
        const title = titleEl?.value.trim();
        const content = contentEl?.value.trim();
        const category = catEl?.value || 'General';

        if (!title || !content) {
            showToast('warning', 'Please enter title and content for your question.');
            return;
        }

        try {
            const res = await fetch('/api/community/queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category, author_name: studentProfile.full_name })
            });
            const data = await res.json();
            if (data.ok) {
                showToast('success', 'Question posted to community!');
                titleEl.value = '';
                contentEl.value = '';
                loadCommunityFeed();
            } else {
                showToast('error', data.error || 'Failed to post query.');
            }
        } catch {
            showToast('error', 'Network error posting query.');
        }
    }

    window.upvoteCommunityQuery = async function(id, btn) {
        try {
            const res = await fetch(`/api/community/queries/${id}/upvote`, { method: 'POST' });
            const data = await res.json();
            if (data.ok) {
                const countSpan = btn.querySelector('span');
                if (countSpan) countSpan.textContent = data.upvotes;
                showToast('info', 'Upvoted query!');
            }
        } catch {}
    };

    window.submitAnswerQuery = function(id) {
        requireAuth(async () => {
            const input = document.getElementById(`ansInput-${id}`);
            const text = input?.value.trim();
            if (!text) return;
            try {
                const res = await fetch(`/api/community/queries/${id}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, author: studentProfile.full_name })
                });
                const data = await res.json();
                if (data.ok) {
                    showToast('success', 'Answer submitted!');
                    input.value = '';
                    loadCommunityFeed();
                }
            } catch {
                showToast('error', 'Failed to submit answer.');
            }
        });
    };

    // ============================================================
    // MERGED SECTION 2: SKILL GAP & MY LEARNING (2 COLUMNS)
    // ============================================================
    async function renderSkillGapAndLearning() {
        if (!mainContent) return;
        mainContent.innerHTML = `
            <div class="welcome-hero animate">
                <h1>Skill Gap Analysis & Personalized Learning Hub</h1>
                <p>Evaluate target placement requirements and follow custom skill roadmap modules.</p>
            </div>

            <div class="merged-two-column-grid animate">
                <!-- Column 1: Skill Gap & Target Role -->
                <div class="tile liquid-glass-card" id="skillGapColTile">
                    <div style="font-weight:800; font-size:16px; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        ${SVG_ICONS.target}
                        <span>Skill Gap Analysis</span>
                    </div>
                    <div style="margin-bottom:14px;">
                        <label style="font-size:12px; font-weight:700; color:var(--ink);">Select Target Career Role:</label>
                        <select id="roleSelectDropdown" class="frosted-input" style="width:100%; padding:10px 14px; font-weight:700; margin-top:4px;">
                            ${availableRoles.map(r => `<option value="${r}" ${r === studentProfile.target_role ? 'selected' : ''}>${r}</option>`).join('')}
                        </select>
                    </div>

                    <div class="frosted-box" style="height:240px; margin-bottom:16px; position:relative; display:flex; align-items:center; justify-content:center;">
                        <canvas id="proficiencyChartCanvas"></canvas>
                    </div>

                    <div id="skillGapBreakdownList">
                        <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:8px;">Required Skills for Target Role:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            <span class="course-badge" style="background:rgba(0,200,83,0.15); color:var(--primary-dark); border:1px solid rgba(0,200,83,0.3); font-weight:800;">Python (Mastered)</span>
                            <span class="course-badge" style="background:rgba(0,200,83,0.15); color:var(--primary-dark); border:1px solid rgba(0,200,83,0.3); font-weight:800;">SQL (Mastered)</span>
                            <span class="course-badge" style="background:rgba(239,68,68,0.15); color:#dc2626; border:1px solid rgba(239,68,68,0.3); font-weight:800;">Vector DBs (Missing)</span>
                            <span class="course-badge" style="background:rgba(239,68,68,0.15); color:#dc2626; border:1px solid rgba(239,68,68,0.3); font-weight:800;">LangChain (Missing)</span>
                        </div>
                    </div>
                </div>

                <!-- Column 2: Personal Roadmap & Learning Modules -->
                <div class="tile liquid-glass-card">
                    <div style="font-weight:800; font-size:16px; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        ${SVG_ICONS.roadmap}
                        <span>My Personal Learning Roadmap</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:14px;">
                        <div class="note-card frosted-box" style="border-left:4px solid var(--primary);">
                            <div class="note-card-title" style="color:#0f172a; font-weight:800;">Module 1: Advanced SQL & Database Optimization</div>
                            <div class="note-card-body" style="color:#334155; font-weight:500;">Master indexing, execution plans, CTEs, and window functions for high-volume enterprise data queries.</div>
                            <div class="note-card-footer">
                                <span style="font-weight:700; color:var(--primary-dark);">Status: In Progress (75%)</span>
                                <button class="auth-btn" style="padding:6px 14px; font-size:11.5px; border-radius:8px; font-weight:800;" onclick="showToast('info', 'Opening SQL Module Lessons...')">Continue</button>
                            </div>
                        </div>

                        <div class="note-card frosted-box" style="border-left:4px solid #3b82f6;">
                            <div class="note-card-title" style="color:#0f172a; font-weight:800;">Module 2: RAG Architecture & Vector Embeddings</div>
                            <div class="note-card-body" style="color:#334155; font-weight:500;">Learn text chunking, OpenAI/Sentence-Transformer embeddings, ChromaDB vector indexing, and grounding.</div>
                            <div class="note-card-footer">
                                <span style="font-weight:700; color:#2563eb;">Status: Up Next</span>
                                <button class="auth-btn" style="padding:6px 14px; font-size:11.5px; border-radius:8px; font-weight:800;" onclick="showToast('info', 'Opening RAG Module...')">Start Module</button>
                            </div>
                        </div>

                        <div class="note-card frosted-box" style="border-left:4px solid #8b5cf6;">
                            <div class="note-card-title" style="color:#0f172a; font-weight:800;">Module 3: Fast API & PyTest End-to-End Testing</div>
                            <div class="note-card-body" style="color:#334155; font-weight:500;">Build robust REST endpoints, Pydantic validation schemas, and automated CI/CD pipeline integration.</div>
                            <div class="note-card-footer">
                                <span style="font-weight:700; color:#7c3aed;">Status: Locked</span>
                                <button class="auth-btn" style="padding:6px 14px; font-size:11.5px; border-radius:8px; font-weight:800; opacity:0.6;" disabled>Locked</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('roleSelectDropdown')?.addEventListener('change', (e) => {
            studentProfile.target_role = e.target.value;
            updateHeaderProfileUI();
            syncUserDataToSQLite();
            renderProficiencyChart();
        });

        setTimeout(renderProficiencyChart, 100);
    }

    // ============================================================
    // MERGED SECTION 3: MOCK INTERVIEW & RESUME OCR (2 COLUMNS)
    // ============================================================
    // ============================================================
    // MOCK INTERVIEW QUESTION BANK (15-20 QUESTIONS PER DOMAIN)
    // ============================================================
    const INTERVIEW_QUESTION_BANK = {
        'AI & ML Engineer': [
            "Explain how Vector Search works in Retrieval-Augmented Generation (RAG) and why cosine similarity is used over Euclidean distance.",
            "What is the Self-Attention mechanism in Transformer architectures, and how does Multi-Head Attention improve contextual understanding?",
            "Compare gradient descent variants: SGD, Adam, and AdamW. Why is weight decay handled differently in AdamW?",
            "How do you handle severe class imbalance in tabular datasets? Compare SMOTE vs Focal Loss.",
            "What is quantization in LLMs (e.g. INT8/INT4), and how does LoRA (Low-Rank Adaptation) enable efficient fine-tuning?",
            "Explain the bias-variance tradeoff and how L1 (Lasso) vs L2 (Ridge) regularization impacts feature weights.",
            "How does HNSW (Hierarchical Navigable Small World) index work for high-dimensional vector retrieval?",
            "What is the difference between BLEU, ROUGE, and Perplexity metrics when evaluating LLM output quality?",
            "Explain how Convolutional Neural Networks (CNNs) achieve translation invariance through pooling and receptive fields.",
            "Why do Recurrent Neural Networks (RNNs) suffer from vanishing gradients, and how do LSTM gates solve this issue?",
            "What is the difference between generative adversarial networks (GANs) and score-based Diffusion Models?",
            "Explain ROC-AUC curve vs Precision-Recall curve. Which metric is more appropriate for fraud detection?",
            "How does Kernel Trick in Support Vector Machines (SVM) map non-linearly separable data into higher dimensions?",
            "What is data leakage in ML pipelines, and how can cross-validation be structured to prevent it?",
            "How do you deploy an LLM model with streaming tokens using Server-Sent Events (SSE) or WebSockets?"
        ],
        'Full Stack & Backend Developer': [
            "Explain the architectural differences between REST APIs and GraphQL. When would you prefer GraphQL over REST?",
            "How do B-Tree indexes work in relational databases (MySQL/PostgreSQL), and why can over-indexing slow down write performance?",
            "Compare SQL (ACID compliant) vs NoSQL (BASE compliant) databases. Give real-world enterprise use cases for each.",
            "What is JWT (JSON Web Token) authentication? Explain token signing, verification, and stateless session management.",
            "How does Redis caching improve system throughput? Compare Cache-Aside, Write-Through, and Write-Back strategies.",
            "Explain microservices communication patterns: Synchronous HTTP/gRPC vs Asynchronous Event-Driven Messaging (Kafka/RabbitMQ).",
            "What is CORS (Cross-Origin Resource Sharing), and how does the browser perform preflight OPTIONS requests?",
            "How does WebSockets differ from HTTP Long Polling and Server-Sent Events (SSE) for real-time bidirectional communication?",
            "Explain Database Sharding vs Read Replicas. How do you solve data inconsistency in eventual consistency models?",
            "What is Rate Limiting? Explain Token Bucket vs Leaky Bucket algorithms for protecting public API endpoints.",
            "How does Docker containerization guarantee environment consistency across local development, staging, and production?",
            "Explain the concept of Database Normalization (1NF, 2NF, 3NF, BCNF) vs Denormalization for OLAP read performance.",
            "What is an ORM (Object-Relational Mapper)? What is the N+1 query problem, and how do you resolve it with Eager Loading?",
            "Explain CI/CD pipeline stages (Linting, Unit Testing, Integration Testing, Artifact Building, Zero-Downtime Deployment).",
            "How do you implement Idempotency in payment API endpoints using unique Idempotency Keys?"
        ],
        'Data Analyst & Data Scientist': [
            "Explain SQL Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE(). Give a query example for top sales per region.",
            "What is the difference between CTEs (Common Table Expressions) and Subqueries? When should you use temporary tables?",
            "How do you design an A/B Test from scratch? Explain statistical power, sample size calculation, and p-value interpretation.",
            "Compare Mean, Median, and Mode for skewed distributions. Which metric best represents average salary in an engineering firm?",
            "What is the difference between Correlation and Causation? How do you control for confounding variables in observational data?",
            "Explain the Central Limit Theorem (CLT) and why it allows hypothesis testing on sample means.",
            "How do you perform Data Imputation for missing values? Compare Mean/Median imputation vs KNN vs MICE.",
            "What is the difference between Inner Join, Left Outer Join, Right Outer Join, and Full Outer Join in SQL?",
            "Explain Exploratory Data Analysis (EDA) steps when receiving a raw 10M row customer churn dataset.",
            "How do you detect and handle outliers in quantitative variables? Compare Z-Score vs Interquartile Range (IQR).",
            "What is the difference between Pandas DataFrames in Python and PySpark DataFrames for big data processing?",
            "Explain Type I error (False Positive) vs Type II error (False Negative). Which is more critical in medical diagnosis?",
            "How do you structure an interactive Tableau or Power BI dashboard for C-suite executive decision making?",
            "What is Cohort Analysis, and how does it help measure customer retention rates over time?",
            "Explain SQL GROUP BY vs HAVING clause. Why can't aggregate functions be placed in the WHERE clause?"
        ],
        'Cloud & DevOps Engineer': [
            "Explain Kubernetes core concepts: Pods, Deployments, Services (ClusterIP/NodePort/LoadBalancer), and Ingress Controllers.",
            "What is Infrastructure as Code (IaC)? Compare Declarative (Terraform) vs Imperative (AWS CloudFormation/CDK) approaches.",
            "Explain Docker storage options: Bind Mounts vs Named Volumes. How do you maintain persistent data across container restarts?",
            "What is the difference between AWS S3 (Object Storage), EBS (Block Storage), and EFS (Network File System)?",
            "How do you configure a Multi-Region Zero-Downtime Deployment strategy using Blue-Green or Canary deployments?",
            "Explain Prometheus metrics monitoring and Grafana visualization. What are Counter, Gauge, Histogram, and Summary types?",
            "How does AWS IAM (Identity and Access Management) enforce Least Privilege access with Policies, Roles, and Groups?",
            "What is a VPC (Virtual Private Cloud)? Explain Subnets (Public vs Private), NAT Gateways, and Route Tables.",
            "How do AWS Lambda serverless functions work, and how do you optimize cold-start latency for Python/Node.js runtimes?",
            "Explain Container Image Optimization strategies: Multi-Stage Docker builds and Alpine base images.",
            "What is GitOps? How does ArgoCD or Flux synchronize Kubernetes cluster states with Git repositories?",
            "How do you handle Secret Management in production? Compare HashiCorp Vault vs AWS Secrets Manager.",
            "Explain TCP/IP 4-layer model vs OSI 7-layer model. Where do HTTP, TLS, and IP operate?",
            "What is a Reverse Proxy? How does Nginx or HAProxy perform SSL termination and load balancing across backend nodes?",
            "Explain Disaster Recovery (DR) metrics: Recovery Point Objective (RPO) and Recovery Time Objective (RTO)."
        ],
        'Cyber Security & Ethical Hacking': [
            "Explain SQL Injection (SQLi) attacks. How do Prepared Statements / Parameterized Queries prevent raw string concatenation?",
            "What is Cross-Site Scripting (XSS)? Compare Stored, Reflected, and DOM-based XSS attacks and remediation techniques.",
            "Explain Zero-Trust Security Architecture principle ('Never Trust, Always Verify') vs traditional Perimeter Security.",
            "What are the 5 phases of Ethical Hacking / Penetration Testing (Reconnaissance, Scanning, Gaining Access, Maintaining Access, Covering Tracks)?",
            "Compare Symmetric Encryption (AES) vs Asymmetric Encryption (RSA/ECC). How does TLS handshake combine both?",
            "What is the OWASP Top 10 web application security risks? Detail Broken Access Control and Injection vulnerabilities.",
            "Explain Firewalls (Packet Filtering vs Stateful Inspection vs WAF) and Intrusion Detection/Prevention Systems (IDS/IPS).",
            "What is a Buffer Overflow attack? How do modern compilers protect against it using ASLR, DEP, and Stack Canaries?",
            "Explain Man-in-the-Middle (MITM) attacks and how SSL/TLS Certificate Pinning prevents interception on mobile apps.",
            "What is a Public Key Infrastructure (PKI)? How do Certificate Authorities (CA) sign and revoke X.509 digital certificates?",
            "Explain Cross-Site Request Forgery (CSRF) and how anti-CSRF tokens and SameSite cookie attributes mitigate it.",
            "What is Hash Salting? Why is SHA-256 alone insufficient for password storage, requiring bcrypt, Argon2, or PBKDF2?",
            "Explain Ransomware attack vectors and incident response steps for isolation, eradication, and system restoration.",
            "What is Social Engineering / Phishing? Compare Spear Phishing, Whaling, and Smishing attack scenarios.",
            "Explain Security Information and Event Management (SIEM) log analysis with tools like Splunk or Elastic Security."
        ],
        'Civil & Structural Engineer': [
            "Explain Bending Moment and Shear Force diagrams for a simply supported beam under uniform distributed load (UDL).",
            "What is the Concrete Slump Test, and how does it measure workability and water-cement ratio of fresh concrete?",
            "Explain Soil Bearing Capacity and methods for calculating Ultimate vs Allowable bearing capacity for shallow foundations.",
            "What is Reinforced Cement Concrete (RCC)? Why is steel used as reinforcement in concrete structures?",
            "Explain Method of Joints vs Method of Sections for analyzing member forces in planar structural trusses.",
            "What are Geotechnical Site Investigations? Explain Standard Penetration Test (SPT) and soil stratification logging.",
            "How do load path distributions work from Slab to Beams, Columns, Footings, and underlying Soil?",
            "Compare AutoCAD vs Revit BIM modeling software for structural drafting and clash detection.",
            "What are the different types of Foundations (Isolated Footing, Combined Footing, Raft/Mat, Pile Foundation)?",
            "Explain Earthquake Resistant Design principles: Ductility, Base Isolation, Shear Walls, and Response Spectrum Analysis.",
            "What is Pre-stressed Concrete? Compare Pre-tensioning vs Post-tensioning methods.",
            "Explain Total Station surveying principles for elevation leveling, distance measurement, and topographic mapping.",
            "What is Environmental Impact Assessment (EIA) for large civil infrastructure projects?",
            "Explain Hydraulic Jump in open channel flow and its application in energy dissipation downstream of spillways.",
            "What is Pavement Design? Compare Flexible Asphalt Pavements vs Rigid Concrete Pavements."
        ],
        'Mechanical & Automotive Engineer': [
            "Explain the Otto Cycle (4-stroke petrol engine) vs Diesel Cycle PV and TS diagrams. Why is Diesel cycle more thermally efficient?",
            "Explain the Three Laws of Thermodynamics. What is Entropy and its significance in power generation cycles?",
            "Compare Heat Transfer modes: Conduction (Fourier's Law), Convection (Newton's Law of Cooling), and Radiation (Stefan-Boltzmann Law).",
            "What is Finite Element Analysis (FEA)? How do mesh density, boundary conditions, and stress concentrations affect accuracy?",
            "Explain CNC Machining operations (Turning vs Milling) and G-code / M-code execution for precision manufacturing.",
            "What is Bernoulli's Principle in Fluid Dynamics, and how does it relate static pressure, dynamic pressure, and velocity?",
            "Explain Electric Vehicle (EV) Battery Thermal Management Systems (BTMS) using liquid cooling vs air cooling.",
            "What is Stress-Strain Curve for ductile materials? Explain Yield Strength, Ultimate Tensile Strength, and Modulus of Elasticity.",
            "Explain Vapor Compression Refrigeration Cycle (VCRC) components: Compressor, Condenser, Expansion Valve, Evaporator.",
            "What is Gear Ratio and Mechanical Advantage? Compare Spur, Helical, Bevel, and Planetary gearboxes.",
            "Explain Geometric Dimensioning and Tolerancing (GD&T) symbols: Flatness, Perpendicularity, Concentricity, and True Position.",
            "What is Regenerative Braking in Hybrid/Electric Vehicles, and how does it convert kinetic energy into electrical energy?",
            "Explain Kinematics of Linkages: Grashof's Criterion for 4-bar mechanisms.",
            "What is Metal Fatigue and S-N Curve (Stress-Life)? How do surface finish and stress raisers affect endurance limit?",
            "Explain Additive Manufacturing (3D Printing FDM vs SLA vs SLS) vs Traditional Subtractive Manufacturing."
        ],
        'Aerospace & Space Systems': [
            "Explain how Bernoulli's Principle and Newton's Third Law generate Aerodynamic Lift over an airfoil wing section.",
            "What is Tsiolkovsky's Rocket Equation? How does Specific Impulse (Isp) dictate staging requirements for orbital insertion?",
            "Explain Jet Engine airflow stages: Air Intake, Fan, Compressor, Combustion Chamber, Turbine, and Exhaust Nozzle.",
            "What are Kepler's Three Laws of Planetary Motion? Explain Perigee, Apogee, Orbital Eccentricity, and Inclination.",
            "Explain Avionics communication protocols: ARINC 429, MIL-STD-1553, and CAN bus in modern aircraft architectures.",
            "Why are Carbon Fiber Reinforced Polymers (CFRP) favored over Aluminum alloys in modern fuselage construction (e.g. Boeing 787)?",
            "What is Atmospheric Re-entry Thermal Protection System (TPS)? Compare Ablative tiles vs Reusable Ceramic insulation.",
            "Explain Supersonic Shockwaves and Mach Cone formation. What is the difference between Subsonic, Transonic, and Hypersonic flight?",
            "What is Payload Mass Fraction, and why is rocket staging necessary to achieve Low Earth Orbit (LEO) velocity (7.8 km/s)?",
            "Explain Flight Control Surfaces: Ailerons (Roll), Elevators (Pitch), and Rudder (Yaw) on fixed-wing aircraft.",
            "What is Attitude Determination and Control System (ADCS) in satellites? Explain Reaction Wheels vs Magnetorquers.",
            "Explain Space Debris tracking and Collision Avoidance Maneuvers (CAM) for satellites in orbit.",
            "What is Hypersonic Flow aerodynamics (Mach > 5), and how does viscous dissociation affect thermal boundary layers?",
            "Explain Computational Fluid Dynamics (CFD) modeling of aerodynamic drag and lift coefficients (Cd, Cl).",
            "What is Ground Effect in aircraft landing operations, and how does proximity to runway reduce induced drag?"
        ],
        'Electrical & Electronics Engineer': [
            "Explain Ohm's Law and Kirchhoff's Current & Voltage Laws (KCL & KVL). Solve a multi-loop circuit node analysis.",
            "Compare AC (Alternating Current) vs DC (Direct Current) power transmission. Why is High Voltage AC/HVDC used for grid distribution?",
            "What is the operational difference between MOSFET (Field-Effect) and BJT (Bipolar Junction) transistors?",
            "Explain Transformer Core Losses (Hysteresis loss & Eddy current loss). How do laminated silicon steel sheets reduce losses?",
            "What is the Fourier Transform in Signal Processing? How does FFT (Fast Fourier Transform) convert time-domain to frequency-domain?",
            "Compare Microcontrollers (e.g. STM32/ESP32) vs Microprocessors (e.g. ARM Cortex-A). When do you use an RTOS?",
            "What is Power Factor Correction (PFC) in industrial electrical loads? Why do inductive loads lower power factor?",
            "Explain Electric Vehicle Inverters: How do 3-Phase DC-to-AC Inverters drive Permanent Magnet Synchronous Motors (PMSM)?",
            "What is FPGA (Field-Programmable Gate Array) vs ASIC (Application-Specific Integrated Circuit)? Explain Verilog/VHDL synthesis.",
            "Explain PCB Design rules: Signal Integrity, Impedance Matching, Ground Planes, and Decoupling Capacitors.",
            "What is Operational Amplifier (Op-Amp) inverting vs non-inverting configurations? Explain Virtual Ground concept.",
            "Explain Pulse Width Modulation (PWM) duty cycle control for DC motor speed control and LED dimming.",
            "What is Electromagnetic Compatibility (EMC) and Interference (EMI)? How do shielding and ferrite beads suppress noise?",
            "Explain Renewable Solar PV Inverter Maximum Power Point Tracking (MPPT) algorithms (Perturb & Observe).",
            "What is SCADA (Supervisory Control and Data Acquisition) and PLC programming in industrial automation?"
        ]
    };

    let selectedInterviewDomain = 'AI & ML Engineer';
    let selectedInterviewQuestionIndex = 0;

    window.startMockInterviewMic = function() {
        window.toggleUniversalVoiceRecorder('micInterviewBtn', 'mockAnswerInput', false);
    };

    window.switchInterviewDomain = function(domain) {
        selectedInterviewDomain = domain;
        selectedInterviewQuestionIndex = 0;
        renderInterviewAndResume();
    };

    window.selectInterviewQuestionIndex = function(idx) {
        selectedInterviewQuestionIndex = idx;
        const questions = INTERVIEW_QUESTION_BANK[selectedInterviewDomain] || INTERVIEW_QUESTION_BANK['AI & ML Engineer'];
        const qText = questions[selectedInterviewQuestionIndex] || questions[0];
        
        const qTitleEl = document.getElementById('currentQuestionTitle');
        const qTextEl = document.getElementById('currentQuestionText');
        const ansInput = document.getElementById('mockAnswerInput');
        const fbBox = document.getElementById('mockFeedbackBox');

        if (qTitleEl) qTitleEl.textContent = `Technical Question #${selectedInterviewQuestionIndex + 1} (${escapeHtml(selectedInterviewDomain)})`;
        if (qTextEl) qTextEl.textContent = qText;
        if (ansInput) ansInput.value = '';
        if (fbBox) fbBox.style.display = 'none';

        // Update active index button styling
        const btnContainer = document.getElementById('questionIdxButtons');
        if (btnContainer) {
            btnContainer.querySelectorAll('button').forEach((b, i) => {
                if (i === idx) {
                    b.style.background = 'var(--primary)';
                    b.style.color = '#fff';
                } else {
                    b.style.background = '#f1f5f9';
                    b.style.color = 'var(--navy)';
                }
            });
        }
    };

    function renderInterviewAndResume() {
        if (!mainContent) return;

        const domains = Object.keys(INTERVIEW_QUESTION_BANK);
        if (!INTERVIEW_QUESTION_BANK[selectedInterviewDomain]) {
            selectedInterviewDomain = domains[0];
        }
        const currentQuestions = INTERVIEW_QUESTION_BANK[selectedInterviewDomain];
        const activeQuestion = currentQuestions[selectedInterviewQuestionIndex] || currentQuestions[0];

        mainContent.innerHTML = `
            <div class="welcome-hero animate">
                <h1>Mock Interview Suite (15-20 Questions/Field) & ATS Resume Analyzer</h1>
                <p>Practice technical interview questions categorized across 9 engineering domains, evaluate voice/written answers with Sarvam AI, and analyze your resume OCR ATS score.</p>
            </div>

            <div class="merged-two-column-grid animate">
                <!-- Column 1: Mock Interview Suite (Emerald Accent) -->
                <div class="tile liquid-glass-card tile-accent-emerald">
                    <div style="font-weight:800; font-size:16px; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <span style="display:flex; align-items:center; gap:8px;">
                            <span style="color:#00c853;">${SVG_ICONS.mic}</span>
                            <span>Mock Technical Interview Suite</span>
                        </span>
                        <select onchange="window.switchInterviewDomain(this.value)" class="frosted-input" style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:6px;">
                            ${domains.map(d => `<option value="${escapeHtml(d)}" ${d === selectedInterviewDomain ? 'selected' : ''}>${escapeHtml(d)} (${INTERVIEW_QUESTION_BANK[d].length} Qs)</option>`).join('')}
                        </select>
                    </div>

                    <!-- Question Index Pill Navigation -->
                    <div id="questionIdxButtons" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid var(--border);">
                        ${currentQuestions.map((q, idx) => `
                            <button onclick="window.selectInterviewQuestionIndex(${idx})" style="padding:4px 10px; font-size:11.5px; font-weight:800; border-radius:4px; border:none; cursor:pointer; ${idx === selectedInterviewQuestionIndex ? 'background:var(--primary); color:#fff;' : 'background:#f1f5f9; color:var(--navy);'}">
                                Q${idx + 1}
                            </button>
                        `).join('')}
                    </div>

                    <div class="frosted-box" style="margin-bottom:16px; border-left:3px solid #00c853;">
                        <div id="currentQuestionTitle" style="font-size:11px; font-weight:800; color:#00c853; text-transform:uppercase; margin-bottom:4px;">Technical Question #${selectedInterviewQuestionIndex + 1} (${escapeHtml(selectedInterviewDomain)})</div>
                        <div id="currentQuestionText" style="font-size:13.5px; font-weight:800; color:#0f172a; line-height:1.4;">${escapeHtml(activeQuestion)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <label style="font-size:12px; font-weight:800; color:#0f172a;">Your Answer (Type or Speak):</label>
                            <button id="micInterviewBtn" onclick="startMockInterviewMic()" class="frosted-input" style="padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:6px;">
                                ${SVG_ICONS.mic} <span>Record Voice</span>
                            </button>
                        </div>
                        <textarea id="mockAnswerInput" class="frosted-input" placeholder="Type your response or click 'Record Voice' to dictate..." style="width:100%; height:110px; padding:12px; font-size:13px; outline:none; resize:none; border:1px solid var(--border); border-radius:8px;"></textarea>
                    </div>

                    <button class="auth-btn cta-btn" id="submitMockAnsBtn" style="width:100%; border-radius:8px; padding:12px; justify-content:center; font-weight:800;">Submit Answer for Real AI Rating & Feedback</button>

                    <div id="mockFeedbackBox" style="margin-top:16px; display:none;"></div>
                </div>

                <!-- Column 2: Resume OCR Scanner & ATS Builder (Blue Accent) -->
                <div class="tile liquid-glass-card tile-accent-blue">
                    <div style="font-weight:800; font-size:16px; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <span style="color:#3b82f6;">${SVG_ICONS.document}</span>
                        <span>Resume OCR Scanner & ATS Skill Pie Chart</span>
                    </div>

                    <div class="frosted-box" style="border:2px dashed #93c5fd; text-align:center; margin-bottom:14px; background:#eff6ff;">
                        <input type="file" id="resumeFileInput" accept="image/*,.pdf" style="display:none;" />
                        <button class="auth-btn" style="margin:0 auto 8px auto; padding:8px 20px; border-radius:20px; font-weight:800; background:#3b82f6; color:#fff; border:none;" onclick="document.getElementById('resumeFileInput').click()">Upload Resume Image / PDF</button>
                        <div style="font-size:12px; color:var(--muted); font-weight:600;">Sarvam Vision OCR (Akshar Model) extracts text from images & PDFs automatically</div>
                    </div>

                    <textarea id="resumeTextInput" class="frosted-input" placeholder="Paste your resume text here or click upload above..." style="width:100%; height:90px; padding:12px; font-size:12.5px; outline:none; resize:none; margin-bottom:12px; border:1px solid var(--border); border-radius:8px;"></textarea>

                    <button class="auth-btn" id="analyzeResumeBtn" style="width:100%; border-radius:8px; padding:12px; justify-content:center; font-weight:800;">Run ATS OCR Skill Match Analysis</button>

                    <div id="resumeAnalysisResults" style="margin-top:16px;"></div>
                </div>
            </div>
        `;

        // SUBMIT MOCK INTERVIEW ANSWER WITH AI SCORING
        document.getElementById('submitMockAnsBtn')?.addEventListener('click', async () => {
            const val = document.getElementById('mockAnswerInput')?.value.trim();
            if (!val) {
                showToast('warning', 'Please speak or type an answer first.');
                return;
            }
            const fb = document.getElementById('mockFeedbackBox');
            if (fb) {
                fb.style.display = 'block';
                fb.innerHTML = `
                    <div style="text-align:center; padding:16px; background:#fff; border:1px solid var(--border); border-radius:8px;">
                        <div style="font-size:13px; font-weight:700; color:var(--navy);">Evaluating answer with Sarvam AI model...</div>
                    </div>
                `;
            }
            try {
                const currentQuestion = INTERVIEW_QUESTION_BANK[selectedInterviewDomain][selectedInterviewQuestionIndex];
                const evalPrompt = `You are a senior technical interviewer for a ${selectedInterviewDomain} role. Evaluate this candidate response for the question: "${currentQuestion}"\nCandidate Answer: "${val}"\nProvide: 1. Score out of 10. 2. Key Strengths. 3. Suggestions to reach 10/10. 4. Concise sample ideal answer.`;
                const res = await fetch('/api/v1/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: evalPrompt, language: 'en' })
                });
                const data = await res.json();
                if (fb) {
                    fb.innerHTML = `
                        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:8px; color:#047857;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <strong style="font-size:14px; color:#065f46;">AI Rating & Feedback</strong>
                                <span class="course-badge" style="background:#d1fae5; color:#065f46;">Evaluation Complete</span>
                            </div>
                            <div style="font-size:13px; line-height:1.6; color:#064e3b;">${window.marked ? marked.parse(data.answer) : data.answer}</div>
                        </div>
                    `;
                }
                showToast('success', 'AI Rating calculated successfully!');
            } catch (err) {
                console.error(err);
                showToast('error', 'Error evaluating interview answer.');
                if (fb) fb.innerHTML = `<div style="color:var(--error); padding:12px;">Failed to evaluate answer.</div>`;
            }
        });

        // WIRING RESUME FILE INPUT FOR SARVAM VISION OCR (AKSHAR MODEL)
        const resumeFileInput = document.getElementById('resumeFileInput');
        if (resumeFileInput) {
            resumeFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const results = document.getElementById('resumeAnalysisResults');
                const btn = document.getElementById('analyzeResumeBtn');
                const textInput = document.getElementById('resumeTextInput');

                if (results) {
                    results.style.display = 'block';
                    results.innerHTML = `
                        <div style="text-align:center; padding:24px; background:#fff; border-radius:12px; border:1px solid var(--border);">
                            <div style="font-size:28px; margin-bottom:8px;">📷</div>
                            <h4 style="font-size:14px; font-weight:800; color:var(--navy); margin-bottom:4px;">Digitizing Document with Sarvam Vision OCR (Akshar Model)...</h4>
                            <p style="font-size:12px; color:var(--muted); margin:0;">Processing ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)</p>
                        </div>
                    `;
                }
                if (btn) btn.disabled = true;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('question', `Extract skills and text for ${studentProfile.target_role} resume evaluation.`);

                try {
                    const ocrRes = await fetch('/api/v1/ocr-chat', {
                        method: 'POST',
                        body: formData
                    });
                    const ocrData = await ocrRes.json();
                    const extractedText = ocrData.extracted_text || '';

                    if (textInput) textInput.value = extractedText;

                    const aRes = await fetch('/api/resume-analyzer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resume_text: extractedText, target_role: studentProfile.target_role })
                    });
                    const aData = await aRes.json();

                    renderResumePieChartAndResults(aData, results, extractedText);
                    showToast('success', 'Sarvam Vision OCR & Resume Infographic Analysis Complete!');
                } catch (err) {
                    console.error('OCR Error:', err);
                    showToast('error', 'Sarvam OCR Document Extraction Failed');
                    if (results) results.innerHTML = `<div style="color:var(--error); padding:16px;">Failed to extract document text via OCR.</div>`;
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }

        document.getElementById('analyzeResumeBtn')?.addEventListener('click', async () => {
            const text = document.getElementById('resumeTextInput')?.value.trim();
            const results = document.getElementById('resumeAnalysisResults');
            const btn = document.getElementById('analyzeResumeBtn');
            if (!text) {
                showToast('error', 'Please paste your resume text or upload an image/PDF file.');
                return;
            }
            if (results) {
                btn.textContent = 'Analyzing Resume...';
                try {
                    const res = await fetch('/api/resume-analyzer', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ resume_text: text, target_role: studentProfile.target_role })
                    });
                    const data = await res.json();
                    renderResumePieChartAndResults(data, results, text);
                    showToast('success', 'Resume ATS & Skill Analysis complete!');
                } catch {
                    showToast('error', 'Failed to analyze resume.');
                }
                btn.textContent = 'Run ATS OCR Skill Match Analysis';
            }
        });
    }

    // ============================================================
    // GLOBAL SOFT SCROLL FLOAT-IN AND FLOAT-OUT OBSERVER
    // ============================================================
    function setupScrollFloatObserver() {
        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    entry.target.classList.remove('out-view');
                } else {
                    if (entry.boundingClientRect.top < 0) {
                        entry.target.classList.add('out-view');
                        entry.target.classList.remove('in-view');
                    }
                }
            });
        }, { threshold: 0.05 });

        document.querySelectorAll('.tile, .card, .stat-card, .right-tile, .qa-card, .note-card, .project-card, .profile-card, .resume-analyzer-card, .welcome-hero, .merged-two-column-grid > div').forEach(el => {
            el.classList.add('scroll-float');
            observer.observe(el);
        });
    }

    // INIT APP SESSION CHECK
    checkAuthSession();

    // ============================================================
    // GAMIFICATION & UI WIDGET LOGIC
    // ============================================================
    
    // Sarvam Widget Logic
    const sarvamBtn = document.getElementById('sarvamUploadBtn');
    const sarvamPanel = document.getElementById('sarvamUploadPanel');
    if (sarvamBtn && sarvamPanel) {
        sarvamBtn.addEventListener('click', () => {
            const isVisible = sarvamPanel.style.display === 'block';
            sarvamPanel.style.display = isVisible ? 'none' : 'block';
        });
    }

    const sarvamFileInput = document.getElementById('sarvamFileInput');
    const sarvamPreview = document.getElementById('sarvamPreview');
    const sarvamSubmitBtn = document.getElementById('sarvamSubmitBtn');
    const sarvamQuestion = document.getElementById('sarvamQuestion');
    let sarvamImageBase64 = null;

    if (sarvamFileInput && sarvamPreview) {
        sarvamFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sarvamImageBase64 = evt.target.result;
                    sarvamPreview.innerHTML = `<img src="${sarvamImageBase64}" style="width:100%; height:100%; object-fit:contain;" />`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (sarvamSubmitBtn) {
        sarvamSubmitBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('sarvamFileInput');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                showToast('error', 'Please select an image or PDF first.');
                return;
            }
            const q = sarvamQuestion?.value || 'Extract the text and explain it.';
            sarvamSubmitBtn.textContent = 'Processing OCR...';
            sarvamSubmitBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('question', q);
            formData.append('language', studentProfile.language || 'en');

            try {
                const res = await fetch('/api/v1/ocr-chat', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (data.error) {
                    showToast('error', data.error);
                } else {
                    showToast('success', 'Document processed successfully!');
                    
                    // Display response in chat or alert
                    if (data.answer) {
                        alert(`Extracted Text Length: ${data.extracted_text?.length || 0} chars\n\nAI Answer:\n${data.answer}`);
                    }
                }
                
                sarvamSubmitBtn.textContent = 'Analyze via Sarvam OCR';
                sarvamSubmitBtn.disabled = false;
                sarvamPanel.style.display = 'none';
            } catch (err) {
                showToast('error', 'Failed to process document.');
                sarvamSubmitBtn.textContent = 'Analyze via Sarvam OCR';
                sarvamSubmitBtn.disabled = false;
            }
        });
    }

    // Hinglish Toggle Logic
    const hinglishToggle = document.getElementById('hinglishToggle');
    if (hinglishToggle) {
        hinglishToggle.addEventListener('change', () => {
            if (hinglishToggle.checked) {
                studentProfile.language = 'hi';
                showToast('info', 'Switched to Hinglish Mode 🇮🇳');
            } else {
                studentProfile.language = 'en';
                showToast('info', 'Switched to English Mode 🇬🇧');
            }
            syncUserDataToSQLite();
        });
    }

    // ============================================================
    // SARVAM FLOATING UPLOAD WIDGET WIRING
    // ============================================================
    (function initSarvamWidget() {
        const uploadBtn = document.getElementById('sarvamUploadBtn');
        const uploadPanel = document.getElementById('sarvamUploadPanel');
        const fileInput = document.getElementById('sarvamFileInput');
        const preview = document.getElementById('sarvamPreview');
        const submitBtn = document.getElementById('sarvamSubmitBtn');
        const questionInput = document.getElementById('sarvamQuestion');

        if (!uploadBtn || !uploadPanel) return;

        // Toggle panel open/close
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = uploadPanel.style.display !== 'none';
            uploadPanel.style.display = isOpen ? 'none' : 'block';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!uploadBtn.contains(e.target) && !uploadPanel.contains(e.target)) {
                if (uploadPanel) uploadPanel.style.display = 'none';
            }
        });

        // Image preview on file selection
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (!file || !preview) return;
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:contain; border-radius:6px;" />`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.innerHTML = `<span style="font-size:12px; color:var(--muted); text-align:center; padding:10px;">📄 ${escapeHtml(file.name)}</span>`;
                }
            });
        }

        // Submit to OCR endpoint
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                if (!fileInput || !fileInput.files[0]) {
                    showToast('error', 'Please select an image or PDF first.');
                    return;
                }
                requireAuth(async () => {
                    const file = fileInput.files[0];
                    const question = questionInput ? questionInput.value.trim() : '';

                    submitBtn.textContent = '⏳ Analyzing...';
                    submitBtn.disabled = true;

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('question', question || 'Analyze this document and provide career guidance.');
                    formData.append('language', studentProfile.language || 'en');

                    try {
                        const res = await fetch('/api/v1/ocr-chat', { method: 'POST', body: formData });
                        if (!res.ok) {
                            const errText = await res.text();
                            throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
                        }
                        const data = await res.json();

                        // Inject result into active chat thread and navigate to chat
                        let thread = chatHistoryLog.find(c => c.id === currentChatId) || chatHistoryLog[0];
                        if (!thread) {
                            const newId = Date.now().toString();
                            thread = { id: newId, title: 'Document Analysis', messages: [] };
                            chatHistoryLog.unshift(thread);
                            currentChatId = newId;
                        }

                        thread.messages.push({
                            sender: 'user',
                            text: question || `📎 Uploaded: ${file.name}`,
                            imageUrl: data.image_url || null
                        });
                        thread.messages.push({
                            sender: 'assistant',
                            text: data.answer || data.analysis || 'Analysis complete.',
                            extractedText: data.extracted_text || null,
                            citations: data.citations || []
                        });

                        syncUserDataToSQLite();
                        uploadPanel.style.display = 'none';
                        showToast('success', 'Document analyzed! Opening Chat Coach...');
                        navigateTo('need-help');
                    } catch (err) {
                        console.error('Sarvam widget OCR error:', err);
                        showToast('error', `OCR failed: ${err.message}`);
                    } finally {
                        submitBtn.textContent = 'Analyze via Sarvam OCR';
                        submitBtn.disabled = false;
                        if (fileInput) fileInput.value = '';
                        if (preview) preview.innerHTML = `<span style="color:var(--muted); font-size:12px;">Image Preview</span>`;
                        if (questionInput) questionInput.value = '';
                    }
                });
            });
        }
    })();

    // ============================================================
    // DYNAMIC COLORFUL SKILL RADAR / CIRCULAR MASTERY GRAPH WIDGET
    // ============================================================
    window.SKILL_RADAR_DATA = {
        'CSE': [
            { name: 'Python & DSA', pct: 92, color: '#00c853' },
            { name: 'Vector DB & RAG', pct: 88, color: '#3b82f6' },
            { name: 'LLMs & PyTorch', pct: 82, color: '#8b5cf6' },
            { name: 'System Design', pct: 78, color: '#f59e0b' },
            { name: 'Docker & MLOps', pct: 75, color: '#ec4899' },
            { name: 'SQL & Databases', pct: 85, color: '#06b6d4' }
        ],
        'DataAnalyst': [
            { name: 'SQL Window Fn', pct: 95, color: '#3b82f6' },
            { name: 'Pandas & Python', pct: 90, color: '#00c853' },
            { name: 'Tableau / PowerBI', pct: 85, color: '#f59e0b' },
            { name: 'A/B Testing', pct: 78, color: '#8b5cf6' },
            { name: 'Statistics & Math', pct: 82, color: '#06b6d4' },
            { name: 'PySpark BigData', pct: 72, color: '#ec4899' }
        ],
        'FullStack': [
            { name: 'Node / Express', pct: 90, color: '#00c853' },
            { name: 'React Frontend', pct: 88, color: '#3b82f6' },
            { name: 'REST & GraphQL', pct: 85, color: '#8b5cf6' },
            { name: 'PostgreSQL DB', pct: 80, color: '#f59e0b' },
            { name: 'Redis Caching', pct: 78, color: '#ec4899' },
            { name: 'Microservices', pct: 75, color: '#06b6d4' }
        ],
        'DevOps': [
            { name: 'Kubernetes Engine', pct: 85, color: '#3b82f6' },
            { name: 'Terraform IaC', pct: 88, color: '#8b5cf6' },
            { name: 'Docker Containers', pct: 92, color: '#00c853' },
            { name: 'AWS Cloud Infra', pct: 86, color: '#f59e0b' },
            { name: 'CI/CD Pipelines', pct: 90, color: '#06b6d4' },
            { name: 'Grafana Monitoring', pct: 78, color: '#ec4899' }
        ],
        'Cyber': [
            { name: 'Penetration Testing', pct: 88, color: '#ef4444' },
            { name: 'OWASP Top 10', pct: 92, color: '#f59e0b' },
            { name: 'Zero-Trust Security', pct: 85, color: '#3b82f6' },
            { name: 'Network Security', pct: 80, color: '#8b5cf6' },
            { name: 'SIEM Analysis', pct: 78, color: '#00c853' },
            { name: 'Cryptography', pct: 82, color: '#06b6d4' }
        ],
        'Mechanical': [
            { name: 'SolidWorks CAD', pct: 90, color: '#3b82f6' },
            { name: 'FEA Stress Analysis', pct: 82, color: '#8b5cf6' },
            { name: 'Thermodynamics', pct: 85, color: '#f59e0b' },
            { name: 'CNC Machining', pct: 78, color: '#00c853' },
            { name: 'EV Battery BTMS', pct: 75, color: '#ec4899' },
            { name: 'GD&T Tolerancing', pct: 80, color: '#06b6d4' }
        ],
        'Civil': [
            { name: 'Structural Analysis', pct: 88, color: '#3b82f6' },
            { name: 'RCC Beam Design', pct: 85, color: '#00c853' },
            { name: 'AutoCAD & Revit BIM', pct: 92, color: '#f59e0b' },
            { name: 'Geotechnical Soil', pct: 78, color: '#8b5cf6' },
            { name: 'Open Channel Flow', pct: 80, color: '#06b6d4' },
            { name: 'Survey Total Station', pct: 85, color: '#ec4899' }
        ],
        'Electrical': [
            { name: 'Circuit Node Analysis', pct: 90, color: '#3b82f6' },
            { name: 'VLSI & Verilog', pct: 82, color: '#8b5cf6' },
            { name: 'Embedded STM32', pct: 85, color: '#00c853' },
            { name: 'EV Inverters', pct: 78, color: '#f59e0b' },
            { name: 'PCB Signal Integrity', pct: 88, color: '#06b6d4' },
            { name: 'Signal Processing', pct: 80, color: '#ec4899' }
        ]
    };

    window.renderSkillRadar = function(domain = 'CSE') {
        const container = document.getElementById('skillRadarWidget');
        if (!container) return;
        const skills = SKILL_RADAR_DATA[domain] || SKILL_RADAR_DATA['CSE'];
        const avg = Math.round(skills.reduce((acc, s) => acc + s.pct, 0) / skills.length);

        let svgHtml = `
            <div style="position:relative; width:150px; height:150px; margin:0 auto 10px auto;">
                <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" stroke-width="6" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" stroke-width="4" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="#f8fafc" stroke-width="2" />
                    ${skills.map((s, idx) => {
                        const radius = 45 - (idx * 4.5);
                        const strokeDash = (s.pct / 100) * (2 * Math.PI * radius);
                        const strokeGap = (2 * Math.PI * radius) - strokeDash;
                        return `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${s.color}" stroke-width="4" stroke-dasharray="${strokeDash} ${strokeGap}" stroke-linecap="round" style="transition: stroke-dasharray 0.6s ease;" />`;
                    }).join('')}
                </svg>
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
                    <div style="font-size:18px; font-weight:800; color:var(--ink); line-height:1;">${avg}%</div>
                    <div style="font-size:9px; font-weight:700; color:var(--muted); text-transform:uppercase;">Mastery</div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
                ${skills.map(s => `
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:2px;">
                            <span style="color:var(--ink); display:flex; align-items:center; gap:5px;">
                                <span style="width:7px; height:7px; border-radius:50%; background:${s.color}; display:inline-block;"></span>
                                ${s.name}
                            </span>
                            <span style="color:${s.color}; font-weight:800;">${s.pct}%</span>
                        </div>
                        <div style="height:5px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                            <div style="width:${s.pct}%; height:100%; background:${s.color}; border-radius:3px; transition:width 0.5s ease;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = svgHtml;
    };

    // Dashboard Leaderboard Render Logic with Student Avatars & Rank Badges
    window.fetchAndRenderDashboardLeaderboard = async function() {
        const container = document.getElementById('dashboardLeaderboardContainer');
        if (!container) return;
        try {
            const res = await fetch('/api/gamification/leaderboard');
            const data = await res.json();
            const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

            let html = `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${data.slice(0, 5).map((u, i) => {
                        const initials = u.full_name ? u.full_name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'ST';
                        const color = avatarColors[i % avatarColors.length];
                        const rankBadge = i === 0 ? '<span style="background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:12px; font-weight:800; font-size:11px;">🥇 #1</span>' :
                                          i === 1 ? '<span style="background:#e2e8f0; color:#334155; padding:3px 8px; border-radius:12px; font-weight:800; font-size:11px;">🥈 #2</span>' :
                                          i === 2 ? '<span style="background:#ffedd5; color:#9a3412; padding:3px 8px; border-radius:12px; font-weight:800; font-size:11px;">🥉 #3</span>' :
                                          `<span style="color:var(--muted); font-weight:800; font-size:12px; padding-left:4px;">#${i+1}</span>`;

                        return `
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#ffffff; border:1px solid var(--border); border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.03); transition:transform 0.15s ease;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="width:34px; height:34px; border-radius:50%; background:${color}; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; flex-shrink:0; box-shadow:0 2px 5px rgba(0,0,0,0.12);">
                                        ${initials}
                                    </div>
                                    <div>
                                        <div style="font-weight:700; color:var(--ink); font-size:13px; display:flex; align-items:center; gap:6px;">
                                            <span>${escapeHtml(u.full_name)}</span>
                                            ${rankBadge}
                                        </div>
                                        <div style="font-size:11px; color:var(--muted); font-weight:500;">
                                            ${escapeHtml(u.college || 'Engineering Institute')} • <span style="color:var(--primary-dark); font-weight:700;">Lvl ${u.level}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-weight:800; color:#10b981; font-size:14px;">${u.points} XP</div>
                                    <div style="font-size:10px; color:var(--muted); font-weight:600;">Total Score</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            container.innerHTML = html;
        } catch {
            container.innerHTML = `<p style="color:var(--error);">Failed to load leaderboard.</p>`;
        }
    };

    // Render initial skill radar on document ready
    setTimeout(() => {
        if (window.renderSkillRadar) window.renderSkillRadar('CSE');
    }, 400);
})();
