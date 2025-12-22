const API_BASE = '/api';

// 스토어 목록 조회
async function fetchStores() {
  try {
    const response = await fetch(`${API_BASE}/stores`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('스토어 목록 조회 오류:', error);
    throw error;
  }
}

// 스토어 생성
async function createStore(displayName) {
  try {
    const response = await fetch(`${API_BASE}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('스토어 생성 오류:', error);
    throw error;
  }
}

// 스토어 삭제
async function deleteStore(storeName) {
  try {
    const response = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeName)}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('스토어 삭제 오류:', error);
    throw error;
  }
}

// 파일 업로드
async function uploadFile(formData) {
  try {
    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    throw error;
  }
}

// 질문하기
async function askQuestion(question, storeName, model) {
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, storeName, model }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '질문 처리에 실패했습니다.');
    }
    return data;
  } catch (error) {
    console.error('질문 처리 오류:', error);
    throw error;
  }
}

// 스토어 목록 렌더링
function renderStores(stores, activeStoreName) {
  const storesList = document.getElementById('storesList');
  
  if (stores.length === 0) {
    storesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>생성된 스토어가 없습니다.</p>
        <p>새 스토어를 생성해보세요!</p>
      </div>
    `;
    return;
  }

  storesList.innerHTML = stores.map(store => `
    <div class="store-card ${store.isActive ? 'active' : ''}">
      <div class="store-card-header">
        <div>
          <div class="store-name">${escapeHtml(store.displayName || store.name)}</div>
          <div class="store-display-name">${escapeHtml(store.name)}</div>
        </div>
        ${store.isActive ? '<span class="badge badge-active">활성</span>' : ''}
      </div>
      <div class="store-info">
        <div class="store-info-item">📄 문서 수: ${store.activeDocumentsCount}</div>
        <div class="store-info-item">💾 크기: ${formatBytes(store.sizeBytes)}</div>
        ${store.createTime ? `<div class="store-info-item">📅 생성일: ${formatDate(store.createTime)}</div>` : ''}
      </div>
      <div class="store-actions">
        <button class="btn btn-danger btn-small" onclick="handleDeleteStore('${escapeHtml(store.name)}', '${escapeHtml(store.displayName)}')">
          🗑️ 삭제
        </button>
      </div>
    </div>
  `).join('');
}

// 스토어 선택 옵션 업데이트
function updateStoreSelect(stores) {
  const storeSelect = document.getElementById('storeSelect');
  const askStoreSelect = document.getElementById('askStoreSelect');
  
  // 파일 업로드용 스토어 선택
  storeSelect.innerHTML = '<option value="">활성 스토어 사용</option>';
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.name;
    option.textContent = `${store.displayName || store.name}${store.isActive ? ' (활성)' : ''}`;
    storeSelect.appendChild(option);
  });
  
  // 질문하기용 스토어 선택
  askStoreSelect.innerHTML = '<option value="">활성 스토어 사용</option>';
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.name;
    option.textContent = `${store.displayName || store.name}${store.isActive ? ' (활성)' : ''}`;
    askStoreSelect.appendChild(option);
  });
}

// 스토어 목록 새로고침
async function refreshStores() {
  const storesList = document.getElementById('storesList');
  storesList.innerHTML = '<div class="loading">로딩 중...</div>';
  
  try {
    const data = await fetchStores();
    renderStores(data.stores, data.activeStoreName);
    updateStoreSelect(data.stores);
  } catch (error) {
    storesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p>스토어 목록을 불러오는데 실패했습니다.</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// 스토어 삭제 처리
async function handleDeleteStore(storeName, displayName) {
  if (!confirm(`정말로 "${displayName || storeName}" 스토어를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
    return;
  }

  try {
    await deleteStore(storeName);
    alert('스토어가 삭제되었습니다.');
    await refreshStores();
  } catch (error) {
    alert(`스토어 삭제에 실패했습니다: ${error.message}`);
  }
}

// 스토어 생성 처리
async function handleCreateStore(e) {
  e.preventDefault();
  const displayName = document.getElementById('storeDisplayName').value.trim();
  
  if (!displayName) {
    alert('표시 이름을 입력해주세요.');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '생성 중...';

  try {
    await createStore(displayName);
    alert('스토어가 생성되었습니다.');
    document.getElementById('createStoreModal').classList.remove('show');
    document.getElementById('createStoreForm').reset();
    await refreshStores();
  } catch (error) {
    alert(`스토어 생성에 실패했습니다: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '생성';
  }
}

// 파일 업로드 처리
async function handleFileUpload(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('fileInput');
  const displayName = document.getElementById('displayName').value.trim();
  const storeName = document.getElementById('storeSelect').value;
  
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('파일을 선택해주세요.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  if (displayName) {
    formData.append('displayName', displayName);
  }
  if (storeName) {
    formData.append('storeName', storeName);
  }

  const uploadStatus = document.getElementById('uploadStatus');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  uploadStatus.className = 'upload-status progress';
  uploadStatus.textContent = '파일을 업로드하고 인덱싱하는 중입니다... 이 작업은 몇 분이 걸릴 수 있습니다.';
  uploadStatus.style.display = 'block';
  submitBtn.disabled = true;
  submitBtn.textContent = '업로드 중...';

  try {
    const result = await uploadFile(formData);
    uploadStatus.className = 'upload-status success';
    uploadStatus.textContent = `✅ 파일 업로드 완료: ${result.file.displayName}`;
    e.target.reset();
    await refreshStores();
  } catch (error) {
    uploadStatus.className = 'upload-status error';
    uploadStatus.textContent = `❌ 파일 업로드 실패: ${error.message}`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 업로드';
  }
}

// 채팅 메시지 추가
function addChatMessage(type, content, meta = null) {
  const chatMessages = document.getElementById('chatMessages');
  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) {
    welcome.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = content;

  messageContent.appendChild(bubble);

  if (meta) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.textContent = meta;
    messageContent.appendChild(metaDiv);
  }

  messageDiv.appendChild(messageContent);

  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// 로딩 메시지 추가
function addLoadingMessage() {
  const chatMessages = document.getElementById('chatMessages');
  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) {
    welcome.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message assistant';
  messageDiv.id = 'loading-message';

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message-loading';
  loadingDiv.innerHTML = '<span></span><span></span><span></span>';

  messageDiv.appendChild(loadingDiv);
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// 로딩 메시지 제거
function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// 채팅 영역 스크롤을 맨 아래로
function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 질문하기 처리
async function handleAsk(e) {
  e.preventDefault();
  
  const question = document.getElementById('questionInput').value.trim();
  const storeName = document.getElementById('askStoreSelect').value;
  const model = document.getElementById('askModelSelect').value;
  
  if (!question) {
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const questionInput = document.getElementById('questionInput');
  
  // 질문 메시지 추가
  addChatMessage('user', question);
  
  // 입력란 초기화 및 비활성화
  questionInput.value = '';
  questionInput.style.height = 'auto';
  submitBtn.disabled = true;
  
  // 로딩 메시지 추가
  addLoadingMessage();

  try {
    const result = await askQuestion(question, storeName || null, model);
    
    // 로딩 메시지 제거
    removeLoadingMessage();
    
    // 답변 메시지 추가
    const storeDisplayName = result.storeName.split('/').pop() || result.storeName;
    const meta = `모델: ${escapeHtml(result.model)} | 스토어: ${escapeHtml(storeDisplayName)}`;
    addChatMessage('assistant', result.answer, meta);
  } catch (error) {
    // 로딩 메시지 제거
    removeLoadingMessage();
    
    // 에러 메시지 추가
    addChatMessage('assistant', `❌ 오류: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    questionInput.focus();
  }
}

// 유틸리티 함수
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
  // 초기 스토어 목록 로드
  refreshStores();

  // 새로고침 버튼
  document.getElementById('refreshStores').addEventListener('click', refreshStores);

  // 스토어 생성 버튼
  const createStoreBtn = document.getElementById('createStoreBtn');
  const createStoreModal = document.getElementById('createStoreModal');
  const closeModal = createStoreModal.querySelector('.close');

  createStoreBtn.addEventListener('click', () => {
    createStoreModal.classList.add('show');
  });

  closeModal.addEventListener('click', () => {
    createStoreModal.classList.remove('show');
  });

  window.addEventListener('click', (e) => {
    if (e.target === createStoreModal) {
      createStoreModal.classList.remove('show');
    }
  });

  // 스토어 생성 폼
  document.getElementById('createStoreForm').addEventListener('submit', handleCreateStore);

  // 파일 업로드 폼
  document.getElementById('uploadForm').addEventListener('submit', handleFileUpload);

  // 질문하기 폼
  const askForm = document.getElementById('askForm');
  const questionInput = document.getElementById('questionInput');
  
  askForm.addEventListener('submit', handleAsk);
  
  // 텍스트 영역 자동 높이 조절
  questionInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  
  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  questionInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.value.trim()) {
        askForm.dispatchEvent(new Event('submit'));
      }
    }
  });
});

