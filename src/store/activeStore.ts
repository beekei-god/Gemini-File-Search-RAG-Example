import "../common/init.js";
import { setActiveStoreData } from "./service/storeDataService.js";
import { parseArgs } from "../utils/argParser.js";

type Options = {
  storeName?: string;
};

async function main() {
  const args = parseArgs<Options>(process.argv.slice(2), {
    firstPositional: "storeName",
  });

  if (!args.storeName) {
    console.error(
      "사용 방법이 올바르지 않습니다.",
      "\n사용법: npm run active:store -- <스토어 이름>"
    );
    process.exit(1);
  }

  console.log(`===== 스토어 활성화 시작: ${args.storeName} =====`);

  await setActiveStoreData(args.storeName);

  console.log(`===== 스토어 활성화 완료: ${args.storeName} =====`);
}

main().catch((err) => {
  console.error("스토어 활성화 중 오류 발생: ", err);
  process.exit(1);
});
