import fs from "node:fs/promises";
import path from "node:path";

const fileDataJsonPath = path.resolve(process.cwd(), "data/files.json");

type FileHistory = {
  storeName: string;
  fileName: string;
  displayName: string;
};

const ensureFileDataFile = async () => {
  try {
    await fs.access(fileDataJsonPath);
  } catch {
    await fs.mkdir(path.dirname(fileDataJsonPath), { recursive: true });
    await writeFileData([]);
  }
};

const writeFileData = async (fileHistory: FileHistory[]): Promise<void> => {
  await fs.writeFile(
    fileDataJsonPath,
    JSON.stringify({ files: fileHistory }, null, 2),
    "utf-8"
  );
};

const readFileData = async (): Promise<FileHistory[]> => {
  await ensureFileDataFile();
  const raw = await fs.readFile(fileDataJsonPath, "utf-8");
  const parsed = JSON.parse(raw) as {
    files?: FileHistory[];
  };
  return parsed.files ?? [];
};

const insertFileData = async (file: FileHistory): Promise<void> => {
  const fileData = await readFileData();
  fileData.push(file);
  await writeFileData(fileData);
};

const deleteFileDataOfStore = async (storeName: string) => {
  let fileData = await readFileData();
  fileData = fileData.filter((file) => file.storeName !== storeName);
  await writeFileData(fileData);
};

export { insertFileData, deleteFileDataOfStore };
