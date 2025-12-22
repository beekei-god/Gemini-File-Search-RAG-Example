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

/**
 * 파일에서 MIME 타입을 추출합니다.
 * Gemini API 문서를 참고하여 지원되는 MIME 타입을 정확히 추출합니다.
 *
 * 우선순위:
 * 1. 제공된 mimeType (서버에서 감지한 경우)
 * 2. 원본 파일명 기반 추출
 * 3. 파일 경로 기반 추출
 * 4. 기본값: application/octet-stream
 *
 * @param filePath - 파일 경로
 * @param originalFileName - 원본 파일명 (확장자 포함)
 * @param providedMimeType - 서버에서 제공한 MIME 타입 (선택)
 * @returns MIME 타입 문자열
 */
const extractMimeType = (
  filePath: string,
  originalFileName?: string,
  providedMimeType?: string
): string => {
  // 1. 서버에서 제공한 MIME 타입이 있으면 우선 사용
  if (providedMimeType && providedMimeType !== "application/octet-stream") {
    return providedMimeType;
  }

  // 2. 원본 파일명이 있으면 그것을 사용하여 MIME 타입 추출
  if (originalFileName) {
    const mimeFromOriginal = mime.lookup(originalFileName);
    if (mimeFromOriginal) {
      return mimeFromOriginal;
    }
  }

  // 3. 파일 경로에서 MIME 타입 추출
  const mimeFromPath = mime.lookup(filePath);
  if (mimeFromPath) {
    return mimeFromPath;
  }

  // 4. 기본값 반환
  return "application/octet-stream";
};

const uploadFile = async (
  filePath: string,
  storeName: string,
  displayName?: string,
  originalFileName?: string,
  providedMimeType?: string
): Promise<UploadedFile> => {
  const mimeType = extractMimeType(
    filePath,
    originalFileName,
    providedMimeType
  );
  const displayNameToUse =
    displayName ?? originalFileName ?? path.basename(filePath);

  console.log("파일 업로드 정보:");
  console.log("- 파일 경로:", filePath);
  console.log("- 원본 파일명:", originalFileName);
  console.log("- 표시 이름:", displayNameToUse);
  console.log("- MIME 타입:", mimeType);
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
