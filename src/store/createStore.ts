import "../common/init.js";
import { createStore } from "./service/storeService.js";
import { insertStoreData } from "./service/storeDataService.js";
import { parseArgs } from "../utils/argParser.js";

type Options = {
  displayName?: string;
};

async function main() {
  const args = parseArgs<Options>(process.argv.slice(2), {
    flags: ["--displayName"],
  });

  console.log(`===== 스토어 생성 시작 =====`);

  const createdStore = await createStore(args.displayName);
  await insertStoreData(createdStore);

  console.log(
    `===== 스토어 생성 완료: ${createdStore.name}(${createdStore.displayName}) =====`
  );
}

main().catch((err) => {
  console.error("스토어 생성 중 오류 발생: ", err);
  process.exit(1);
});
