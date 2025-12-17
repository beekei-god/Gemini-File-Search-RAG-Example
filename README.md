# Gemini File Search RAG (Node + TypeScript)

자동차 사용 설명서를 Gemini File Search에 업로드하고, 해당 파일을 기반으로 질의응답(RAG)을 수행하는 Node.js + TypeScript 예제입니다.

## 요구 사항

- Node.js 20 이상
- Google Gemini API 키 (`GEMINI_API_KEY`)

## 설치

```bash
npm install
```

## 환경 변수

`env.example`를 복사해 API 키를 설정하세요.

```bash
cp env.example .env
```

## 사용법

### 1) 매뉴얼 업로드

```bash
npm run upload -- /절대/경로/매뉴얼.pdf "표시 이름(선택)"
```

- 업로드 후 인덱싱이 완료될 때까지 대기합니다.
- 업로드된 파일 정보는 `data/uploads.json`에 저장되며, 이후 질문 시 기본으로 사용됩니다.

### 2) 질문하기 (RAG)

```bash
npm run ask -- "이 차의 타이어 공기압은?" [--file-uri <URI>] [--mime <MIME>] [--model <모델명>]
```

- 기본으로 `data/uploads.json`의 최신 업로드를 사용합니다.
- 특정 파일을 지정하고 싶다면 `--file-uri` 또는 `.env`의 `GEMINI_FILE_URI`를 사용하세요.

## 주요 스크립트

- `src/uploadManual.ts`: 파일 업로드 및 인덱싱 상태 대기, 업로드 기록 저장
- `src/query.ts`: 업로드한 파일을 참조하여 Gemini에게 질의

## 폴더 구조

- `src/` : 업로드 및 질의 스크립트
- `data/uploads.json` : 업로드 이력 저장소
- `env.example` : 환경 변수 샘플

## 추가 아이디어

- 업로드 이력을 UI나 CLI 선택형으로 노출
- 여러 파일을 묶어 vector store 구성 후 파일 검색 설정 확장
- Cloud Storage 등 외부 스토리지와 연동해 업로드 자동화
