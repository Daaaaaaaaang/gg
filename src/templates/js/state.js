// ── SVG 아이콘 ────────────────────────────────────────────────────────
const ALERT_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#cf222e" style="vertical-align:-3px;margin-right:4px;flex-shrink:0;"><path d="M13 17.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-8.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z"></path><path d="M9.836 3.244c.963-1.665 3.365-1.665 4.328 0l8.967 15.504c.963 1.667-.24 3.752-2.165 3.752H3.034c-1.926 0-3.128-2.085-2.165-3.752Zm3.03.751a1.002 1.002 0 0 0-1.732 0L2.168 19.499A1.002 1.002 0 0 0 3.034 21h17.932a1.002 1.002 0 0 0 .866-1.5L12.866 3.994Z"></path></svg>`;
const CHECK_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M21.03 5.72a.75.75 0 0 1 0 1.06l-11.5 11.5a.747.747 0 0 1-1.072-.012l-5.5-5.75a.75.75 0 1 1 1.084-1.036l4.97 5.195L19.97 5.72a.75.75 0 0 1 1.06 0Z"></path></svg>`;
const PENCIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.263 2.177a1.75 1.75 0 0 1 2.474 0l2.586 2.586a1.75 1.75 0 0 1 0 2.474L19.53 10.03l-.012.013L8.69 20.378a1.753 1.753 0 0 1-.699.409l-5.523 1.68a.748.748 0 0 1-.747-.188.748.748 0 0 1-.188-.747l1.673-5.5a1.75 1.75 0 0 1 .466-.756L14.476 4.963ZM4.708 16.361a.26.26 0 0 0-.067.108l-1.264 4.154 4.177-1.271a.253.253 0 0 0 .1-.059l10.273-9.806-2.94-2.939-10.279 9.813ZM19 8.44l2.263-2.262a.25.25 0 0 0 0-.354l-2.586-2.586a.25.25 0 0 0-.354 0L16.061 5.5Z"></path></svg>`;
const TRASH_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1.75V3h5.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H8V1.75C8 .784 8.784 0 9.75 0h4.5C15.216 0 16 .784 16 1.75Zm-6.5 0V3h5V1.75a.25.25 0 0 0-.25-.25h-4.5a.25.25 0 0 0-.25.25ZM4.997 6.178a.75.75 0 1 0-1.493.144L4.916 20.92a1.75 1.75 0 0 0 1.742 1.58h10.684a1.75 1.75 0 0 0 1.742-1.581l1.413-14.597a.75.75 0 0 0-1.494-.144l-1.412 14.596a.25.25 0 0 1-.249.226H6.658a.25.25 0 0 1-.249-.226L4.997 6.178Z"></path><path d="M9.206 7.501a.75.75 0 0 1 .793.705l.5 8.5A.75.75 0 1 1 9 16.794l-.5-8.5a.75.75 0 0 1 .705-.793Zm6.293.793A.75.75 0 1 0 14 8.206l-.5 8.5a.75.75 0 0 0 1.498.088l.5-8.5Z"></path></svg>`;
const NOTE_SVG   = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M0 4.75C0 3.784.784 3 1.75 3h20.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0 1 22.25 21H1.75A1.75 1.75 0 0 1 0 19.25Zm1.75-.25a.25.25 0 0 0-.25.25v14.5c0 .138.112.25.25.25h20.5a.25.25 0 0 0 .25-.25V4.75a.25.25 0 0 0-.25-.25Z"></path><path d="M5 8.75A.75.75 0 0 1 5.75 8h11.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 8.75Zm0 4a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z"></path></svg>`;
const MOON_SVG   = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14.768 3.96v.001l-.002-.005a9.08 9.08 0 0 0-.218-.779c-.13-.394.21-.8.602-.67.29.096.575.205.855.328l.01.005A10.002 10.002 0 0 1 12 22a10.002 10.002 0 0 1-9.162-5.985l-.004-.01a9.722 9.722 0 0 1-.329-.855c-.13-.392.277-.732.67-.602.257.084.517.157.78.218l.004.002A9 9 0 0 0 14.999 6a9.09 9.09 0 0 0-.231-2.04ZM16.5 6c0 5.799-4.701 10.5-10.5 10.5-.426 0-.847-.026-1.26-.075A8.5 8.5 0 1 0 16.425 4.74c.05.413.075.833.075 1.259Z"></path></svg>`;
const SUN_SVG    = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 1 0 0 11Zm-5.657.157a.75.75 0 0 1 0 1.06l-1.768 1.768a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.767-1.768a.75.75 0 0 1 1.061 0ZM3.515 3.515a.75.75 0 0 1 1.06 0l1.768 1.768a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L3.515 4.575a.75.75 0 0 1 0-1.06ZM12 0a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 12 0ZM4 12a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 4 12Zm8 8a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 12 20Zm12-8a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 24 12Zm-6.343 5.657a.75.75 0 0 1 1.06 0l1.768 1.768a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.768-1.767a.75.75 0 0 1 0-1.061Zm2.828-14.142a.75.75 0 0 1 0 1.06l-1.768 1.768a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l1.767-1.768a.75.75 0 0 1 1.061 0Z"></path></svg>`;
const DAY_KO = ['일','월','화','수','목','금','토'];

// ── 차종 표시명 / 색상 ──────────────────────────────────────
function displayModel(model) {
  return (model||'').replace(/[a-z]+$/i, '');
}

function getModelColor(model) {
  const base = (model||'').toUpperCase().replace(/[DS]$/,'');
  if (['R50','R52','R53'].includes(base)) return {bg:'#ffcfc9',border:'#e8a49e',text:'#111'};
  if (['R55','R56','R57','R58','R59','R60','R61'].includes(base)) return {bg:'#ffe5a0',border:'#d4b96a',text:'#111'};
  if (['F54','F55','F56','F57','F60'].includes(base)) return {bg:'#bfe1f6',border:'#7cb8e0',text:'#111'};
  if (['F65','F66','F67','U25'].includes(base)) return {bg:'#e6cff2',border:'#c09ad8',text:'#111'};
  return {bg:'rgba(79,127,255,0.12)',border:'rgba(79,127,255,0.35)',text:'var(--accent)'};
}

// ── 기본 일정 데이터 (빌드 시 치환) ────────────────────────
const DEFAULT_JOBS = [
__JOBS__
];

// ── localStorage 키 ─────────────────────────────────────────
window.LS_JOBS    = 'junghbi_jobs';
window.LS_CHECKED = 'junghbi_checked';
var LS_JOBS    = window.LS_JOBS;
var LS_CHECKED = window.LS_CHECKED;
var LS_PMEMO   = 'jungbi_pmemo_' + window._HASH;

// ── 잡 키 ───────────────────────────────────────────────────
function _jobKey(j) { return (j.date||'')+'|'+(j.time||'')+'|'+(j.plate||'')+'|'+(j.model||''); }

// ── JOBS 저장/로드 ──────────────────────────────────────────
function loadJobs() {
  try {
    var s = localStorage.getItem(LS_JOBS);
    if (!s) return JSON.parse(JSON.stringify(DEFAULT_JOBS));
    var stored = JSON.parse(s);
    var storedMap = {};
    stored.forEach(function(j) { storedMap[_jobKey(j)] = j; });
    return DEFAULT_JOBS.map(function(dj) {
      var old = storedMap[_jobKey(dj)];
      if (!old) return dj;
      return Object.assign({}, dj, {
        done:      dj.done || old.done,
        cancelled: dj.cancelled || old.cancelled,
        note:      old.note !== undefined && old.note !== '' ? old.note : dj.note,
        region:    old.region !== undefined && old.region !== '' ? old.region : dj.region,
        parts:     old.parts !== undefined ? old.parts : dj.parts,
      });
    });
  } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_JOBS)); }
}
function saveJobs() {
  try { localStorage.setItem(LS_JOBS, JSON.stringify(JOBS)); } catch(e) {}
  if (SB_READY) sbSet('jungbi_jobs', JOBS);
}

// ── 체크 상태 저장/로드 ─────────────────────────────────────
function loadChecked() {
  try { var s = localStorage.getItem(LS_CHECKED); return s ? JSON.parse(s) : {}; }
  catch(e) { return {}; }
}
function saveChecked() {
  try { localStorage.setItem(LS_CHECKED, JSON.stringify(checkedState)); } catch(e) {}
  if (SB_READY) sbSet('jungbi_checked', checkedState);
}

// ── 부품 메모 저장/로드 ─────────────────────────────────────
function stableMemoKey(ji, pi) {
  const j = JOBS[ji];
  if (!j) return `${ji}-${pi}`;
  const partName = (j.parts && j.parts[pi]) ? j.parts[pi] : pi;
  return `${j.plate||''}|${j.date||''}|${partName}`;
}
function loadPartMemos() {
  try { var s = localStorage.getItem(LS_PMEMO); return s ? JSON.parse(s) : {}; }
  catch(e) { return {}; }
}
function savePartMemos() {
  try { localStorage.setItem(LS_PMEMO, JSON.stringify(partMemos)); } catch(e) {}
  if (SB_READY) sbSet('jungbi_pmemo', partMemos);
}

// ── 전역 상태 ────────────────────────────────────────────────
let JOBS         = loadJobs();
let checkedState = loadChecked();
let partMemos    = loadPartMemos();
let currentFilter  = 'all';
let partsOnly      = false;
let editingIndex   = null;
let deletingIndex  = null;
let modalStatus    = { done: false, cancel: false };
let searchQuery    = '';
