import { Failure, VertexClient } from "@vertexvis/api-client-node";
import { AxiosResponse } from "axios";
import { createWriteStream } from "fs";
import type { NextApiResponse } from "next";

import { Config } from "./env";

export async function makeCall<T>(
  apiCall: (client: VertexClient) => Promise<AxiosResponse<T>>
): Promise<T | Failure> {
  try {
    const c = await getClient();
    return (await apiCall(c)).data;
  } catch (error) {
    return (
      error.vertexError?.res ?? {
        errors: [{ status: "500", title: "Unknown error from Vertex API." }],
      }
    );
  }
}

let Client: VertexClient | undefined;
export async function getClient(): Promise<VertexClient> {
  if (Client != null) return Client;

  Client = await VertexClient.build({
    basePath:
      Config.vertexEnv === "platprod"
        ? "https://platform.vertexvis.com"
        : `https://platform.${Config.vertexEnv}.vertexvis.io`,
    client: {
      id: process.env.VERTEX_CLIENT_ID ?? "",
      secret: process.env.VERTEX_CLIENT_SECRET ?? "",
    },
  });

  return Client;
}

export function errorRes(
  message: string,
  res: NextApiResponse<{ message: string }>
): Promise<void> {
  return Promise.resolve(res.status(400).json({ message }));
}

export function createFile(
  stream: NodeJS.ReadableStream,
  path: string
): Promise<void> {
  return new Promise((resolve) => {
    const ws = createWriteStream(path);
    stream.pipe(ws);
    ws.on("finish", resolve);
  });
}
