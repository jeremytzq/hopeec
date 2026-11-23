// Minimal structural types for Vercel's Node serverless function signature -
// avoids depending on the full @vercel/node package (which pulls in ~100
// transitive dev-tooling packages, several with known vulnerabilities, just
// for these two type names) for what amounts to duck-typed req/res objects.
export interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}
