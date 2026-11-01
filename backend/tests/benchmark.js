const http = require("http");

function measure(path, method = "GET", body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const isJava = path.startsWith("/api/java") || path.startsWith("/admin");
    const port = isJava ? 8088 : 5001;

    const start = process.hrtime.bigint();
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
      },
      (res) => {
        let d = "";
        res.on("data", (chunk) => (d += chunk));
        res.on("end", () => {
          const end = process.hrtime.bigint();
          const ms = Number(end - start) / 1e6;
          resolve({ status: res.statusCode, timeMs: ms, bodyLength: d.length });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runBenchmarks() {
  console.log("⚡ QuizEngine Latency & Performance Benchmarks (Sample size: 5 runs per endpoint)");

  // 1. Authenticate user
  const authRes = await measure("/api/auth/register", "POST", {
    name: "Bench User",
    email: `bench_${Date.now()}@example.com`,
    password: "Password123!",
  });

  const loginRes = await measure("/api/auth/login", "POST", {
    email: "student_1@example.com",
    password: "Password123!",
  });

  // Let's get an auth token
  const authPayload = JSON.stringify({ email: `bench_${Date.now()}@example.com`, name: "B", password: "Password123!" });
  const regDirect = await new Promise((res) => {
    const r = http.request({ hostname: "localhost", port: 5001, path: "/api/auth/register", method: "POST", headers: { "Content-Type": "application/json" } }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
    });
    r.write(authPayload); r.end();
  });
  const token = regDirect.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  async function bench(name, fn) {
    const times = [];
    for (let i = 0; i < 5; i++) {
      const res = await fn();
      times.push(res.timeMs);
    }
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const min = Math.min(...times).toFixed(2);
    const max = Math.max(...times).toFixed(2);
    console.log(`- ${name.padEnd(35)}: Avg: ${avg.padStart(6)} ms | Min: ${min.padStart(6)} ms | Max: ${max.padStart(6)} ms`);
  }

  await bench("Node /api/health", () => measure("/api/health"));
  await bench("Java /api/java/health", () => measure("/api/java/health"));
  await bench("Java Topic Graph (/api/java/topics)", () => measure("/api/java/topics", "GET", null, authHeaders));
  await bench("Java Fetch Questions (5 count)", () => measure("/api/java/questions?topicId=topic-html&count=5", "GET", null, authHeaders));
  await bench("Java Quiz Evaluate + Mongo Bridge", () =>
    measure(
      "/api/java/quiz/evaluate",
      "POST",
      {
        topicId: "topic-html",
        answers: [
          { questionId: "q-html-01", selectedOption: 0 },
          { questionId: "q-html-02", selectedOption: 1 },
          { questionId: "q-html-03", selectedOption: 2 },
        ],
        timeSpentSeconds: 20,
      },
      authHeaders
    )
  );
  await bench("Node Global Leaderboard", () => measure("/api/leaderboard", "GET", null, authHeaders));
  await bench("Node Attempt History", () => measure("/api/quiz/history", "GET", null, authHeaders));
}

runBenchmarks().catch(console.error);
