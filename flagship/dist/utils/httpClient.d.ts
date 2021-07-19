export interface IHttpOptions {
    body?: any;
    headers?: Record<string, string>;
    timeout?: number;
}
export interface IHttpResponse {
    status: number;
    body: any;
}
export interface IHttpClient {
    postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}
