# Gemini File Search RAG (Node + TypeScript)

자동차 사용 설명서를 Gemini File Search에 업로드하고, 해당 파일을 기반으로 질의응답(RAG)을 수행하는 Node.js + TypeScript 예제입니다. 모델 호출은 `@google/genai`를 사용하고, 파일 검색 스토어/업로드는 현재 SDK 미지원 구간이라 REST 호출을 사용합니다.

## 요구 사항

- Node.js 20 이상
- Google Gemini API 키 (`GEMINI_API_KEY`)

## 설치

```bash
npm install
```

## 환경 변수

- `GEMINI_API_KEY` (필수)
- `GEMINI_FILE_SEARCH_STORE` (선택, 스토어 이름을 직접 지정할 때)
- `GEMINI_FILE_URI` (스토어 대신 단일 파일 URI를 직접 지정할 때만 사용)

## 사용법

### 0) 파일 검색 스토어 생성 (최초 1회)

```bash
npm run create:store -- "display-name-선택"
```

- 생성된 스토어 이름이 `data/store.json`에 저장됩니다. 이미 스토어를 갖고 있다면 `.env`의 `GEMINI_FILE_SEARCH_STORE`를 설정해도 됩니다.

### 1) 매뉴얼 업로드 (스토어에 업로드)

```bash
npm run upload -- /절대/경로/매뉴얼.pdf "표시 이름(선택)"
```

- 업로드 후 인덱싱이 완료될 때까지 대기합니다.
- 업로드된 파일·스토어 정보는 `data/uploads.json`에 저장되며, 이후 질문 시 기본으로 사용됩니다.

### 2) 질문하기 (RAG)

```bash
npm run ask -- "이 차의 타이어 공기압은?" [--store <STORE_NAME>] [--model <모델명>]
```

- 기본으로 `data/uploads.json`의 최신 업로드에 기록된 스토어를 사용합니다.
- 스토어를 바꾸고 싶다면 `--store` 또는 `.env`의 `GEMINI_FILE_SEARCH_STORE`를 지정하세요.
- 스토어 없이 단일 파일 URI를 직접 쓰고 싶다면 `--file-uri`나 `.env`의 `GEMINI_FILE_URI`를 사용할 수 있습니다(비추천).
- 기본 모델은 `gemini-2.5-flash`이며, 다른 모델을 쓰려면 `--model`로 지정하세요.

## 주요 스크립트

- `src/createStore.ts`: 파일 검색 스토어 생성 (`fileSearchStores.create`)
- `src/uploadManual.ts`: 파일 업로드 및 인덱싱 상태 대기, 업로드 기록 저장 (REST 호출)
- `src/query.ts`: `@google/genai`로 Gemini에 질의하고 file search 도구를 사용 (스토어 혹은 파일 URI)

## 폴더 구조

- `src/` : 업로드 및 질의 스크립트
- `data/uploads.json` : 업로드 이력 저장소
- `data/store.json` : 기본 스토어 이름 저장
- `env.example` : 환경 변수 샘플

## 추가 아이디어

- 업로드 이력을 UI나 CLI 선택형으로 노출
- 여러 파일을 묶어 vector store 구성 후 파일 검색 설정 확장
- Cloud Storage 등 외부 스토리지와 연동해 업로드 자동화
