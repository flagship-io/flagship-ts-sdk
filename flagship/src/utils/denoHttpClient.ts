import { IHttpOptions, IHttpClient, IHttpResponse } from "./httpClient.ts";

export class DenoHttpClient implements IHttpClient {
  public postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      fetch(url, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(options.body),
      })
        .then(async (response) => {
          if (response.ok) {
            const applicationType = response.headers.get("Content-Type");
            if (applicationType == "application/json") {
              resolve({
                status: response.status,
                body: await response.json(),
              });
              return;
            }
          }
          resolve({ status: response.status, body: await response.text() });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
