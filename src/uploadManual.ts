import { GoogleAIFileManager } from "@google/generative-ai/server";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";

config();

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const uploadsJsonPath = path.resolve(process.cwd(), "data/uploads.json");

type StoredUpload = {
  name: string;
  uri: string;
  displayName?: string;
  mimeType?: string;
  uploadedAt: string;
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

async function waitForActive(
  fileManager: GoogleAIFileManager,
  fileName: string
) {
  const maxAttempts = 30;
  const intervalMs = 2000;
  let lastState = "PENDING";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const current = await fileManager.getFile(fileName);
    lastState = (current as { state?: string }).state ?? lastState;

    if ((current as { state?: string }).state === "ACTIVE") {
      return current;
    }

    if ((current as { state?: string }).state === "FAILED") {
      throw new Error(
        `파일 처리 실패: ${
          (current as { error?: { message?: string } }).error?.message ??
          "unknown"
        }`
      );
    }

    console.log(
      `파일 인덱싱 중... (시도 ${attempt}/${maxAttempts}, 상태: ${lastState})`
    );
    await sleep(intervalMs);
  }

  throw new Error(`파일이 활성화되지 않았습니다. 마지막 상태: ${lastState}`);
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

  const fileManager = new GoogleAIFileManager(API_KEY);

  console.log(`업로드 시작: ${displayName} (${filePath})`);
  const uploadResponse = await fileManager.uploadFile(filePath, {
    displayName,
    mimeType,
  });

  const uploadedFile = (
    uploadResponse as {
      file?: { name: string; uri: string; mimeType?: string };
    }
  ).file;
  if (!uploadedFile) {
    console.error("업로드 응답에 파일 정보가 없습니다.");
    process.exit(1);
  }

  const activeFile = await waitForActive(fileManager, uploadedFile.name);

  const stored: StoredUpload = {
    name: uploadedFile.name,
    uri: (activeFile as { uri?: string }).uri ?? uploadedFile.uri,
    displayName,
    mimeType: uploadedFile.mimeType ?? mimeType,
    uploadedAt: new Date().toISOString(),
  };

  await saveUploadMetadata(stored);

  console.log("업로드 및 인덱싱 완료!");
  console.log(`파일 URI: ${stored.uri}`);
  console.log(
    "URI는 data/uploads.json 에 저장되며, 질문 스크립트 실행 시 최신 업로드가 기본으로 사용됩니다."
  );
}

main().catch((err) => {
  console.error("업로드 중 오류가 발생했습니다:", err);
  process.exit(1);
});
