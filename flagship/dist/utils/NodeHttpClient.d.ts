import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient';
export declare class HttpClient implements IHttpClient {
    private getResponse;
    getAsync(url: string, options?: IHttpOptions): Promise<IHttpResponse>;
    postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}
