import { IHttpOptions, IHttpClient, IHttpResponse } from "./httpClient.ts";

export class DenoHttpClient implements IHttpClient {
  public async postAsync(
    url: string,
    options: IHttpOptions
  ): Promise<IHttpResponse> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(options.body),
      });
      if (response.ok) {
        const applicationType = response.headers.get("Content-Type");
        if (applicationType == "application/json") {
          return { status: response.status, body: await response.json() };
        }
        return { status: response.status, body: await response.text() };
      }
      throw new Error(response.statusText);
    } catch (error) {
      throw new Error(error);
    }
  }
}
