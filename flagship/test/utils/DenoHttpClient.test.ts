import { assertEquals, stub } from "../../deps.ts";
import { DenoHttpClient } from "../../src/utils/denoHttpClient.ts";
import { IHttpOptions } from "../../src/utils/httpClient.ts";

Deno.test("test denoHttpClient", () => {
  const fetch = stub(globalThis, "fetch");
  const denoHttpClient = new DenoHttpClient();
  const url = "https://localhost";
  const timeout = 2000;
  const options: IHttpOptions = {
    timeout: timeout,
    headers: {
      "x-api-toke": "token",
    },
    body: {
      ct: 20,
    },
  };

  const responseJson = { isVip: true };
  const response = new Promise<Response>((resolve) => {
    const httpResponse = new Response(JSON.stringify(responseJson), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    resolve(httpResponse);
  });
  const response2 = new Promise<Response>((resolve) => {
    const httpResponse = new Response("Text", {
      headers: {
        "Content-Type": "application/text",
      },
    });
    resolve(httpResponse);
  });
  const response3 = new Promise<Response>((resolve) => {
    const httpResponse = new Response("error", {
      status: 400,

      headers: {
        "Content-Type": "application/text",
      },
    });
    resolve(httpResponse);
  });

  const response4 = new Promise<Response>((resolve) => {
    const httpResponse = new Response(null, {
      status: 400,
      statusText: "error",
      headers: {
        "Content-Type": "application/text",
      },
    });
    resolve(httpResponse);
  });

  const response5 = new Promise<Response>((_, reject) => {
    reject(new Error("error"));
  });

  fetch.returns = [response, response2, response3, response4, response5];

  denoHttpClient.postAsync(url, options).then((response) => {
    assertEquals(response.body, responseJson);
  });

  denoHttpClient.postAsync(url, options).then((response) => {
    assertEquals(response.body, "Text");
  });
  denoHttpClient.postAsync(url, options).catch((error) => {
    assertEquals(error.status, 400);
    assertEquals(error.body, "error");
  });

  denoHttpClient.postAsync(url, options).catch((error) => {
    assertEquals(error.status, 400);
    assertEquals(error.body, "error");
  });

  denoHttpClient.postAsync(url, options).catch((error) => {
    assertEquals(error, "error");
  });

  assertEquals(fetch.calls.length, 5);
});
