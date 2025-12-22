import "./common/init.js";
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import {
  listStore,
  createStore,
  deleteStore,
} from "./store/service/storeService.js";
import {
  insertStoreData,
  deleteStoreData,
  getActiveStoreName,
  setActiveStoreData,
} from "./store/service/storeDataService.js";
import { uploadFile } from "./file/service/fileService.js";
import { insertFileData } from "./file/service/fileDataService.js";
import { ask } from "./ask/service/askService.js";

const app = express();
const PORT = process.env.PORT || 3000;

// 업로드 디렉토리 생성
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// 파일 업로드를 위한 multer 설정
const upload = multer({ dest: uploadsDir });

// CORS 설정 (필요한 경우)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 스토어 목록 조회
app.get("/api/stores", async (req, res) => {
  try {
    const stores = await listStore();
    const activeStoreName = await getActiveStoreName();

    const storesWithActive = stores.map((store) => ({
      name: store.name ?? "",
      displayName: store.displayName ?? "",
      activeDocumentsCount: store.activeDocumentsCount ?? 0,
      sizeBytes: store.sizeBytes ?? 0,
      createTime: store.createTime,
      isActive: store.name === activeStoreName,
    }));

    res.json({ stores: storesWithActive, activeStoreName });
  } catch (error) {
    console.error("스토어 목록 조회 오류:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "스토어 목록 조회에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 스토어 생성
app.post("/api/stores", async (req, res) => {
  try {
    const { displayName } = req.body;
    const createdStore = await createStore(displayName || "default-store");
    await insertStoreData(createdStore);

    res.json({
      success: true,
      store: {
        name: createdStore.name ?? "",
        displayName: createdStore.displayName ?? "",
        activeDocumentsCount: createdStore.activeDocumentsCount ?? 0,
        sizeBytes: createdStore.sizeBytes ?? 0,
        createTime: createdStore.createTime,
      },
    });
  } catch (error) {
    console.error("스토어 생성 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "스토어 생성에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 스토어 활성화
app.put("/api/stores/:storeName/active", async (req, res) => {
  try {
    const { storeName } = req.params;
    const decodedStoreName = decodeURIComponent(storeName);

    await setActiveStoreData(decodedStoreName);

    res.json({
      success: true,
      message: "스토어가 활성화되었습니다.",
      activeStoreName: decodedStoreName,
    });
  } catch (error) {
    console.error("스토어 활성화 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "스토어 활성화에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 스토어 삭제
app.delete("/api/stores/:storeName", async (req, res) => {
  try {
    const { storeName } = req.params;
    const decodedStoreName = decodeURIComponent(storeName);

    await deleteStore(decodedStoreName);
    await deleteStoreData(decodedStoreName);

    // 파일 데이터도 삭제 (fileDataService의 deleteFileDataOfStore 사용)
    const { deleteFileDataOfStore } = await import(
      "./file/service/fileDataService.js"
    );
    await deleteFileDataOfStore(decodedStoreName);

    res.json({ success: true, message: "스토어가 삭제되었습니다." });
  } catch (error) {
    console.error("스토어 삭제 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "스토어 삭제에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 파일 업로드
app.post("/api/files/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 제공되지 않았습니다." });
    }

    const { displayName, storeName } = req.body;
    const filePath = req.file.path;
    const originalFileName = req.file.originalname;
    const providedMimeType = req.file.mimetype;
    const activeStoreName = storeName || (await getActiveStoreName());

    if (!activeStoreName) {
      return res.status(400).json({
        error: "활성 스토어가 없습니다. 먼저 스토어를 생성하세요.",
      });
    }

    const uploadedFile = await uploadFile(
      filePath,
      activeStoreName,
      displayName || originalFileName,
      originalFileName,
      providedMimeType
    );

    // 업로드된 임시 파일 삭제
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.warn("임시 파일 삭제 실패:", unlinkError);
    }

    if (uploadedFile) {
      await insertFileData({
        storeName: uploadedFile.parent,
        fileName: uploadedFile.documentName,
        displayName: uploadedFile.displayName as string,
      });

      res.json({
        success: true,
        file: {
          documentName: uploadedFile.documentName,
          displayName: uploadedFile.displayName,
          parent: uploadedFile.parent,
        },
      });
    } else {
      res.status(500).json({ error: "파일 업로드에 실패했습니다." });
    }
  } catch (error) {
    // 에러 발생 시 임시 파일 삭제
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn("임시 파일 삭제 실패:", unlinkError);
      }
    }
    console.error("파일 업로드 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "파일 업로드에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 질문하기 (RAG)
app.post("/api/ask", async (req, res) => {
  try {
    const { question, storeName, model } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "질문을 입력해주세요." });
    }

    const activeStoreName = storeName || (await getActiveStoreName());

    if (!activeStoreName) {
      return res.status(400).json({
        error:
          "활성 스토어가 없습니다. 먼저 스토어를 생성하고 파일을 업로드하세요.",
      });
    }

    const modelToUse = model || "gemini-2.5-flash";
    const result = await ask(modelToUse, activeStoreName, question);

    const responseText = result.text ?? "(응답 없음)";

    res.json({
      success: true,
      answer: responseText,
      storeName: activeStoreName,
      model: modelToUse,
    });
  } catch (error) {
    console.error("질문 처리 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "질문 처리에 실패했습니다.";
    res.status(500).json({ error: errorMessage });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
