/**
 * QuizEngine - Phase 6 Browser Acceptance Workflow Verification
 * Simulates real browser client interactions across Student and Admin lifecycles.
 */

const http = require("http");

const NODE_PORT = 5001;
const JAVA_PORT = 8088;

function request(port, path, options = {}) {
  return new Promise((resolve) => {
    const postData = options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : null;
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method: options.method || "GET",
        headers: {
          ...(postData && !options.headers?.["Content-Type"] ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(raw); } catch (_) {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            json,
            text: raw,
          });
        });
      }
    );
    req.on("error", (err) => resolve({ statusCode: 0, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runBrowserAcceptance() {
  console.log("==================================================================");
  console.log("🌐 QUIZENGINE PHASE 6 - BROWSER ACCEPTANCE WORKFLOW SUITE");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(stepName, condition, detail = "") {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${stepName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${stepName} ${detail}`);
      throw new Error(`Failed: ${stepName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PART 1: STUDENT BROWSER WORKFLOW
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Part 1: Student Browser Lifecycle ---");

  // Step 1: Student Registration
  const ts = Date.now();
  const studentEmail = `browser_student_${ts}@example.com`;
  const regRes = await request(NODE_PORT, "/api/auth/register", {
    method: "POST",
    body: { name: "Alice Browser", email: studentEmail, password: "Password123!" },
  });
  assert("Step 1: Student Registration (POST /api/auth/register)", regRes.statusCode === 201 && regRes.json?.token);
  let studentToken = regRes.json.token;

  // Step 2: Student Login
  const loginRes = await request(NODE_PORT, "/api/auth/login", {
    method: "POST",
    body: { email: studentEmail, password: "Password123!" },
  });
  assert("Step 2: Student Login (POST /api/auth/login)", loginRes.statusCode === 200 && loginRes.json?.token);
  studentToken = loginRes.json.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // Step 3: Browse Topics Graph
  const topicsRes = await request(JAVA_PORT, "/api/java/topics", { headers: studentHeaders });
  const topics = topicsRes.json?.topics || (Array.isArray(topicsRes.json) ? topicsRes.json : []);
  const htmlTopic = topics.find((t) => (t.id || t._id) === "topic-html");
  const javaTopic = topics.find((t) => (t.id || t._id) === "topic-java");
  assert("Step 3: Browse Topics Graph (GET /api/java/topics)", topicsRes.statusCode === 200 && topics.length === 3);

  // Step 4: Prerequisite Unlocking Logic
  assert("Step 4: Initial Prerequisite Status (HTML unlocked, Java locked)", htmlTopic?.unlocked === true && javaTopic?.unlocked === false);

  // Step 5: Quiz Question Retrieval
  const questionsRes = await request(JAVA_PORT, "/api/java/questions?topicId=topic-html&count=5", { headers: studentHeaders });
  const qList = questionsRes.json?.questions || [];
  const noAnswersLeaked = qList.every((q) => q.correctAnswer === undefined && q.explanation === undefined);
  assert("Step 5: Question Retrieval without Answer Leakage (GET /api/java/questions)", questionsRes.statusCode === 200 && qList.length === 5 && noAnswersLeaked);

  // Step 6: Quiz Submission & Evaluation
  const subId = `browser-sub-${ts}`;
  const evalRes = await request(JAVA_PORT, "/api/java/quiz/evaluate", {
    method: "POST",
    headers: studentHeaders,
    body: {
      topicId: "topic-html",
      submissionId: subId,
      timeTakenSeconds: 22,
      answers: qList.map((q) => ({ questionId: q.id, selectedOption: 0, timedOut: false })),
    },
  });
  assert("Step 6: Quiz Submission & Scoring (POST /api/java/quiz/evaluate)", evalRes.statusCode === 200 && evalRes.json?.attemptId);

  // Step 7: View Results & Breakdown
  assert("Step 7: Result Verification (Score, Percentage & History array)", evalRes.json?.history?.length === 5 && evalRes.json?.score !== undefined);

  // Step 8: View Attempt History
  const historyRes = await request(NODE_PORT, "/api/quiz/history", { headers: studentHeaders });
  assert("Step 8: Quiz History (GET /api/quiz/history)", historyRes.statusCode === 200 && historyRes.json?.attempts?.length >= 1);

  // Step 9: View Leaderboard
  const lbRes = await request(NODE_PORT, "/api/leaderboard", { headers: studentHeaders });
  assert("Step 9: Global Leaderboard (GET /api/leaderboard)", lbRes.statusCode === 200 && Array.isArray(lbRes.json?.leaderboard));

  // Step 10: Refresh & Navigation Session Preservation
  const meRes = await request(NODE_PORT, "/api/auth/me", { headers: studentHeaders });
  assert("Step 10: Session Persistence on Navigation (GET /api/auth/me)", meRes.statusCode === 200 && meRes.json?.user?.email === studentEmail);

  // ─────────────────────────────────────────────────────────────
  // PART 2: ADMIN BROWSER WORKFLOW
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Part 2: Admin Browser Lifecycle ---");

  // Step 11: Admin Login
  const adminEmail = `admin_browser_${ts}@example.com`;
  const adminReg = await request(NODE_PORT, "/api/auth/register", {
    method: "POST",
    headers: { "X-Admin-Secret": "quizengine-dev-admin-secret" },
    body: { name: "Bob Admin", email: adminEmail, password: "AdminPassword123!", role: "admin" },
  });
  const adminToken = adminReg.json?.token;

  const jspLogin = await request(JAVA_PORT, "/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `authMethod=token&adminToken=${encodeURIComponent(adminToken)}`,
  });
  const sessionCookie = jspLogin.headers?.["set-cookie"]?.[0]?.split(";")[0] || "";
  assert("Step 11: Admin Session Establishment (POST /admin/login)", jspLogin.statusCode === 302 && sessionCookie.includes("QE_ADMIN_SESSION"));

  const adminHeaders = { Cookie: sessionCookie };

  // Step 12: Admin Dashboard
  const dashRes = await request(JAVA_PORT, "/admin/dashboard", { headers: adminHeaders });
  assert("Step 12: Admin Dashboard Rendering (GET /admin/dashboard)", dashRes.statusCode === 200 && dashRes.text.includes("Dashboard"));

  // Step 13: Question Listing & Search
  const qListRes = await request(JAVA_PORT, "/admin/questions", { headers: adminHeaders });
  assert("Step 13: Question Bank Listing (GET /admin/questions)", qListRes.statusCode === 200 && qListRes.text.includes("Question Management"));

  // Step 14: Extract CSRF Token
  const formRes = await request(JAVA_PORT, "/admin/questions/create", { headers: adminHeaders });
  const csrfMatch = formRes.text.match(/name="csrfToken"\s+value="([a-f0-9\-]+)"/i);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  assert("Step 14: CSRF Token Extraction (GET /admin/questions/create)", csrfToken !== null);

  // Step 15: Create Disposable Test Question
  const dispQId = `q-browser-disp-${ts}`;
  const createRes = await request(JAVA_PORT, "/admin/questions/create", {
    method: "POST",
    headers: { ...adminHeaders, "Content-Type": "application/x-www-form-urlencoded" },
    body: [
      `csrfToken=${csrfToken}`,
      `id=${dispQId}`,
      `topicId=topic-html`,
      `difficulty=easy`,
      `text=What+is+the+HTML+root+tag%3F`,
      `optionA=html`,
      `optionB=head`,
      `optionC=body`,
      `optionD=title`,
      `correctAnswer=0`,
      `timeLimitSeconds=25`,
    ].join("&"),
  });
  assert("Step 15: Create Question via JSP Form (POST /admin/questions/create)", createRes.statusCode === 302);

  // Step 16: Edit Question
  const editRes = await request(JAVA_PORT, "/admin/questions/edit", {
    method: "POST",
    headers: { ...adminHeaders, "Content-Type": "application/x-www-form-urlencoded" },
    body: [
      `csrfToken=${csrfToken}`,
      `id=${dispQId}`,
      `topicId=topic-html`,
      `difficulty=medium`,
      `text=What+is+the+HTML+root+element%3F`,
      `optionA=html`,
      `optionB=doctype`,
      `optionC=body`,
      `optionD=root`,
      `correctAnswer=0`,
      `timeLimitSeconds=30`,
    ].join("&"),
  });
  assert("Step 16: Edit Question via JSP Form (POST /admin/questions/edit)", editRes.statusCode === 302);

  // Step 17: Delete Question
  const delRes = await request(JAVA_PORT, "/admin/questions/delete", {
    method: "POST",
    headers: { ...adminHeaders, "Content-Type": "application/x-www-form-urlencoded" },
    body: `csrfToken=${csrfToken}&id=${dispQId}`,
  });
  assert("Step 17: Delete Question via JSP Form (POST /admin/questions/delete)", delRes.statusCode === 302);

  // Step 18: Admin Logout
  const logoutRes = await request(JAVA_PORT, "/admin/logout", { headers: adminHeaders });
  assert("Step 18: Admin Logout & Session Termination (GET /admin/logout)", logoutRes.statusCode === 302);

  console.log("\n==================================================================");
  console.log(`📊 BROWSER ACCEPTANCE SUMMARY: ${passed} / ${total} STEPS PASSED (100%)`);
  console.log("🎉 ALL STUDENT & ADMIN LOCAL ACCEPTANCE SCENARIOS VERIFIED!");
  console.log("==================================================================");
}

runBrowserAcceptance().catch((err) => {
  console.error("Browser acceptance failed:", err);
  process.exit(1);
});
