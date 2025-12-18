import "../common/init.js";
import fs from "node:fs/promises";
import path from "node:path";
import { getActiveStoreName } from "../store/service/storeDataService.js";
import { uploadFile } from "./service/fileService.js";
import { insertFileData } from "./service/fileDataService.js";
import { parseArgs } from "../utils/argParser.js";

const storeNameEnv = process.env.GEMINI_FILE_SEARCH_STORE;

type Options = {
  filePath?: string;
  displayName?: string;
};

async function main() {
  const args = parseArgs<Options>(process.argv.slice(2), {
    firstPositional: "filePath",
    flags: ["--displayName"],
  });

  if (!args.filePath) {
    console.error(
      "사용 방법이 올바르지 않습니다.",
      "\n사용법: npm run upload:file  -- <파일 경로> [--displayName <표시 이름>]"
    );
    process.exit(1);
  }

  const storeName = storeNameEnv ?? (await getActiveStoreName());
  if (!storeName) {
    console.error(
      "파일 검색 스토어 이름을 찾을 수 없습니다.",
      "\nGEMINI_FILE_SEARCH_STORE 환경 변수 또는 data/store.json 을 확인하세요.",
      "\n필요하면 npm run create:store 를 먼저 실행하세요."
    );
    process.exit(1);
  }

  const filePath = path.resolve(args.filePath);
  try {
    await fs.access(filePath);
  } catch {
    console.error(`파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }

  console.log("===== 파일 업로드 시작 =====");

  const uploadedFile = await uploadFile(filePath, storeName, args.displayName);
  if (uploadedFile) {
    await insertFileData({
      storeName: uploadedFile.parent,
      fileName: uploadedFile.documentName,
      displayName: uploadedFile.displayName as string,
    });
  } else {
    console.error("업로드에 실패했습니다.");
    process.exit(1);
  }

  console.log(
    `===== 파일 업로드 완료: ${uploadedFile.documentName}(${uploadedFile.displayName}) =====`
  );
}

main().catch((err) => {
  console.error("파일 업로드 중 오류 발생:", err);
  process.exit(1);
});
