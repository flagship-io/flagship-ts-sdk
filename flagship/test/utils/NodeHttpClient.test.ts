import { jest, expect, it, describe } from "@jest/globals";
import { NodeHttpClient } from "../../src/utils/NodeHttpClient";
import { IHttpOptions } from "../../src/utils/httpClient";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse as R,
} from "axios";
import { Mock } from "jest-mock";

describe("test denoHttpClient", () => {
  const axiosPost: Mock<
    Promise<any>,
    [url: string, data?: any, config?: AxiosRequestConfig]
  > = jest.fn();

  axios.post = axiosPost;

  const nodeHttpClient = new NodeHttpClient();
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

  it("should ", () => {
    axiosPost.mockResolvedValue({ data: responseJson, status: 200 });
    nodeHttpClient.postAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson);
    });
  });

  it("should ", async () => {
    const error: AxiosError = {
      config: {},
      isAxiosError: true,
      toJSON: jest.fn(),
      name: "error",
      message: "error",
    };
    axiosPost.mockRejectedValue(error);
    try {
      await nodeHttpClient.postAsync(url, options);
      expect(axiosPost).toBeCalledTimes(1);
    } catch (error) {
      expect(error).toBe("error");
    }
  });
});
