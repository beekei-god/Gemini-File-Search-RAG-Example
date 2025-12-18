import fs from "node:fs/promises";
import path from "node:path";
import { FileSearchStore } from "@google/genai";

const storeDataJsonPath = path.resolve(process.cwd(), "data/stores.json");

type StoreData = {
  name: string;
  displayName: string;
  createTime: number;
  active: boolean;
};

const ensureStoreDataFile = async () => {
  try {
    await fs.access(storeDataJsonPath);
  } catch {
    await fs.mkdir(path.dirname(storeDataJsonPath), { recursive: true });
    await writeStoreData([]);
  }
};

const readStoreData = async (): Promise<StoreData[]> => {
  await ensureStoreDataFile();
  const raw = await fs.readFile(storeDataJsonPath, "utf-8");
  const parsed = JSON.parse(raw) as {
    stores?: StoreData[];
  };
  return parsed.stores ?? [];
};

const writeStoreData = async (storeData: StoreData[]): Promise<void> => {
  await fs.writeFile(
    storeDataJsonPath,
    JSON.stringify({ stores: storeData }, null, 2),
    "utf-8"
  );
};

const insertStoreData = async (store: FileSearchStore): Promise<void> => {
  const storeData = await readStoreData();
  const active = storeData.length == 0 ? true : false;
  storeData.push({
    name: store.name ?? "",
    displayName: store.displayName ?? "",
    createTime: store.createTime ? new Date(store.createTime).valueOf() : 0,
    active: active,
  });
  await writeStoreData(storeData);
};

const deleteStoreData = async (storeName: string) => {
  let storeData = await readStoreData();
  storeData = storeData.filter((store) => store.name !== storeName);
  await writeStoreData(storeData);
};

const getActiveStoreName = async (): Promise<string | null> => {
  const storeData = await readStoreData();
  return storeData.find((store) => store.active)?.name ?? null;
};

const setActiveStoreData = async (storeName: string) => {
  let storeData = await readStoreData();
  storeData = storeData.map((store) => ({
    ...store,
    active: store.name === storeName,
  }));
  await writeStoreData(storeData);
};

export {
  insertStoreData,
  deleteStoreData,
  getActiveStoreName,
  setActiveStoreData,
};
