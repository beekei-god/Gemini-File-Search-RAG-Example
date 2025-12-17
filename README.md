# Gemini File Search RAG (Node + TypeScript, @google/genai)

자동차 사용 설명서를 Gemini File Search 스토어에 업로드하고, 해당 스토어를 활용해 질의응답(RAG)을 수행하는 예제입니다. 업로드·스토어 생성·질의 모두 `@google/genai`를 사용하며, 필요 시 REST 호출 없이 SDK 경로를 우선 사용합니다.

## 요구 사항

- Node.js 20 이상
- `GEMINI_API_KEY` (필수)

## 설치

```bash
npm install
```

## 환경 변수

- `GEMINI_API_KEY` : Gemini API 키
- `GEMINI_FILE_SEARCH_STORE` : 기본으로 사용할 파일 검색 스토어 이름(선택)
- `GEMINI_FILE_URI` : 스토어 없이 단일 파일을 직접 참조할 때만 사용(선택, 비권장)

## 스크립트

```json
"scripts": {
  "build": "tsc --outDir dist",
  "create:store": "tsx src/createStore.ts",
  "upload": "tsx src/uploadManual.ts",
  "ask": "tsx src/query.ts"
}
```

## 동작 개요

- 스토어 관리: `.env`의 `GEMINI_FILE_SEARCH_STORE` → `data/store.json` → 없으면 `fileSearchStores.create`로 `car-manual-store` 자동 생성 후 저장.
- 업로드: `fileSearchStores.uploadToFileSearchStore` 사용, `chunkingConfig` 포함. 완료까지 `operations.get`으로 폴링 후 `data/uploads.json`에 `name`, `uri`, `mimeType`, `storeName` 기록.
- 질의: 기본 모델 `gemini-2.5-flash`. 스토어가 있으면 `tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }]`로 RAG 수행. 스토어가 없고 파일 URI가 있으면 `fileData`로 직접 참조. 응답 텍스트와 인용 URI 출력.

## 사용법

1. 환경 변수 설정

```bash
cp env.example .env
# .env에 GEMINI_API_KEY 입력, 필요 시 GEMINI_FILE_SEARCH_STORE 지정
```

2. 스토어 생성 (없다면)

```bash
npm run create:store -- "car-manual-store"
```

`data/store.json`에 저장되며, `.env`의 `GEMINI_FILE_SEARCH_STORE`가 있으면 그것을 사용합니다.

3. 매뉴얼 업로드

```bash
npm run upload -- /절대/경로/매뉴얼.pdf "표시이름(선택)"
```

- 스토어가 없으면 자동 생성 후 업로드
- 완료까지 폴링, 결과를 `data/uploads.json`에 기록

4. 질문하기 (RAG)

```bash
npm run ask -- "이 차의 타이어 공기압은?" [--store <STORE_NAME>] [--model <모델명>]
# 스토어 없이 파일 URI를 직접 쓰려면
npm run ask -- --file-uri https://... "질문"
```

- 기본: 최근 업로드의 스토어 사용
- 스토어 변경: `--store` 또는 `.env`의 `GEMINI_FILE_SEARCH_STORE`
- 모델 변경: `--model` (기본 `gemini-2.5-flash`)
- 파일 URI 직접 참조는 스토어가 없을 때만 사용 권장

## 파일/폴더

- `src/createStore.ts` : 파일 검색 스토어 생성
- `src/uploadManual.ts` : 스토어 자동 생성/업로드/폴링, 업로드 메타 저장
- `src/query.ts` : 스토어 기반 RAG 질의(`@google/genai`) 또는 파일 URI 직접 참조
- `data/store.json` : 기본 스토어 이름
- `data/uploads.json` : 업로드 이력 (name, uri, mimeType, storeName 등)
- `env.example` : 환경 변수 샘플

## 참고

- 업로드 시 `chunkingConfig.whiteSpaceConfig`(chunk 200 tokens, overlap 20 tokens)를 적용합니다.
- `operations.get`이 SDK에 포함되어 있으므로 별도 REST 폴백 없이 동작합니다. SDK가 변경될 경우 REST 엔드포인트(`https://generativelanguage.googleapis.com/v1beta/operations/...`)로 대체할 수 있습니다.
