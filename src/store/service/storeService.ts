import genAI from "../../common/genAIGenerator.js";
import { FileSearchStore } from "@google/genai";

const createStore = async (
  displayName = "default-store"
): Promise<FileSearchStore> => {
  const createdStore = await genAI.fileSearchStores.create({
    config: { displayName },
  });
  return createdStore;
};

const deleteStore = async (storeName: string) => {
  await genAI.fileSearchStores.delete({
    name: storeName,
    config: { force: true },
  });
};

const listStore = async (): Promise<FileSearchStore[]> => {
  const stores = await genAI.fileSearchStores?.list();
  if (stores && stores.pageLength > 0) {
    return stores.page;
  }
  return [];
};

export { createStore, deleteStore, listStore };
