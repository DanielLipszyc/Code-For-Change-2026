import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3100";
const stressTest = __ENV.STRESS_TEST === "true";

export const options = {
  stages: stressTest
    ? [
        { duration: "10s", target: 20 },
        { duration: "15s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "10s", target: 0 },
      ]
    : [
        { duration: "5s", target: 5 },
        { duration: "15s", target: 15 },
        { duration: "5s", target: 0 },
      ],
  thresholds: {
    http_req_failed: [stressTest ? "rate<0.05" : "rate<0.01"],
    http_req_duration: [stressTest ? "p(95)<8000" : "p(95)<2000"],
  },
};

export default function () {
  const home = http.get(`${baseUrl}/`);
  check(home, { "home page responds": (response) => response.status === 200 });

  const dashboard = http.get(`${baseUrl}/api/dashboard?demo=1`);
  check(dashboard, {
    "demo dashboard responds": (response) => response.status === 200,
    "demo dashboard has expected user": (response) => response.json("user.id") === "demo-user",
  });

  sleep(1);
}