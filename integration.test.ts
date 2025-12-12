import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Freebox, FreeboxRegister } from "./src/index.js";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => server.close());

describe("Freebox integration with mocked Freebox OS", () => {
  test("register resolves after authorization is granted", async () => {
    vi.useFakeTimers();
    const trackId = 42;

    server.use(
      http.get("https://mafreebox.freebox.fr/api_version", () =>
        HttpResponse.json({
          success: true,
          result: {
            api_domain: "r42bhm9p.fbxos.fr",
            https_port: 35023,
            api_base_url: "/api/",
            api_version: "7.1",
          },
        }),
      ),
      http.post("https://mafreebox.freebox.fr/api/v7/login/authorize", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.app_id).toBe("fbx.integration.test");
        expect(body.device_name).toBe("NodeJS");

        return HttpResponse.json({
          success: true,
          result: { app_token: "app-token-123", track_id: trackId },
        });
      }),
    );

    let statusChecks = 0;
    server.use(
      http.get("https://mafreebox.freebox.fr/api/v7/login/authorize/:trackId", ({ params }) => {
        statusChecks += 1;
        expect(params.trackId).toBe(String(trackId));

        if (statusChecks === 1) {
          return HttpResponse.json({ success: true, result: { status: "pending" } });
        }

        return HttpResponse.json({ success: true, result: { status: "granted" } });
      }),
    );

    const freeboxRegister = new FreeboxRegister({
      app_id: "fbx.integration.test",
      app_name: "integration-test",
    });

    const registerPromise = freeboxRegister.register({ silent: true });

    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(registerPromise).resolves.toEqual({
      app_token: "app-token-123",
      app_id: "fbx.integration.test",
      api_domain: "r42bhm9p.fbxos.fr",
      https_port: 35023,
      api_base_url: "/api/",
      api_version: "7.1",
    });
  });

  test("request retries with a refreshed session when the Freebox expires a token", async () => {
    const baseApiUrl = "https://r42bhm9p.fbxos.fr:35023/api/v7";
    const sessionTokens = ["session-token-initial", "session-token-rotated"];
    let sessionCallCount = 0;
    let wifiCallCount = 0;

    server.use(
      http.post(`${baseApiUrl}/login/session`, async ({ request }) => {
        sessionCallCount += 1;
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.app_id).toBe("fbx.integration.test");

        const token =
          sessionTokens[Math.min(sessionCallCount - 1, sessionTokens.length - 1)] ??
          "session-token-rotated";

        return HttpResponse.json({
          success: true,
          result: { session_token: token, permissions: { settings: true } },
        });
      }),
      http.get(`${baseApiUrl}/wifi/config`, ({ request }) => {
        wifiCallCount += 1;
        const authHeader = request.headers.get("X-Fbx-App-Auth");

        if (wifiCallCount === 1) {
          expect(authHeader).toBe(sessionTokens[0]);
          return HttpResponse.json(
            {
              success: false,
              error_code: "auth_required",
              result: { challenge: "renew-me" },
            },
            { status: 403 },
          );
        }

        expect(authHeader).toBe(sessionTokens[1]);
        return HttpResponse.json({
          success: true,
          result: { wifi_state: "on" },
        });
      }),
    );

    const freebox = new Freebox({
      app_token: "super-secret-app-token",
      app_id: "fbx.integration.test",
      api_domain: "r42bhm9p.fbxos.fr",
      https_port: 35023,
      api_base_url: "/api/",
      api_version: "7.0",
    });

    await freebox.login("initial-challenge");
    const response = await freebox.request({ method: "GET", url: "wifi/config" });

    expect(response.data).toEqual({
      success: true,
      result: { wifi_state: "on" },
    });
    expect(sessionCallCount).toBe(2);
    expect(wifiCallCount).toBe(2);
  });
});
