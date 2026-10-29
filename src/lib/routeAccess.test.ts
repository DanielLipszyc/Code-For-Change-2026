import { describe, expect, it } from "vitest";
import { isLocalDemoDashboardRequest, isPublicRequest } from "./routeAccess";

const ID = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

describe("isPublicRequest", () => {
  it("lets anyone view the public pages and sign in", () => {
    for (const path of ["/", "/guide", "/map", "/sign-in", "/sign-up/verify"]) {
      expect(isPublicRequest("GET", path)).toBe(true);
    }
  });

  it("lets anyone load the offline page and the web app manifest", () => {
    expect(isPublicRequest("GET", "/~offline")).toBe(true);
    expect(isPublicRequest("GET", "/manifest.json")).toBe(true);
  });

  it("requires sign-in for the rest of the app", () => {
    for (const path of [
      "/log",
      "/submit",
      "/drafts",
      "/dashboard",
      `/submit/edit/${ID}`,
      "/about",
      "/contact",
    ]) {
      expect(isPublicRequest("GET", path)).toBe(false);
    }
  });

  it("allows only the explicit local demo dashboard request without sign-in", () => {
    const params = new URLSearchParams("demo=1");
    expect(isLocalDemoDashboardRequest("GET", "/dashboard", params, "development")).toBe(true);
    expect(isLocalDemoDashboardRequest("GET", "/dashboard", params, "production")).toBe(false);
    expect(isLocalDemoDashboardRequest("GET", "/dashboard", params, "test")).toBe(false);
    expect(isLocalDemoDashboardRequest("POST", "/dashboard", params, "development")).toBe(false);
    expect(isLocalDemoDashboardRequest("GET", "/api/dashboard", params, "development")).toBe(false);
    expect(
      isLocalDemoDashboardRequest("GET", "/dashboard", new URLSearchParams(), "development"),
    ).toBe(false);
  });

  it("lets anyone read submissions and their photos", () => {
    for (const path of [
      "/api/submissions",
      `/api/submissions/${ID}`,
      `/api/submissions/${ID}/photo`,
    ]) {
      expect(isPublicRequest("GET", path)).toBe(true);
      expect(isPublicRequest("HEAD", path)).toBe(true);
    }
  });

  it("allows anonymous submissions", () => {
    expect(isPublicRequest("POST", "/api/submissions")).toBe(true);
  });

  it("requires sign-in to change submissions", () => {
    expect(isPublicRequest("PUT", `/api/submissions/${ID}`)).toBe(false);
    expect(isPublicRequest("DELETE", `/api/submissions/${ID}`)).toBe(false);
    expect(isPublicRequest("POST", `/api/submissions/${ID}/approve`)).toBe(false);
    expect(isPublicRequest("POST", `/api/submissions/${ID}`)).toBe(false);
  });

  it("requires sign-in for the other API routes", () => {
    expect(isPublicRequest("GET", "/api/dashboard")).toBe(false);
    expect(isPublicRequest("POST", "/api/identify-plant")).toBe(false);
    expect(isPublicRequest("GET", `/api/submissions/${ID}/approve`)).toBe(false);
  });

  it("doesn't treat look-alike paths as public", () => {
    expect(isPublicRequest("GET", "/mapx")).toBe(false);
    expect(isPublicRequest("GET", "/sign-inx")).toBe(false);
    expect(isPublicRequest("GET", "/api/submissionsx")).toBe(false);
  });
});
