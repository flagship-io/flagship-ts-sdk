export interface IHttpOptions {
  // deno-lint-ignore no-explicit-any
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface IHttpResponse {
  status: number;
  // deno-lint-ignore no-explicit-any
  body: any;
}

export interface IHttpClient {
  postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}
