import "../common/init.js";
import { listStore } from "./service/storeService.js";
import { getActiveStoreName } from "./service/storeDataService.js";

async function main() {
  console.log("===== 스토어 목록 조회 시작 =====");

  const stores = await listStore();
  if (stores.length > 0) {
    const activeStoreName = await getActiveStoreName();
    console.log(`총 ${stores.length}개의 스토어가 있습니다.`);
    console.log(`현재 활성화된 스토어는 ${activeStoreName} 입니다.`);
    stores.forEach((store, index) => {
      console.log(
        `${index + 1}. ${store.name ?? ""}${
          store.displayName ? `(${store.displayName})` : ""
        }\n - activeDocumentsCount: ${
          store.activeDocumentsCount ?? 0
        }\n - sizeBytes: ${store.sizeBytes ?? 0}`
      );
    });
  } else {
    console.log("생성된 스토어가 없습니다.");
  }

  console.log("===== 스토어 목록 조회 완료 =====");
}

main().catch((err) => {
  console.error("스토어 목록 조회 중 오류 발생: ", err);
  process.exit(1);
});
