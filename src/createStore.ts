import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

config();

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const displayNameArg = process.argv[2] ?? "car-manual-store";
const storeJsonPath = path.resolve(process.cwd(), "data/store.json");

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

if (!API_KEY) {
  console.error("GEMINI_API_KEY 환경 변수를 설정해주세요.");
  process.exit(1);
}

async function saveStoreName(storeName: string) {
  await fs.mkdir(path.dirname(storeJsonPath), { recursive: true });
  await fs.writeFile(storeJsonPath, JSON.stringify({ storeName }, null, 2), "utf-8");
}

async function createStore(displayName: string) {
  const res = await fetch(`${BASE_URL}/fileSearchStores?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`스토어 생성 실패: ${res.status} ${res.statusText} - ${text}`);
  }

  const body = (await res.json()) as { name?: string };
  if (!body.name) {
    throw new Error("스토어 이름을 응답에서 찾을 수 없습니다.");
  }

  return body.name;
}

async function main() {
  console.log(`파일 검색 스토어 생성: ${displayNameArg}`);
  const storeName = await createStore(displayNameArg);
  await saveStoreName(storeName);
  console.log(`생성 완료: ${storeName}`);
  console.log("data/store.json 에 스토어 이름을 저장했습니다.");
}

main().catch((err) => {
  console.error("스토어 생성 중 오류:", err);
  process.exit(1);
});

