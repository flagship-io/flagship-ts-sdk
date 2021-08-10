export interface IHttpOptions {
    body?: any;
    headers?: Record<string, string>;
    timeout?: number;
}
export interface IHttpResponse {
    status: number;
    headers?: Record<string, string>;
    body: any;
}
export interface IHttpClient {
    postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
    getAsync(url: string, options?: IHttpOptions): Promise<IHttpResponse>;
}
