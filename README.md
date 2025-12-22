# Gemini File Search RAG

Google Gemini API의 File Search 기능을 활용한 RAG(Retrieval-Augmented Generation) 시스템입니다. 문서를 파일 검색 스토어에 업로드하고, 업로드된 문서를 기반으로 질의응답을 수행할 수 있습니다.

**웹 UI와 CLI 모두 지원합니다!** 🎉

## 개발 환경

이 프로젝트는 다음 환경에서 개발되었습니다:

- **Node.js**: 20 이상
- **TypeScript**: 5.9.3
- **실행 환경**: Node.js (ES Modules)
- **패키지 관리**: npm
- **주요 라이브러리**:
  - `@google/genai`: ^1.34.0 (Google Gemini API SDK)
  - `express`: ^4.18.2 (웹 서버 프레임워크)
  - `multer`: ^1.4.5-lts.1 (파일 업로드 미들웨어)
  - `dotenv`: ^17.2.3 (환경 변수 관리)
  - `mime-types`: ^3.0.2 (파일 MIME 타입 감지)
  - `tsx`: ^4.21.0 (TypeScript 실행)

## 설치

1. 저장소 클론 또는 다운로드
2. 의존성 설치:

```bash
npm install
```

3. 환경 변수 설정:

```bash
cp env.example .env
```

`.env` 파일을 열어 `GEMINI_API_KEY`를 설정하세요:

```env
GEMINI_API_KEY=your-api-key-here
```

## 환경 변수

| 변수명                     | 필수 | 설명                                                            |
| -------------------------- | ---- | --------------------------------------------------------------- |
| `GEMINI_API_KEY`           | ✅   | Google Gemini API 키                                            |
| `GEMINI_FILE_SEARCH_STORE` | ❌   | 기본으로 사용할 파일 검색 스토어 이름 (없으면 활성 스토어 사용) |
| `PORT`                     | ❌   | 웹 서버 포트 (기본값: 3000)                                     |

## 프로젝트 구조

```
rag/
├── src/
│   ├── common/              # 공통 모듈
│   │   ├── init.ts          # dotenv 초기화
│   │   └── genAIGenerator.ts # Gemini AI 클라이언트 생성
│   ├── store/               # 스토어 관리
│   │   ├── createStore.ts   # 스토어 생성
│   │   ├── listStore.ts     # 스토어 목록 조회
│   │   ├── deleteStore.ts   # 스토어 삭제
│   │   ├── activeStore.ts   # 활성 스토어 설정
│   │   └── service/
│   │       ├── storeService.ts      # 스토어 API 호출
│   │       └── storeDataService.ts  # 스토어 데이터 관리
│   ├── file/                # 파일 관리
│   │   ├── uploadFile.ts    # 파일 업로드
│   │   └── service/
│   │       ├── fileService.ts       # 파일 API 호출
│   │       └── fileDataService.ts   # 파일 데이터 관리
│   ├── ask/                 # 질의응답
│   │   ├── ask.ts          # 질문 실행
│   │   └── service/
│   │       └── askService.ts # RAG 질의 서비스
│   ├── server.ts            # 웹 서버 (Express)
│   └── utils/              # 유틸리티
│       └── argParser.ts    # 명령줄 인자 파서
├── public/                  # 웹 UI 정적 파일
│   ├── index.html          # 메인 HTML
│   ├── styles.css          # 스타일시트
│   └── app.js              # 클라이언트 JavaScript
├── data/                    # 데이터 저장소
│   ├── stores.json         # 스토어 메타데이터
│   └── files.json          # 파일 업로드 이력
├── uploads/                 # 임시 업로드 파일 (자동 생성)
├── dist/                    # 빌드 출력
├── package.json
├── tsconfig.json
└── README.md
```

## 사용 방법

### 웹 UI 사용 (권장)

웹 브라우저를 통해 모든 기능을 사용할 수 있습니다.

1. **서버 시작:**

```bash
npm run dev
```

2. **브라우저에서 접속:**

```
http://localhost:3000
```

3. **웹 UI 기능:**
   - 📦 **스토어 관리**: 스토어 생성, 목록 조회, 활성화, 삭제
   - 📤 **파일 업로드**: 드래그 앤 드롭 또는 파일 선택으로 업로드
   - 💬 **채팅 형태 질문**: 업로드한 문서에 대해 채팅 형태로 질문하고 답변 받기
   - ⚙️ **설정**: 스토어 선택, 모델 선택

**웹 UI 특징:**

- 반응형 디자인 (모바일 지원)
- 실시간 상태 업데이트
- 채팅 형태의 직관적인 인터페이스
- 자동 스크롤 및 로딩 애니메이션

### CLI 사용

명령줄 인터페이스를 통해서도 모든 기능을 사용할 수 있습니다.

### 1. 스토어 생성

파일 검색 스토어를 생성합니다. 첫 번째로 생성된 스토어는 자동으로 활성화됩니다.

```bash
npm run create:store -- [--displayName <표시 이름>]
```

**예시:**

```bash
npm run create:store -- --displayName "문서 스토어"
```

### 2. 스토어 목록 조회

생성된 모든 스토어 목록과 현재 활성화된 스토어를 확인합니다.

```bash
npm run list:store
```

### 3. 활성 스토어 설정

기본으로 사용할 스토어를 활성화합니다.

```bash
npm run active:store -- <스토어 이름>
```

**예시:**

```bash
npm run active:store -- fileSearchStores/my-store-123
```

### 4. 파일 업로드

활성 스토어에 파일을 업로드하고 인덱싱합니다.

```bash
npm run upload:file -- <파일 경로> [--displayName <표시 이름>]
```

**예시:**

```bash
npm run upload:file -- /path/to/document.pdf --displayName "사용 설명서"
```

**특징:**

- 파일은 자동으로 청킹됩니다 (chunk 200 tokens, overlap 20 tokens)
- 업로드 후 인덱싱이 완료될 때까지 자동으로 대기합니다 (최대 60회 시도)
- 업로드 이력은 `data/files.json`에 저장됩니다

### 5. 질문하기 (RAG)

업로드된 문서를 기반으로 질문에 답변합니다.

```bash
npm run ask -- <질문> [--store <스토어 이름>] [--model <모델명>]
```

**예시:**

```bash
npm run ask -- "이 제품의 주요 기능은 무엇인가요?"
npm run ask -- "타이어 공기압은?" --store fileSearchStores/my-store-123
npm run ask -- "설명해줘" --model gemini-2.0-flash
```

**옵션:**

- `--store`: 사용할 스토어 지정 (없으면 활성 스토어 사용)
- `--model`: 사용할 모델 지정 (기본값: `gemini-2.5-flash`)

### 6. 스토어 삭제

스토어와 관련된 모든 데이터를 삭제합니다.

```bash
npm run delete:store -- <스토어 이름>
```

**예시:**

```bash
npm run delete:store -- fileSearchStores/my-store-123
```

**주의:** 스토어 삭제 시 해당 스토어의 파일 이력도 함께 삭제됩니다.

## 주요 기능

### 웹 서버

- **Express 기반**: RESTful API 제공
- **정적 파일 서빙**: 웹 UI 자동 제공
- **파일 업로드**: Multer를 사용한 파일 업로드 처리
- **CORS 지원**: 크로스 오리진 요청 지원
- **자동 MIME 타입 감지**: 파일 확장자 및 브라우저 감지 기반

### 스토어 관리

- **생성**: `fileSearchStores.create()` API 사용
- **목록 조회**: `fileSearchStores.list()` API 사용
- **활성화**: 로컬 데이터베이스(`data/stores.json`)에서 관리, 웹 UI에서 버튼 클릭으로 활성화 가능
- **삭제**: `fileSearchStores.delete()` API 사용 (force 옵션)
- **웹 UI**: 시각적인 카드 형태로 스토어 관리
  - 활성화되지 않은 스토어에는 "⭐ 활성화" 버튼이 표시됩니다
  - 활성화된 스토어에는 "활성" 배지가 표시되고 삭제 버튼이 숨겨집니다

### 파일 관리

- **업로드**: `fileSearchStores.uploadToFileSearchStore()` API 사용
- **인덱싱 대기**: `operations.get()` API로 완료까지 폴링
- **청킹 설정**: 화이트스페이스 기반 청킹 (200 tokens/chunk, 20 tokens overlap)
- **이력 관리**: `data/files.json`에 업로드 이력 저장
- **MIME 타입 자동 감지**: 파일 확장자 및 브라우저에서 제공한 MIME 타입 활용
- **웹 UI**: 드래그 앤 드롭 또는 파일 선택으로 업로드

### RAG 질의

- **모델**: 기본 `gemini-2.5-flash` (변경 가능)
- **File Search Tool**: 스토어의 파일을 자동으로 검색하여 컨텍스트로 사용
- **Temperature**: 0.2 (일관된 답변을 위해 낮게 설정)
- **웹 UI**: 채팅 형태의 직관적인 질문-답변 인터페이스
- **실시간 응답**: 로딩 애니메이션 및 자동 스크롤

## 데이터 저장소

### `data/stores.json`

스토어 메타데이터를 저장합니다:

```json
{
  "stores": [
    {
      "name": "fileSearchStores/xxx",
      "displayName": "스토어 이름",
      "createTime": 1234567890,
      "active": true
    }
  ]
}
```

### `data/files.json`

파일 업로드 이력을 저장합니다:

```json
{
  "files": [
    {
      "storeName": "fileSearchStores/xxx",
      "fileName": "files/yyy",
      "displayName": "파일 이름"
    }
  ]
}
```

## 스크립트

### 개발

```bash
npm run dev
```

웹 서버를 개발 모드로 실행합니다. 파일 변경 시 자동으로 재시작됩니다 (nodemon 사용).

### 프로덕션

```bash
npm run build
npm start
```

TypeScript를 JavaScript로 컴파일하고 프로덕션 모드로 서버를 실행합니다.

컴파일된 파일은 `dist/` 디렉토리에 생성됩니다.

### 기타 스크립트

- `npm run create:store` - 스토어 생성
- `npm run list:store` - 스토어 목록 조회
- `npm run delete:store` - 스토어 삭제
- `npm run active:store` - 활성 스토어 설정
- `npm run upload:file` - 파일 업로드
- `npm run list:file` - 파일 목록 조회
- `npm run ask` - 질문하기

## 아키텍처

### 공통 모듈

- **`common/init.ts`**: 모든 스크립트에서 dotenv 초기화를 공통으로 수행
- **`common/genAIGenerator.ts`**: Gemini AI 클라이언트 싱글톤 제공

### 서비스 레이어

- **Service 파일들**: API 호출 로직을 캡슐화
- **DataService 파일들**: 로컬 데이터 저장소 관리

### 웹 서버

- **`server.ts`**: Express 기반 웹 서버
  - RESTful API 엔드포인트 제공
  - 정적 파일 서빙 (public 디렉토리)
  - 파일 업로드 처리 (Multer)
  - CORS 설정

### 프론트엔드

- **`public/index.html`**: 메인 HTML 페이지
- **`public/styles.css`**: 반응형 스타일시트
- **`public/app.js`**: 클라이언트 사이드 JavaScript
  - API 통신
  - 채팅 UI 관리
  - 실시간 상태 업데이트

### 유틸리티

- **`utils/argParser.ts`**: 명령줄 인자 파싱 유틸리티 (재사용 가능)

## API 엔드포인트

웹 서버는 다음 RESTful API를 제공합니다:

- `GET /api/stores` - 스토어 목록 조회
- `POST /api/stores` - 스토어 생성
- `PUT /api/stores/:storeName/active` - 스토어 활성화
- `DELETE /api/stores/:storeName` - 스토어 삭제
- `POST /api/files/upload` - 파일 업로드
- `POST /api/ask` - 질문하기 (RAG)

## 주의사항

1. **API 키 보안**: `.env` 파일은 Git에 커밋하지 마세요
2. **스토어 삭제**: 스토어 삭제는 되돌릴 수 없습니다
3. **파일 크기**: Gemini API의 파일 크기 제한을 확인하세요 (최대 100MB)
4. **인덱싱 시간**: 큰 파일은 인덱싱에 시간이 걸릴 수 있습니다
5. **임시 파일**: 업로드된 파일은 처리 후 자동으로 삭제됩니다
6. **포트 충돌**: 기본 포트 3000이 사용 중이면 `PORT` 환경 변수로 변경하세요

## 작성자

beekei-god
