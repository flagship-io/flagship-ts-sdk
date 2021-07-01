import { IHttpOptions, IHttpClient, IHttpResponse } from "./httpClient.ts";

export class DenoHttpClient implements IHttpClient {
  public async postAsync(
    url: string,
    options: IHttpOptions
  ): Promise<IHttpResponse> {
    const response = await fetch(url, {
      method: "POST",
      headers: options.header,
      body: JSON.stringify(options.body),
    });
    if (response.ok) {
      return { status: response.status, body: response.json };
    }
    console.log(url, options, response);

    throw new Error(response.statusText);
  }
}
