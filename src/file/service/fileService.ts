import genAI from "../../common/genAIGenerator.js";
import path from "node:path";
import mime from "mime-types";

type UploadedFile = {
  parent: string;
  documentName: string;
  displayName: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitOperation = async (operation: any): Promise<any> => {
  const maxAttempts = 60;
  const intervalMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (operation?.done) return operation;
    operation = await genAI.operations.get({ operation });

    console.log(`파일 인덱싱 중... (시도 ${attempt}/${maxAttempts})`);
    await sleep(intervalMs);
  }

  throw new Error("파일 인덱싱이 시간 내 완료되지 않았습니다.");
};

const uploadFile = async (
  filePath: string,
  storeName: string,
  displayName?: string
): Promise<UploadedFile> => {
  const mimeType = (
    mime.lookup(filePath) || "application/octet-stream"
  ).toString();
  const displayNameToUse = displayName ?? path.basename(filePath);
  const uploadOperation = await genAI.fileSearchStores.uploadToFileSearchStore({
    file: filePath,
    fileSearchStoreName: storeName,
    config: {
      displayName: displayNameToUse,
      mimeType,
      chunkingConfig: {
        whiteSpaceConfig: {
          maxTokensPerChunk: 200,
          maxOverlapTokens: 20,
        },
      },
    },
  });

  const completed = await waitOperation(uploadOperation);
  console.log(`파일 인덱싱 완료: ${JSON.stringify(completed)}`);

  const uploadedFile = completed?.response ?? null;
  return { ...uploadedFile, displayName: displayNameToUse } as UploadedFile;
};

export { uploadFile };
