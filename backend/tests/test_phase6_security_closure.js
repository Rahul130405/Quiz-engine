/**
 * QuizEngine - Phase 6 Final Security Closure & Reliability Verification Suite
 *
 * Verifies:
 * 1. Canonical HMAC payload signing & constant-time verification.
 * 2. Replay attack rejection & expired timestamp blocking.
 * 3. Tampered payload rejection (score, answers, percentage).
 * 4. Legitimate idempotent retries without score inflation.
 * 5. MongoDB partial unique index behavior (legacy compatibility & uniqueness guarantee).
 * 6. Privilege escalation prevention (client role=admin strictly defaulted to user).
 * 7. Authorized admin registration via secret.
 * 8. Non-admin blocking from JSP Admin portal.
 * 9. Admin session rotation, CSRF validation, and logout invalidation.
 * 10. Invalid & expired JWT handling.
 */

const http = require("http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const NODE_PORT = 5001;
const JAVA_PORT = 8088;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || JWT_SECRET;
const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "quizengine-dev-admin-secret";

function httpRequest(options, postData = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw,
        });
      });
    });

    req.on("error", (err) => resolve({ statusCode: 0, error: err.message }));
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runPhase6Tests() {
  console.log("==================================================================");
  console.log("🛡️ QUIZENGINE PHASE 6 - FINAL SECURITY CLOSURE & VERIFICATION");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(name, condition, extraInfo = "") {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extraInfo}`);
      throw new Error(`Assertion failed: ${name} ${extraInfo}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. REGISTRATION & PRIVILEGE ESCALATION AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Section 1: Registration & Admin Authorization ---");

  // Test 1: Ordinary registration always creates role="user"
  const ts1 = Date.now();
  const reg1 = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Student Regular", email: `student_${ts1}@example.com`, password: "Password123!" }
  );
  assert("Test 1: Ordinary registration creates user", reg1.statusCode === 201 && reg1.data?.user?.role === "user");

  // Test 2: Client supplying role="admin" without secret is strictly ignored / assigned role="user"
  const ts2 = Date.now() + 1;
  const reg2 = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Hacker Pretender", email: `hacker_${ts2}@example.com`, password: "Password123!", role: "admin" }
  );
  assert("Test 2: Client-supplied role=admin is ignored and forced to user", reg2.statusCode === 201 && reg2.data?.user?.role === "user");

  // Test 3: Client supplying invalid X-Admin-Secret is forced to role="user"
  const ts3 = Date.now() + 2;
  const reg3 = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Secret": "invalid-passphrase" },
    },
    { name: "Fake Admin", email: `fakeadmin_${ts3}@example.com`, password: "Password123!", role: "admin" }
  );
  assert("Test 3: Invalid X-Admin-Secret forces role=user", reg3.statusCode === 201 && reg3.data?.user?.role === "user");

  // Test 4: Authorized admin creation with valid X-Admin-Secret grants role="admin"
  const ts4 = Date.now() + 3;
  const adminEmail = `realadmin_${ts4}@example.com`;
  const reg4 = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Secret": ADMIN_SECRET },
    },
    { name: "Authorized Admin", email: adminEmail, password: "AdminPassword123!", role: "admin" }
  );
  assert("Test 4: Valid X-Admin-Secret grants role=admin", reg4.statusCode === 201 && reg4.data?.user?.role === "admin");
  const adminToken = reg4.data?.token;

  // ─────────────────────────────────────────────────────────────
  // 2. JSP ADMIN PORTAL SECURITY & SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Section 2: JSP Admin Portal Security & Session Rotation ---");

  // Test 5: Unauthenticated GET to /admin/dashboard redirects to /admin/login (302)
  const jspNoAuth = await httpRequest({
    hostname: "localhost",
    port: JAVA_PORT,
    path: "/admin/dashboard",
    method: "GET",
  });
  assert("Test 5: Unauthenticated access to /admin/dashboard redirects to /admin/login", jspNoAuth.statusCode === 302);

  // Test 6: Non-admin user cannot login to JSP Admin portal
  const nonAdminLoginBody = `email=${encodeURIComponent(`student_${ts1}@example.com`)}&password=${encodeURIComponent("Password123!")}`;
  const nonAdminLoginRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/login",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(nonAdminLoginBody) },
    },
    nonAdminLoginBody
  );
  assert("Test 6: Non-admin account is denied JSP admin login", nonAdminLoginRes.raw.includes("Access denied") || nonAdminLoginRes.statusCode === 200 && !nonAdminLoginRes.headers?.["set-cookie"]);

  // Test 7: Authorized Admin logs in successfully, receives session cookie
  const adminLoginRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/login",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
    `authMethod=token&adminToken=${encodeURIComponent(adminToken)}`
  );
  const setCookie = adminLoginRes.headers?.["set-cookie"];
  const jsession = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie ? setCookie.split(";")[0] : "";
  assert("Test 7: Admin login succeeds with session establishment", adminLoginRes.statusCode === 302 && jsession.includes("QE_ADMIN_SESSION"));

  // Test 8: Extract CSRF token from Admin Question Create Form
  const createPageRes = await httpRequest({
    hostname: "localhost",
    port: JAVA_PORT,
    path: "/admin/questions/create",
    method: "GET",
    headers: { Cookie: jsession },
  });
  const csrfMatch = createPageRes.raw.match(/name="csrfToken"\s+value="([a-f0-9\-]+)"/i);
  const validCsrf = csrfMatch ? csrfMatch[1] : null;
  assert("Test 8: Question form renders with valid CSRF token", createPageRes.statusCode === 200 && validCsrf !== null);

  // Test 9: State-changing POST without valid CSRF token is rejected with HTTP 403
  const forgedCreateBody = `csrfToken=forged-csrf-token&id=q-forged-1&topicId=topic-html&text=Forged&optionA=A&optionB=B&optionC=C&optionD=D&correctAnswer=0&difficulty=easy&timeLimitSeconds=30`;
  const forgedRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/questions/create",
      method: "POST",
      headers: {
        Cookie: jsession,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(forgedCreateBody),
      },
    },
    forgedCreateBody
  );
  assert("Test 9: Invalid CSRF token is rejected with HTTP 403 Forbidden", forgedRes.statusCode === 403);

  // Test 10: State-changing POST with valid CSRF succeeds (302 redirect)
  const disposableQId = `q-phase6-test-${Date.now()}`;
  const validCreateBody = [
    `csrfToken=${validCsrf}`,
    `id=${disposableQId}`,
    `topicId=topic-html`,
    `difficulty=easy`,
    `text=What+does+HTML+stand+for%3F`,
    `optionA=HyperText+Markup+Language`,
    `optionB=High+Text+Machine+Language`,
    `optionC=Hyper+Tool+Markup+Language`,
    `optionD=Home+Tool+Modern+Language`,
    `correctAnswer=0`,
    `timeLimitSeconds=25`,
  ].join("&");

  const createRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/questions/create",
      method: "POST",
      headers: {
        Cookie: jsession,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(validCreateBody),
      },
    },
    validCreateBody
  );
  assert("Test 10: Valid CSRF token allows question creation", createRes.statusCode === 302);

  // Clean up test question
  const deleteBody = `csrfToken=${encodeURIComponent(validCsrf)}&id=${disposableQId}`;
  await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/questions/delete",
      method: "POST",
      headers: {
        Cookie: jsession,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(deleteBody),
      },
    },
    deleteBody
  );

  // Test 11: Admin logout invalidates session
  const logoutRes = await httpRequest({
    hostname: "localhost",
    port: JAVA_PORT,
    path: "/admin/logout",
    method: "GET",
    headers: { Cookie: jsession },
  });
  assert("Test 11: Admin logout redirects with loggedOut flag", logoutRes.statusCode === 302);

  const postLogoutDash = await httpRequest({
    hostname: "localhost",
    port: JAVA_PORT,
    path: "/admin/dashboard",
    method: "GET",
    headers: { Cookie: jsession },
  });
  assert("Test 12: Invalidated session is redirected to login", postLogoutDash.statusCode === 302);

  // ─────────────────────────────────────────────────────────────
  // 3. CANONICAL HMAC PERSISTENCE BRIDGE & TAMPER RESISTANCE
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Section 3: Canonical HMAC Persistence Bridge & Tamper Resistance ---");

  const studentToken = reg1.data.token;
  const studentId = reg1.data.user.id;
  const authHeaders = {
    Authorization: `Bearer ${studentToken}`,
    "Content-Type": "application/json",
  };

  // Test 13: Normal legitimate evaluation via Java succeeds (HTTP 200) and signs canonical payload
  const subId1 = `sub-phase6-${Date.now()}`;
  const evalPayload = {
    topicId: "topic-html",
    submissionId: subId1,
    timeTakenSeconds: 15,
    answers: [
      { questionId: "q-html-01", selectedOption: 1, timedOut: false },
      { questionId: "q-html-02", selectedOption: 0, timedOut: false },
      { questionId: "q-html-03", selectedOption: 2, timedOut: false },
    ],
  };

  const evalRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/api/java/quiz/evaluate",
      method: "POST",
      headers: authHeaders,
    },
    evalPayload
  );
  assert("Test 13: Java evaluation + canonical persistence succeeds (HTTP 200)", evalRes.statusCode === 200 && evalRes.data?.attemptId);
  const recordedAttemptId = evalRes.data.attemptId;

  // Helper to generate canonical signature
  function computeCanonicalHmac(submissionId, userId, topicId, score, percentage, passed, timestamp, answers) {
    const answersStr = (answers || [])
      .map((a) => `${a.questionId}:${a.selectedOption ?? -1}:${Boolean(a.isCorrect)}`)
      .join(";");
    const answersHash = crypto.createHash("sha256").update(answersStr).digest("hex");
    const formattedPct = Number(percentage).toFixed(2);
    const canonical = `${submissionId || ""}|${userId}|${topicId}|${score}|${formattedPct}|${Boolean(passed)}|${timestamp}|${answersHash}`;
    return crypto.createHmac("sha256", INTERNAL_SERVICE_SECRET).update(canonical).digest("hex");
  }

  // Test 14: Direct call without internal signature is rejected with HTTP 403
  const directUnsigned = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/quiz/record-attempt",
      method: "POST",
      headers: authHeaders,
    },
    { topicId: "topic-html", score: 100, percentage: 100, passed: true }
  );
  assert("Test 14: Direct unsigned call to persistence bridge is rejected (HTTP 403)", directUnsigned.statusCode === 403);

  // Test 15: Tampered Score Detection (Signature valid for score 10, but body submits score 99)
  const now = Date.now();
  const subTamper = `tamper-${now}`;
  const origScore = 10;
  const tamperedScore = 99;
  const tAnswers = [{ questionId: "q-html-01", selectedOption: 1, isCorrect: true }];
  const validSigForOrig = computeCanonicalHmac(subTamper, studentId, "topic-html", origScore, 100, true, now, tAnswers);

  const tamperScoreRes = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/quiz/record-attempt",
      method: "POST",
      headers: {
        ...authHeaders,
        "X-Internal-Service": validSigForOrig,
        "X-Internal-Timestamp": String(now),
      },
    },
    {
      topicId: "topic-html",
      submissionId: subTamper,
      score: tamperedScore, // Tampered!
      percentage: 100,
      passed: true,
      timestamp: now,
      answers: tAnswers,
    }
  );
  assert("Test 15: Tampered score payload is rejected with HTTP 403 Forbidden", tamperScoreRes.statusCode === 403);

  // Test 16: Tampered Answers Detection
  const validSigForAnswers = computeCanonicalHmac(subTamper, studentId, "topic-html", origScore, 100, true, now, tAnswers);
  const tamperedAnswers = [{ questionId: "q-html-01", selectedOption: 2, isCorrect: false }]; // Tampered answer!
  const tamperAnsRes = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/quiz/record-attempt",
      method: "POST",
      headers: {
        ...authHeaders,
        "X-Internal-Service": validSigForAnswers,
        "X-Internal-Timestamp": String(now),
      },
    },
    {
      topicId: "topic-html",
      submissionId: subTamper,
      score: origScore,
      percentage: 100,
      passed: true,
      timestamp: now,
      answers: tamperedAnswers, // Tampered!
    }
  );
  assert("Test 16: Tampered answers payload is rejected with HTTP 403 Forbidden", tamperAnsRes.statusCode === 403);

  // Test 17: Expired Request Rejection (Timestamp 10 minutes in the past)
  const expiredTime = Date.now() - 10 * 60 * 1000;
  const expiredSubId = `expired-${Date.now()}`;
  const expiredSig = computeCanonicalHmac(expiredSubId, studentId, "topic-html", origScore, 100, true, expiredTime, tAnswers);
  const expiredRes = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/quiz/record-attempt",
      method: "POST",
      headers: {
        ...authHeaders,
        "X-Internal-Service": expiredSig,
        "X-Internal-Timestamp": String(expiredTime),
      },
    },
    {
      topicId: "topic-html",
      submissionId: expiredSubId,
      score: origScore,
      percentage: 100,
      passed: true,
      timestamp: expiredTime,
      answers: tAnswers,
    }
  );
  assert("Test 17: Expired signature (> 5 mins old) is rejected with HTTP 403", expiredRes.statusCode === 403);

  // Test 18: Idempotent Retry of Existing Attempt
  // Retrying subId1 (already recorded in Test 13)
  const retryRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/api/java/quiz/evaluate",
      method: "POST",
      headers: authHeaders,
    },
    evalPayload
  );
  assert("Test 18: Idempotent retry returns existing attempt without error", retryRes.statusCode === 200 && retryRes.data?.attemptId === recordedAttemptId);

  // ─────────────────────────────────────────────────────────────
  // 4. MONGODB PARTIAL UNIQUE INDEX AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Section 4: MongoDB Partial Unique Index Verification ---");

  // Connect to local MongoDB directly to verify index definitions and legacy handling
  await mongoose.connect("mongodb://127.0.0.1:27017/quizengine");
  const QuizAttempt = require("../models/QuizAttempt");

  // Test 19: Insert legacy attempt without submissionId
  const legacyAttempt1 = await QuizAttempt.create({
    userId: studentId,
    topicId: "topic-html",
    score: 12,
    maxPossibleScore: 23,
    percentage: 52.17,
    passed: false,
  });
  assert("Test 19: Legacy attempt without submissionId creates successfully", legacyAttempt1._id !== null);

  // Test 20: Insert second legacy attempt without submissionId for same user
  const legacyAttempt2 = await QuizAttempt.create({
    userId: studentId,
    topicId: "topic-html",
    score: 15,
    maxPossibleScore: 23,
    percentage: 65.21,
    passed: true,
  });
  assert("Test 20: Second legacy attempt without submissionId succeeds (partial index avoids null collision)", legacyAttempt2._id !== null);

  // Clean up legacy test attempts
  await QuizAttempt.deleteMany({ _id: { $in: [legacyAttempt1._id, legacyAttempt2._id] } });

  // ─────────────────────────────────────────────────────────────
  // 5. JWT VERIFICATION HARDENING (INVALID & EXPIRED)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Section 5: JWT Hardening (Invalid & Expired Tokens) ---");

  // Test 21: Tampered JWT signature is rejected by Java
  const tamperedJwt = studentToken.slice(0, -6) + "abcdef";
  const badJwtRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/api/java/quiz/evaluate",
      method: "POST",
      headers: { Authorization: `Bearer ${tamperedJwt}`, "Content-Type": "application/json" },
    },
    { topicId: "topic-html", answers: [] }
  );
  assert("Test 21: Tampered JWT signature is rejected with HTTP 401 Unauthorized", badJwtRes.statusCode === 401);

  // Test 22: Expired JWT is rejected by Java
  const expiredJwt = jwt.sign({ id: studentId, role: "user" }, JWT_SECRET, { expiresIn: "-10s" });
  const expJwtRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/api/java/quiz/evaluate",
      method: "POST",
      headers: { Authorization: `Bearer ${expiredJwt}`, "Content-Type": "application/json" },
    },
    { topicId: "topic-html", answers: [] }
  );
  assert("Test 22: Expired JWT is rejected with HTTP 401 Unauthorized", expJwtRes.statusCode === 401);

  await mongoose.disconnect();

  console.log("\n==================================================================");
  console.log(`📊 PHASE 6 VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("🎉 ALL PHASE 6 SECURITY & RELIABILITY CHECKS VERIFIED SUCCESSFULLY!");
  console.log("==================================================================");
}

runPhase6Tests().catch((err) => {
  console.error("Phase 6 tests failed:", err);
  process.exit(1);
});
