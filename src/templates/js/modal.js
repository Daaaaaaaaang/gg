// ── 모달 (일정 추가/수정) ─────────────────────────────────────
function openModal(ji) {
  editingIndex = ji !== undefined ? ji : null;
  const job = ji !== undefined ? JOBS[ji] : null;
  document.getElementById('modalTitle').textContent = job ? '일정 수정' : '일정 추가';
  document.getElementById('f-date').value    = job ? job.date : '';
  document.getElementById('f-endDate').value = job ? (job.endDate||'') : '';
  document.getElementById('f-time').value    = job ? job.time : '';
  document.getElementById('f-model').value   = job ? job.model : '';
  document.getElementById('f-plate').value   = job ? job.plate : '';
  document.getElementById('f-region').value  = job ? job.region : '';
  document.getElementById('f-title').value   = job ? job.title : '';
  document.getElementById('f-phone').value   = job ? job.phone : '';
  document.getElementById('f-note').value    = job ? job.note : '';
  modalStatus = { done: job?job.done:false, cancel: job?job.cancelled:false };
  refreshStatusToggles();
  renderPartsEditor(job ? (job.parts||[]) : []);
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeModalOutside(e) { if(e.target===document.getElementById('modalOverlay')) closeModal(); }

// ── 부품 에디터 ───────────────────────────────────────────────
const _REMOVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5.72 5.72a.75.75 0 0 1 1.06 0L12 10.94l5.22-5.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L13.06 12l5.22 5.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L12 13.06l-5.22 5.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 12 5.72 6.78a.75.75 0 0 1 0-1.06Z"></path></svg>`;

function renderPartsEditor(parts) {
  const editor = document.getElementById('partsEditor');
  editor.innerHTML = '';
  parts.forEach((p,i) => {
    const row = document.createElement('div'); row.className='parts-editor-item';
    row.innerHTML=`<input type="text" value="${p}" placeholder="부품명" id="part-field-${i}"><button class="btn-remove-part" onclick="removePartField(${i})">${_REMOVE_ICON}</button>`;
    editor.appendChild(row);
  });
}
function addPartField() {
  const editor = document.getElementById('partsEditor');
  const idx = editor.children.length;
  const row = document.createElement('div'); row.className='parts-editor-item';
  row.innerHTML=`<input type="text" placeholder="부품명" id="part-field-${idx}"><button class="btn-remove-part" onclick="removePartField(${idx})">${_REMOVE_ICON}</button>`;
  editor.appendChild(row);
  row.querySelector('input').focus();
}
function removePartField(i) {
  const editor = document.getElementById('partsEditor');
  const items = editor.querySelectorAll('.parts-editor-item');
  if(items[i]) items[i].remove();
  editor.querySelectorAll('.parts-editor-item').forEach((row,ni) => {
    row.querySelector('input').id = `part-field-${ni}`;
    row.querySelector('button').setAttribute('onclick',`removePartField(${ni})`);
  });
}
function getParts() {
  return Array.from(document.getElementById('partsEditor').querySelectorAll('input'))
    .map(inp=>inp.value.trim()).filter(v=>v);
}

// ── 상태 토글 (완료/취소) ─────────────────────────────────────
function toggleStatus(type) {
  if(type==='done') { modalStatus.done = !modalStatus.done; if(modalStatus.done) modalStatus.cancel=false; }
  else { modalStatus.cancel = !modalStatus.cancel; if(modalStatus.cancel) modalStatus.done=false; }
  refreshStatusToggles();
}
function refreshStatusToggles() {
  document.getElementById('toggle-done').className = 'toggle-btn'+(modalStatus.done?' active-done':'');
  document.getElementById('toggle-cancel').className = 'toggle-btn'+(modalStatus.cancel?' active-cancel':'');
}

// ── 저장 ─────────────────────────────────────────────────────
function saveJob() {
  const date = document.getElementById('f-date').value.trim();
  if(!date) { alert('날짜를 입력해주세요.'); return; }
  const job = {
    date, endDate:document.getElementById('f-endDate').value.trim(),
    time:document.getElementById('f-time').value.trim()||'종일',
    model:document.getElementById('f-model').value.trim(),
    plate:document.getElementById('f-plate').value.trim(),
    region:document.getElementById('f-region').value.trim(),
    title:document.getElementById('f-title').value.trim(),
    phone:document.getElementById('f-phone').value.trim(),
    note:document.getElementById('f-note').value.trim(),
    parts:getParts(), done:modalStatus.done, cancelled:modalStatus.cancel,
  };
  if(editingIndex!==null) JOBS[editingIndex]=job; else JOBS.push(job);
  saveJobs(); closeModal(); renderSchedule();
}

// ── 삭제 확인 ─────────────────────────────────────────────────
function askDelete(ji) {
  deletingIndex = ji;
  const job = JOBS[ji];
  document.getElementById('confirmMsg').textContent = `"${job.model} ${job.plate}" 일정을 삭제할까요?`;
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm() { document.getElementById('confirmOverlay').classList.remove('open'); deletingIndex=null; }
function confirmDelete() { if(deletingIndex===null) return; JOBS.splice(deletingIndex,1); saveJobs(); closeConfirm(); renderSchedule(); }
