export interface IHttpOptions {
  body?: any;
  header?: Record<string, string>;
}

export interface IHttpResponse {
  status: number;
  body: any;
}

export interface IHttpClient {
  postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}
