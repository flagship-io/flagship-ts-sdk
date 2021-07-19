import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient';
export declare class HttpClient implements IHttpClient {
    postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
}
