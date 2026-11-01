/**
 * QuizEngine - Phase 4 End-to-End Full-Stack Integration Verification Suite
 * Tests student workflow, Java-to-Node attempt persistence, prerequisite enforcement,
 * leaderboard aggregation, JSP Admin Portal, and security boundaries.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

const NODE_BASE = process.env.NODE_API_URL || "http://localhost:5001/api";
const JAVA_BASE = process.env.JAVA_BASE_URL || "http://localhost:8088";

// Load authoritative answer key from XML for dynamic test evaluation
const xmlPath = path.resolve(__dirname, "../../java-backend/data/questions.xml");
const answerKey = {};
if (fs.existsSync(xmlPath)) {
  const xml = fs.readFileSync(xmlPath, "utf8");
  const matches = xml.matchAll(/<question id="([^"]+)"[\s\S]*?<correctAnswer>(\d+)<\/correctAnswer>/g);
  for (const m of matches) {
    answerKey[m[1]] = parseInt(m[2], 10);
  }
}

function request(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: options.headers || {},
    };

    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json,
        });
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("🧪 QUIZENGINE PHASE 4 - FULL STACK E2E TEST SUITE");
  console.log("=================================================");
  console.log(`Node Backend Base: ${NODE_BASE}`);
  console.log(`Java Backend Base: ${JAVA_BASE}`);
  console.log("-------------------------------------------------");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks
    console.log("\n--- Section 1: Service Health Checks ---");
    const nodeHealth = await request(`${NODE_BASE}/health`);
    assert(nodeHealth.status === 200 && nodeHealth.json?.status === "ok", "Node.js backend /api/health responds with status: ok");

    const javaHealth = await request(`${JAVA_BASE}/api/java/health`);
    assert(
      javaHealth.status === 200 && javaHealth.json?.datastoreHealthy === true && javaHealth.json?.questionCount >= 60,
      `Java backend /api/java/health responds ok with ${javaHealth.json?.questionCount} questions in XML datastore`
    );

    // 2. Student Registration & Authentication
    console.log("\n--- Section 2: Student Registration & Authentication ---");
    const testSuffix = Date.now();
    const studentUser = {
      name: `Student ${testSuffix}`,
      email: `student_${testSuffix}@example.com`,
      password: "Password123!",
    };

    const regRes = await request(`${NODE_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: studentUser,
    });
    assert(regRes.status === 201 && regRes.json?.token, "Student registers successfully via Node.js auth and receives JWT");
    const studentToken = regRes.json.token;

    // 3. Topic Graph & Prerequisite Status
    console.log("\n--- Section 3: Topic Graph & Prerequisite Verification ---");
    const topicsRes = await request(`${JAVA_BASE}/api/java/topics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const topicList = topicsRes.json?.topics || (Array.isArray(topicsRes.json) ? topicsRes.json : []);
    assert(topicsRes.status === 200 && Array.isArray(topicList) && topicList.length > 0, "Java /api/java/topics returns topic graph");

    const htmlTopic = topicList.find((t) => (t.id || t._id) === "topic-html");
    const daaTopic = topicList.find((t) => (t.id || t._id) === "topic-daa");
    const javaTopic = topicList.find((t) => (t.id || t._id) === "topic-java");

    assert(htmlTopic?.unlocked === true, "topic-html has no prerequisites and is unlocked (unlocked=true)");
    assert(daaTopic?.unlocked === true, "topic-daa has no prerequisites and is unlocked (unlocked=true)");
    assert(javaTopic?.unlocked === false, "topic-java has unmet prerequisite topic-daa and is locked (unlocked=false)");

    // 4. Prerequisite Security Enforcement
    console.log("\n--- Section 4: Prerequisite Security Enforcement ---");
    const bypassRes = await request(`${JAVA_BASE}/api/java/questions?topicId=topic-java&count=5`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      bypassRes.status === 403,
      `Direct request to locked topic /api/java/questions?topicId=topic-java is blocked with HTTP 403 (Status: ${bypassRes.status})`
    );

    // 5. Question Retrieval & Leakage Protection
    console.log("\n--- Section 5: Question Retrieval & Leakage Protection ---");
    const qRes = await request(`${JAVA_BASE}/api/java/questions?topicId=topic-html&count=5`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const qList = qRes.json?.questions || qRes.json || [];
    assert(qRes.status === 200 && qList.length === 5, "Java /api/java/questions returns requested count (5 questions) for topic-html");

    const leakedAnswer = qList.some((q) => q.correctAnswer !== undefined || q.explanation !== undefined);
    assert(!leakedAnswer, "Returned question objects strictly strip correctAnswer and explanation before submission");

    // 6. Quiz Evaluation & Persistence Bridge
    console.log("\n--- Section 6: Quiz Evaluation & Persistence Bridge ---");
    const submittedAnswers = qList.map((q, idx) => ({
      questionId: q.id || q._id,
      selectedOption: idx === 0 ? 3 : 0, // answer options
    }));

    const evalRes = await request(`${JAVA_BASE}/api/java/quiz/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: {
        topicId: "topic-html",
        answers: submittedAnswers,
        timeSpentSeconds: 42,
      },
    });

    assert(evalRes.status === 200, "Java /api/java/quiz/evaluate processes evaluation successfully");
    assert(evalRes.json?.attemptId !== undefined, `Attempt persistence bridge returned MongoDB attemptId: ${evalRes.json?.attemptId}`);
    assert(evalRes.json?.newTotalScore !== undefined, `Bridge returned updated user totalScore: ${evalRes.json?.newTotalScore}`);
    assert(Array.isArray(evalRes.json?.answers), "Detailed per-question breakdown returned with answers array");

    // 7. MongoDB Persistence & History Verification
    console.log("\n--- Section 7: MongoDB Persistence & History Verification ---");
    const historyRes = await request(`${NODE_BASE}/quiz/history`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const attemptsList = historyRes.json?.attempts || historyRes.json?.history || [];
    assert(historyRes.status === 200 && Array.isArray(attemptsList), "Node.js /api/quiz/history returns attempts array");
    const latestAttempt = attemptsList[0];
    assert(
      latestAttempt && latestAttempt.score === evalRes.json?.score,
      `Latest attempt in MongoDB matches evaluated score (${latestAttempt?.score} == ${evalRes.json?.score})`
    );

    const meRes = await request(`${NODE_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      meRes.status === 200 && meRes.json?.user?.totalScore === evalRes.json?.newTotalScore,
      `User profile in MongoDB reflects updated totalScore (${meRes.json?.user?.totalScore})`
    );

    // 8. Prerequisite Completion & Unlocking Flow
    console.log("\n--- Section 8: Prerequisite Completion & Unlocking Flow ---");
    // Fetch and complete topic-daa with correct answers from answer key
    const daaQRes = await request(`${JAVA_BASE}/api/java/questions?topicId=topic-daa&count=3`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const daaList = daaQRes.json?.questions || daaQRes.json || [];
    const daaAnswers = daaList.map((q) => {
      const qId = q.id || q._id;
      return {
        questionId: qId,
        selectedOption: answerKey[qId] !== undefined ? answerKey[qId] : 1,
      };
    });

    const daaEval = await request(`${JAVA_BASE}/api/java/quiz/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: {
        topicId: "topic-daa",
        answers: daaAnswers,
        timeSpentSeconds: 30,
      },
    });
    assert(daaEval.status === 200 && daaEval.json?.passed === true, "topic-daa completed and recorded with passing score");

    // Now check if topic-java is unlocked
    const unlockedCheck = await request(`${JAVA_BASE}/api/java/questions?topicId=topic-java&count=3`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const unlockedList = unlockedCheck.json?.questions || unlockedCheck.json || [];
    assert(
      unlockedCheck.status === 200 && unlockedList.length === 3,
      "topic-java is now unlocked and accessible after completing topic-daa!"
    );

    // 9. Leaderboard Verification
    console.log("\n--- Section 9: Leaderboard Verification ---");
    const lbRes = await request(`${NODE_BASE}/leaderboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(lbRes.status === 200 && Array.isArray(lbRes.json?.leaderboard), "Node.js /api/leaderboard returns ranked users");
    const studentEntry = lbRes.json?.leaderboard.find((entry) => entry.name === studentUser.name);
    assert(
      studentEntry !== undefined && studentEntry.totalScore > 0,
      `Student appears on leaderboard with totalScore: ${studentEntry?.totalScore}`
    );

    // 10. Security Boundary Tests
    console.log("\n--- Section 10: Security Boundary Tests ---");
    const noAuthRes = await request(`${JAVA_BASE}/api/java/quiz/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { topicId: "topic-html", answers: [] },
    });
    assert(noAuthRes.status === 401, "Java evaluation endpoint rejects request without Authorization header (401)");

    const invalidAuthRes = await request(`${JAVA_BASE}/api/java/quiz/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.fake.token",
      },
      body: { topicId: "topic-html", answers: [] },
    });
    assert(invalidAuthRes.status === 401, "Java evaluation endpoint rejects forged JWT signature (401)");

    const unauthAdmin = await request(`${JAVA_BASE}/admin/dashboard`);
    assert(
      unauthAdmin.status === 302 || unauthAdmin.status === 401,
      `Direct access to /admin/dashboard without admin session is rejected (Status: ${unauthAdmin.status})`
    );

    // 11. Admin Workflow (JSP Portal)
    console.log("\n--- Section 11: JSP Admin Portal Workflow ---");
    // Register an admin user via Node.js directly with admin authorization header
    const adminEmail = `admin_${testSuffix}@example.com`;
    await request(`${NODE_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": "quizengine-dev-admin-secret",
      },
      body: {
        name: `Admin ${testSuffix}`,
        email: adminEmail,
        password: "AdminPassword123!",
        role: "admin",
      },
    });

    // Login admin to get valid admin token
    const adminLoginRes = await request(`${NODE_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { email: adminEmail, password: "AdminPassword123!" },
    });

    const adminToken = adminLoginRes.json?.token;
    assert(adminToken !== undefined, "Admin account registered and logged in via Node.js");

    // Login to JSP Admin via token
    const jspLoginRes = await request(`${JAVA_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `authMethod=token&adminToken=${encodeURIComponent(adminToken)}`,
    });

    const setCookie = jspLoginRes.headers["set-cookie"];
    const sessionCookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie ? setCookie.split(";")[0] : "";
    assert(
      (jspLoginRes.status === 302 || jspLoginRes.status === 200) && sessionCookie.includes("QE_ADMIN_SESSION"),
      `JSP Admin login succeeded and established session: ${sessionCookie.substring(0, 30)}...`
    );

    // Access Admin Dashboard with session
    const dashRes = await request(`${JAVA_BASE}/admin/dashboard`, {
      headers: { Cookie: sessionCookie },
    });
    assert(
      dashRes.status === 200 && dashRes.body.includes("Dashboard") && dashRes.body.includes("Total Questions"),
      "JSP Admin Dashboard renders successfully with XML statistics"
    );

    // Fetch create question form to extract CSRF token
    const createPageRes = await request(`${JAVA_BASE}/admin/questions/create`, {
      headers: { Cookie: sessionCookie },
    });
    const csrfMatch = createPageRes.body.match(/name="csrfToken"\s+value="([a-f0-9\-]+)"/i);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    assert(csrfToken !== null, `Extracted CSRF token from JSP view: ${csrfToken}`);

    // Create a new question via JSP Admin form
    const newQId = `q-test-${testSuffix}`;
    const createBody = [
      `csrfToken=${csrfToken}`,
      `id=${newQId}`,
      `topicId=topic-html`,
      `difficulty=easy`,
      `text=What+does+HTML+stand+for%3F`,
      `optionA=HyperText+Markup+Language`,
      `optionB=High+Text+Machine+Language`,
      `optionC=Hyper+Tool+Markup+Language`,
      `optionD=Home+Tool+Modern+Language`,
      `correctAnswer=0`,
      `timeLimitSeconds=25`,
      `explanation=HTML+stands+for+HyperText+Markup+Language`,
    ].join("&");

    const createRes = await request(`${JAVA_BASE}/admin/questions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
      },
      body: createBody,
    });
    assert(createRes.status === 302, "Admin successfully creates a question via JSP form (302 Redirect to question list)");

    // Verify question is now present in question list (using search query)
    const qListRes = await request(`${JAVA_BASE}/admin/questions?search=${encodeURIComponent(newQId)}`, {
      headers: { Cookie: sessionCookie },
    });
    assert(qListRes.body.includes(newQId), `Created question ${newQId} appears in JSP Admin question table`);

    // Clean up: delete test question
    const deleteRes = await request(`${JAVA_BASE}/admin/questions/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
      },
      body: `csrfToken=${csrfToken}&id=${newQId}`,
    });
    assert(deleteRes.status === 302, `Admin successfully deletes test question ${newQId} via JSP form`);

    // Logout
    const logoutRes = await request(`${JAVA_BASE}/admin/logout`, {
      headers: { Cookie: sessionCookie },
    });
    assert(logoutRes.status === 302, "Admin logged out successfully (302 Redirect to login)");

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  }

  console.log("\n=================================================");
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("=================================================");

  if (failed === 0) {
    console.log("🎉 ALL PHASE 4 END-TO-END INTEGRATION TESTS PASSED!");
    process.exit(0);
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runTests();
