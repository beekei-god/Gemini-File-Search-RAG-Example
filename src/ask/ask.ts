import "../common/init.js";
import { getActiveStoreName } from "../store/service/storeDataService.js";
import { ask } from "./service/askService.js";
import { parseArgs } from "../utils/argParser.js";

type Options = {
  question?: string;
  store?: string;
  model?: string;
};

async function main() {
  const args = parseArgs<Options>(process.argv.slice(2), {
    flags: ["--store", "--model"],
    restPositional: "question",
  });

  if (!args.question) {
    console.error(
      "사용 방법이 올바르지 않습니다.",
      "\n사용법: npm run ask -- <질문> [--store <스토어 이름>] [--model <모델명>]"
    );
    process.exit(1);
  }

  const storeName = args.store ?? (await getActiveStoreName());
  if (!storeName) {
    console.error(
      "파일 검색 스토어 이름을 찾을 수 없습니다.",
      "\nGEMINI_FILE_SEARCH_STORE 환경 변수 또는 data/store.json 을 확인하세요.",
      "\n필요하면 npm run create:store 를 먼저 실행하세요."
    );
    process.exit(1);
  }

  console.log(`===== 질문 시작 =====`);
  console.log(`- 스토어: ${storeName}`);
  console.log(`- 질문: ${args.question}`);

  const result = await ask(args.model, storeName, args.question);

  console.log(`- 답변: ${result.text ?? "(응답 없음)"}`);
  console.log(`===== 답변 완료 =====`);
}

main().catch((err) => {
  console.error("질문 처리 중 오류 발생: ", err);
  process.exit(1);
});
