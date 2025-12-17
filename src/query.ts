import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

config();

type StoredUpload = {
  name: string;
  uri: string;
  displayName?: string;
  mimeType?: string;
  uploadedAt: string;
  storeName?: string;
  fileName?: string;
};

type CliOptions = {
  question?: string;
  fileUri?: string;
  mimeType?: string;
  model?: string;
  store?: string;
};

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const uploadsJsonPath = path.resolve(process.cwd(), "data/uploads.json");
const storeJsonPath = path.resolve(process.cwd(), "data/store.json");

if (!API_KEY) {
  console.error("GEMINI_API_KEY 환경 변수를 설정해주세요.");
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  const parsed: CliOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--file-uri" && argv[i + 1]) {
      parsed.fileUri = argv[++i];
      continue;
    }

    if (arg === "--mime" && argv[i + 1]) {
      parsed.mimeType = argv[++i];
      continue;
    }

    if (arg === "--model" && argv[i + 1]) {
      parsed.model = argv[++i];
      continue;
    }

    if (arg === "--store" && argv[i + 1]) {
      parsed.store = argv[++i];
      continue;
    }

    if (!parsed.question) {
      parsed.question = arg;
    } else {
      parsed.question = `${parsed.question} ${arg}`;
    }
  }

  return parsed;
}

async function loadLatestUpload(): Promise<StoredUpload | null> {
  try {
    const raw = await fs.readFile(uploadsJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { uploads?: StoredUpload[] };
    const uploads = parsed.uploads ?? [];
    return uploads.length > 0 ? uploads[uploads.length - 1] : null;
  } catch (err) {
    console.warn(
      "업로드 기록을 읽지 못했습니다. --file-uri 옵션을 사용해주세요.",
      err
    );
    return null;
  }
}

async function loadStoreName(cliStore?: string): Promise<string | null> {
  if (cliStore) return cliStore;
  if (process.env.GEMINI_FILE_SEARCH_STORE)
    return process.env.GEMINI_FILE_SEARCH_STORE;

  try {
    const raw = await fs.readFile(storeJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { storeName?: string };
    return parsed.storeName ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.question) {
    console.error(
      '사용법: npm run ask -- "<질문>" [--file-uri <URI>] [--mime <MIME>] [--model <모델명>]'
    );
    process.exit(1);
  }

  const latestUpload = await loadLatestUpload();
  const storeName = await loadStoreName(args.store ?? latestUpload?.storeName);
  const fileUri =
    args.fileUri ?? process.env.GEMINI_FILE_URI ?? latestUpload?.uri;
  const mimeType =
    args.mimeType ?? latestUpload?.mimeType ?? "application/octet-stream";

  const genAI = new GoogleGenAI({ apiKey: API_KEY });

  const request = storeName
    ? {
        contents: [
          {
            role: "user",
            parts: [{ text: args.question }],
          },
        ],
      }
    : {
        contents: [
          {
            role: "user",
            parts: [
              { text: args.question },
              { fileData: { fileUri, mimeType } },
            ],
          },
        ],
      };

  if (!storeName && !fileUri) {
    console.error(
      "참조할 스토어/파일 정보를 찾을 수 없습니다. --store 또는 --file-uri (또는 GEMINI_FILE_SEARCH_STORE / GEMINI_FILE_URI)를 지정하세요."
    );
    process.exit(1);
  }

  const result = await genAI.models.generateContent({
    model: args.model ?? "gemini-2.5-flash",
    contents: request.contents as any,
    config: {
      temperature: 0.2,
      tools: (storeName
        ? [{ fileSearch: { fileSearchStoreNames: [storeName] } }]
        : [{ fileSearch: {} }]) as any,
    },
  });

  console.log("=== 답변 ===");
  console.log(result.text ?? "(응답 없음)");

  const citations = (result as any)?.candidates?.[0]?.groundingMetadata
    ?.citationMetadata?.citations as { uri?: string }[] | undefined;
  if (citations && citations.length > 0) {
    console.log("\n참조된 파일 URI:");
    citations.forEach((c: { uri?: string }) =>
      console.log(`- ${c.uri ?? "알 수 없는 URI"}`)
    );
  }
}

main().catch((err) => {
  console.error("질문 처리 중 오류가 발생했습니다:", err);
  process.exit(1);
});
