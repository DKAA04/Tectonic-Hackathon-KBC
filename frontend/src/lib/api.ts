import type {
  AdvisorPreview,
  ConsentChange,
  Context,
  Correction,
  ErrorDetail,
} from "./types.ts";

export class ApiError extends Error {
  status: number;
  code: string;
  details: ErrorDetail[];
  constructor(
    status: number,
    code: string,
    message: string,
    details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Both adapters use this transport. Cookies stay in the browser; CSRF stays in memory.
export function createApi(fetcher: typeof fetch = fetch) {
  async function request<T>(
    path: string,
    body?: object,
    csrf?: string,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(`/api${path}`, {
        method: body === undefined ? "GET" : "POST",
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new ApiError(
        0,
        "NETWORK_ERROR",
        "The connection was interrupted. Refresh the current state before trying again; your last change may have reached the server.",
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        response.status,
        "INVALID_RESPONSE",
        "The service returned an unreadable response. Refresh to check your current state.",
      );
    }
    if (!response.ok) {
      const error = data?.error;
      throw new ApiError(
        response.status,
        error?.code || "SERVICE_ERROR",
        error?.message || "The service could not complete this request.",
        Array.isArray(error?.details) ? error.details : [],
      );
    }
    if (data?.api_version !== "1")
      throw new ApiError(
        response.status,
        "API_VERSION_MISMATCH",
        "This service uses an unsupported API version.",
      );
    return data as T;
  }
  return {
    getContext: () => request<Context>("/context"),
    startSession: () => request<Context>("/demo/session", {}),
    correct: (body: Correction, csrf: string) =>
      request<Context>("/context/correction", body, csrf),
    setConsent: (body: ConsentChange, csrf: string) =>
      request<Context>("/consent", body, csrf),
    getAdvisor: () => request<AdvisorPreview>("/advisor-preview"),
  };
}
export const api = createApi();
export const fixtureMode = Boolean(
  import.meta.env?.DEV && import.meta.env.MODE === "fixture",
);
