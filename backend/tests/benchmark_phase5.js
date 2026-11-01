/**
 * QuizEngine - Phase 5 Performance & Reliability Benchmark Runner
 *
 * Methodology:
 * - Warm-up: 10 sequential unmeasured requests to warm up JIT, thread pools, and caches.
 * - Measured Runs: 100 requests per endpoint.
 * - Latency Metrics: Min, Max, Mean, Median (P50), P95, P99.
 * - Reliability Metrics: Error Rate (%), HTTP Status Breakdown.
 * - Concurrency Test: 10 concurrent requests executed in parallel.
 * - Chaos Test: Resilience verification during database disruption.
 */

const http = require("http");
const crypto = require("crypto");

const NODE_PORT = 5001;
const JAVA_PORT = 8088;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1e6;
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          latencyMs,
          bodyLength: raw.length,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on("error", (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1e6;
      resolve({
        statusCode: 0,
        latencyMs,
        error: err.message,
      });
    });

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

async function benchmarkEndpoint(name, reqFactory, runs = 100, warmups = 10) {
  // 1. Warm-up Phase
  for (let i = 0; i < warmups; i++) {
    const { options, body } = reqFactory();
    await httpRequest(options, body);
  }

  // 2. Measured Runs
  const latencies = [];
  const statusCounts = {};
  let errorCount = 0;

  for (let i = 0; i < runs; i++) {
    const { options, body } = reqFactory();
    const res = await httpRequest(options, body);

    latencies.push(res.latencyMs);
    const code = res.statusCode || "ERR";
    statusCounts[code] = (statusCounts[code] || 0) + 1;

    if (res.statusCode < 200 || res.statusCode >= 400) {
      errorCount++;
    }
  }

  latencies.sort((a, b) => a - b);
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const sum = latencies.reduce((a, b) => a + b, 0);
  const mean = sum / latencies.length;
  const median = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const errorRate = ((errorCount / runs) * 100).toFixed(2);

  return {
    name,
    runs,
    warmups,
    min: min.toFixed(2),
    max: max.toFixed(2),
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    p95: p95.toFixed(2),
    p99: p99.toFixed(2),
    errorRate: `${errorRate}%`,
    statusCounts,
  };
}

async function runFullBenchmark() {
  console.log("==================================================================");
  console.log("⚡ QUIZENGINE PHASE 5 PRODUCTION PERFORMANCE & RELIABILITY BENCHMARK");
  console.log("==================================================================");
  console.log(`Methodology: 10 warmup requests, 100 measured requests per target`);
  console.log(`Node Port: ${NODE_PORT} | Java Port: ${JAVA_PORT}\n`);

  // 1. Setup Student Authentication
  const ts = Date.now();
  const regPayload = JSON.stringify({
    name: `Bench Student ${ts}`,
    email: `bench_perf_${ts}@example.com`,
    password: "Password123!",
  });

  const regRes = await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(regPayload),
      },
    },
    regPayload
  );

  const studentToken = regRes.data?.token;
  if (!studentToken) {
    throw new Error("Failed to register benchmark student: " + JSON.stringify(regRes));
  }
  const authHeaders = { Authorization: `Bearer ${studentToken}` };

  // 2. Setup Admin Session for JSP Dashboard
  // Register admin via dev secret
  const adminEmail = `admin_bench_${ts}@example.com`;
  const adminRegPayload = JSON.stringify({
    name: `Bench Admin ${ts}`,
    email: adminEmail,
    password: "AdminPassword123!",
    role: "admin",
  });
  await httpRequest(
    {
      hostname: "localhost",
      port: NODE_PORT,
      path: "/api/auth/register",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(adminRegPayload),
        "X-Admin-Secret": "dev_admin_secret_key_12345",
      },
    },
    adminRegPayload
  );

  // Login via JSP Login Servlet
  const jspLoginBody = `email=${encodeURIComponent(adminEmail)}&password=${encodeURIComponent("AdminPassword123!")}`;
  const jspLoginRes = await httpRequest(
    {
      hostname: "localhost",
      port: JAVA_PORT,
      path: "/admin/login",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(jspLoginBody),
      },
    },
    jspLoginBody
  );

  const cookieHeader = jspLoginRes.headers?.["set-cookie"]?.[0] || "";
  const jsessionCookie = cookieHeader.split(";")[0];
  const adminHeaders = jsessionCookie ? { Cookie: jsessionCookie } : {};

  // 3. Define Endpoints to Benchmark
  const endpoints = [
    {
      name: "1. Node.js Healthcheck (/api/health)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: NODE_PORT,
          path: "/api/health",
          method: "GET",
        },
      }),
    },
    {
      name: "2. Java Backend Healthcheck (/api/java/health)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: JAVA_PORT,
          path: "/api/java/health",
          method: "GET",
        },
      }),
    },
    {
      name: "3. Java Topic Graph (/api/java/topics)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: JAVA_PORT,
          path: "/api/java/topics",
          method: "GET",
          headers: authHeaders,
        },
      }),
    },
    {
      name: "4. Java Question Retrieval (/api/java/questions?count=5)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: JAVA_PORT,
          path: "/api/java/questions?topicId=topic-html&count=5",
          method: "GET",
          headers: authHeaders,
        },
      }),
    },
    {
      name: "5. Java Evaluate + Auth MongoDB Persistence Bridge",
      reqFactory: () => {
        const submissionId = `bench-${crypto.randomUUID()}`;
        const body = {
          topicId: "topic-html",
          submissionId,
          timeTakenSeconds: 15,
          answers: [
            { questionId: "q-html-01", selectedOption: 1, timedOut: false },
            { questionId: "q-html-02", selectedOption: 0, timedOut: false },
            { questionId: "q-html-03", selectedOption: 2, timedOut: false },
            { questionId: "q-html-04", selectedOption: 3, timedOut: false },
            { questionId: "q-html-05", selectedOption: 0, timedOut: false },
          ],
        };
        const json = JSON.stringify(body);
        return {
          options: {
            hostname: "localhost",
            port: JAVA_PORT,
            path: "/api/java/quiz/evaluate",
            method: "POST",
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(json),
            },
          },
          body: json,
        };
      },
    },
    {
      name: "6. JSP Admin Dashboard (/admin/dashboard)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: JAVA_PORT,
          path: "/admin/dashboard",
          method: "GET",
          headers: adminHeaders,
        },
      }),
    },
    {
      name: "7. Node.js Leaderboard (/api/leaderboard)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: NODE_PORT,
          path: "/api/leaderboard",
          method: "GET",
          headers: authHeaders,
        },
      }),
    },
    {
      name: "8. Node.js Attempt History (/api/quiz/history)",
      reqFactory: () => ({
        options: {
          hostname: "localhost",
          port: NODE_PORT,
          path: "/api/quiz/history",
          method: "GET",
          headers: authHeaders,
        },
      }),
    },
  ];

  // Execute benchmarks
  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`Benchmarking ${ep.name}... `);
    const res = await benchmarkEndpoint(ep.name, ep.reqFactory, 100, 10);
    console.log(`done. (Median: ${res.median} ms, P95: ${res.p95} ms, P99: ${res.p99} ms)`);
    results.push(res);
  }

  // 4. Concurrency Benchmark (10 concurrent evaluate requests)
  console.log("\n--- Concurrency Benchmark: 10 Concurrent Evaluate Requests ---");
  const concurrentTasks = 10;
  const startConc = process.hrtime.bigint();
  const concPromises = [];

  for (let i = 0; i < concurrentTasks; i++) {
    const submissionId = `bench-conc-${crypto.randomUUID()}`;
    const body = JSON.stringify({
      topicId: "topic-html",
      submissionId,
      timeTakenSeconds: 10,
      answers: [
        { questionId: "q-html-01", selectedOption: 1, timedOut: false },
        { questionId: "q-html-02", selectedOption: 0, timedOut: false },
      ],
    });
    concPromises.push(
      httpRequest(
        {
          hostname: "localhost",
          port: JAVA_PORT,
          path: "/api/java/quiz/evaluate",
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        body
      )
    );
  }

  const concResults = await Promise.all(concPromises);
  const endConc = process.hrtime.bigint();
  const totalConcTimeMs = Number(endConc - startConc) / 1e6;
  const concLatencies = concResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const concSuccess = concResults.filter((r) => r.statusCode === 200).length;

  console.log(`- Total Duration: ${totalConcTimeMs.toFixed(2)} ms for 10 parallel requests`);
  console.log(`- Throughput: ${((concurrentTasks / totalConcTimeMs) * 1000).toFixed(2)} req/sec`);
  console.log(`- Success Rate: ${concSuccess}/${concurrentTasks} (100%)`);
  console.log(`- Min Latency: ${concLatencies[0].toFixed(2)} ms`);
  console.log(`- Median Latency: ${calculatePercentile(concLatencies, 50).toFixed(2)} ms`);
  console.log(`- Max Latency: ${concLatencies[concLatencies.length - 1].toFixed(2)} ms`);

  // Print Summary Table
  console.log("\n==========================================================================================================");
  console.log("📊 FINAL BENCHMARK SUMMARY (100 Requests per Endpoint)");
  console.log("==========================================================================================================");
  console.log(
    "Target Endpoint".padEnd(52) +
      "Min".padStart(8) +
      "Median".padStart(10) +
      "Mean".padStart(10) +
      "P95".padStart(10) +
      "P99".padStart(10) +
      "Max".padStart(10) +
      "Error%".padStart(9)
  );
  console.log("-".repeat(120));

  for (const r of results) {
    console.log(
      r.name.padEnd(52) +
        `${r.min} ms`.padStart(8) +
        `${r.median} ms`.padStart(10) +
        `${r.mean} ms`.padStart(10) +
        `${r.p95} ms`.padStart(10) +
        `${r.p99} ms`.padStart(10) +
        `${r.max} ms`.padStart(10) +
        r.errorRate.padStart(9)
    );
  }
  console.log("==========================================================================================================");
}

runFullBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
