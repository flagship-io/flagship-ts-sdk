export interface IHttpOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface IHttpResponse {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export interface IHttpClient {
  postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}