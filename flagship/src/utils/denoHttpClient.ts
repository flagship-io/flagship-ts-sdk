import { IHttpClient, IHttpOptions, IHttpResponse } from "./httpClient.ts";

export class DenoHttpClient implements IHttpClient {
  public postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      const c = new AbortController();
      const id = setTimeout(() => c.abort(), options.timeout);
      fetch(url, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(options.body),
        signal: c.signal,
      })
        .then(async (response) => {
          const applicationType = response.headers.get("Content-Type");
          const checkJson = applicationType === "application/json";
          const body = checkJson
            ? await response.json()
            : await response.text();

          if (!response.ok) {
            reject({
              status: response.status,
              body: body || response.statusText,
            });
            return;
          }

          resolve({
            status: response.status,
            body: body,
          });
        })
        .catch((error) => {
          reject(error.message);
        })
        .finally(() => {
          clearInterval(id);
        });
    });
  }
}
