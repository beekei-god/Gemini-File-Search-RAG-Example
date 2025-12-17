import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";
import { GoogleGenAI } from "@google/genai";

config();

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const storeNameEnv = process.env.GEMINI_FILE_SEARCH_STORE;
const uploadsJsonPath = path.resolve(process.cwd(), "data/uploads.json");
const storeJsonPath = path.resolve(process.cwd(), "data/store.json");
const getAI = new GoogleGenAI({ apiKey: API_KEY });

type StoredUpload = {
  name: string;
  uri: string;
  displayName?: string;
  mimeType?: string;
  uploadedAt: string;
  storeName?: string;
  fileName?: string;
};

if (!API_KEY) {
  console.error("GEMINI_API_KEY 환경 변수를 설정해주세요.");
  process.exit(1);
}

const filePathArg = process.argv[2];
const displayNameArg = process.argv[3];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUploadsFile() {
  try {
    await fs.access(uploadsJsonPath);
  } catch {
    await fs.mkdir(path.dirname(uploadsJsonPath), { recursive: true });
    await fs.writeFile(
      uploadsJsonPath,
      JSON.stringify({ uploads: [] }, null, 2),
      "utf-8"
    );
  }
}

async function readUploads(): Promise<StoredUpload[]> {
  await ensureUploadsFile();
  const raw = await fs.readFile(uploadsJsonPath, "utf-8");
  const parsed = JSON.parse(raw) as { uploads?: StoredUpload[] };
  return parsed.uploads ?? [];
}

async function writeUploads(uploads: StoredUpload[]) {
  await fs.writeFile(
    uploadsJsonPath,
    JSON.stringify({ uploads }, null, 2),
    "utf-8"
  );
}

async function readStoreName(): Promise<string | null> {
  if (storeNameEnv) return storeNameEnv;

  try {
    const raw = await fs.readFile(storeJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { storeName?: string };
    return parsed.storeName ?? null;
  } catch {
    return null;
  }
}

async function ensureStoreName(): Promise<string> {
  const existing = await readStoreName();
  if (existing) return existing;

  const created = await getAI.fileSearchStores?.create({
    config: { displayName: "car-manual-store" },
  });
  const storeName = (created as { name?: string })?.name;
  if (!storeName) {
    throw new Error("스토어 생성에 실패했습니다.");
  }

  await fs.mkdir(path.dirname(storeJsonPath), { recursive: true });
  await fs.writeFile(
    storeJsonPath,
    JSON.stringify({ storeName }, null, 2),
    "utf-8"
  );
  return storeName;
}

async function waitOperation(operation: any) {
  const maxAttempts = 30;
  const intervalMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (operation?.done) return operation;
    operation = await getAI.operations.get({ operation });

    console.log(`파일 인덱싱 중... (시도 ${attempt}/${maxAttempts})`);
    await sleep(intervalMs);
  }

  throw new Error("파일 인덱싱이 시간 내 완료되지 않았습니다.");
}

async function saveUploadMetadata(entry: StoredUpload) {
  const uploads = await readUploads();
  uploads.push(entry);
  await writeUploads(uploads);
}

async function main() {
  if (!filePathArg) {
    console.error("사용법: npm run upload -- <파일 경로> [표시 이름]");
    process.exit(1);
  }

  const storeName = await ensureStoreName();
  if (!storeName) {
    console.error(
      "파일 검색 스토어 이름을 찾을 수 없습니다. GEMINI_FILE_SEARCH_STORE 환경 변수 또는 data/store.json 을 확인하세요. 필요하면 npm run create:store 를 먼저 실행하세요."
    );
    process.exit(1);
  }

  const filePath = path.resolve(filePathArg);
  try {
    await fs.access(filePath);
  } catch {
    console.error(`파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }

  const mimeType = (
    mime.lookup(filePath) || "application/octet-stream"
  ).toString();
  const displayName = displayNameArg ?? path.basename(filePath);

  console.log(`업로드 시작: ${displayName} (${filePath})`);
  const uploadOperation = await getAI.fileSearchStores?.uploadToFileSearchStore(
    {
      file: filePath,
      fileSearchStoreName: storeName,
      config: {
        displayName,
        mimeType,
        chunkingConfig: {
          whiteSpaceConfig: {
            maxTokensPerChunk: 200,
            maxOverlapTokens: 20,
          },
        },
      },
    }
  );

  const completed = await waitOperation(uploadOperation);
  const uploadedFile =
    (completed as any)?.response?.file ??
    (completed as any)?.result?.file ??
    (completed as any)?.response ??
    null;

  const stored: StoredUpload = {
    name: uploadedFile?.name ?? "",
    fileName: uploadedFile?.name ?? "",
    uri: uploadedFile?.uri ?? "",
    displayName,
    mimeType: uploadedFile?.mimeType ?? mimeType,
    uploadedAt: new Date().toISOString(),
    storeName,
  };

  await saveUploadMetadata(stored);

  console.log("업로드 및 인덱싱 완료!");
  console.log(`파일 URI: ${stored.uri}`);
  console.log(
    "URI와 스토어 이름은 data/uploads.json 에 저장되며, 질문 스크립트 실행 시 최신 업로드 스토어가 기본으로 사용됩니다."
  );
}

main().catch((err) => {
  console.error("업로드 중 오류가 발생했습니다:", err);
  process.exit(1);
});
