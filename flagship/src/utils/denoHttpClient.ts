import { IHttpOptions, IHttpClient, IHttpResponse } from "./httpClient.ts";

export class DenoHttpClient implements IHttpClient {
  public async postAsync(
    url: string,
    options: IHttpOptions
  ): Promise<IHttpResponse> {
    const response = await fetch(url, {
      method: "POST",
      headers: options.headers,
      body: JSON.stringify(options.body),
    });
    if (response.ok) {
      return { status: response.status, body: response.json };
    }
    throw new Error(response.statusText);
  }
}
