// ── 시계 시작 ─────────────────────────────────────────────────
setInterval(updateClock, 1000);
updateClock();

// ── 필터 / 부품전용 ───────────────────────────────────────────
function filterJobs(date, btn) {
  currentFilter = date;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderSchedule();
}
function togglePartsOnly() {
  partsOnly = !partsOnly;
  const btn = document.getElementById('partsToggleBtn');
  if (btn) btn.classList.toggle('active', partsOnly);
  renderSchedule();
}

// ── 테마 ─────────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  try{localStorage.setItem('jungbi_theme', isLight?'light':'dark');}catch(e){}
  document.getElementById('themeBtn').innerHTML = isLight ? MOON_SVG : SUN_SVG;
}
function initTheme() {
  var saved = ''; try{saved=localStorage.getItem('jungbi_theme')||'';}catch(e){}
  const isLight = saved === 'light';
  if(isLight) document.documentElement.classList.add('light');
  document.getElementById('themeBtn').innerHTML = isLight ? MOON_SVG : SUN_SVG;
}

// ── ICS 병합 업데이트 ─────────────────────────────────────────
async function mergeAndUpdate(newJobs) {
  const jobKey = _jobKey;
  let baseJobs    = JOBS;
  let baseChecked = checkedState;
  let baseMemos   = partMemos;
  try {
    const [sbJobs, sbChecked, sbMemos] = await Promise.all([
      sbGet('jungbi_jobs'),
      sbGet('jungbi_checked'),
      sbGet('jungbi_pmemo'),
    ]);
    if (sbJobs && sbJobs.length > 0) baseJobs = sbJobs;
    if (sbChecked) baseChecked = Object.assign({}, checkedState, sbChecked);
    if (sbMemos)   baseMemos   = Object.assign({}, partMemos, sbMemos);
  } catch(e) {}

  checkedState = baseChecked;
  const oldMap = {};
  baseJobs.forEach(j => { oldMap[jobKey(j)] = j; });
  const merged = newJobs.map(nj => {
    const old = oldMap[jobKey(nj)];
    if (!old) return nj;
    return {
      ...nj,
      done:      nj.done || old.done,
      cancelled: nj.cancelled || old.cancelled,
      note:      old.note !== undefined && old.note !== '' ? old.note : nj.note,
      region:    old.region !== undefined && old.region !== '' ? old.region : nj.region,
      parts:     (old.parts && old.parts.length > 0) ? old.parts : nj.parts,
    };
  });

  JOBS = merged;
  saveJobs();
  partMemos = baseMemos;
  try { localStorage.setItem(LS_CHECKED, JSON.stringify(checkedState)); } catch(e) {}
  try { localStorage.setItem(LS_PMEMO,   JSON.stringify(partMemos));    } catch(e) {}
  if (SB_READY) {
    sbSet('jungbi_checked', checkedState);
    sbSet('jungbi_pmemo', partMemos);
  }

  // 오래된 partMemos 정리 (ICS 날짜 범위 ±30일 밖 삭제)
  try {
    const jobDates = JOBS.map(j => {
      const p = (j.date || '').split('/');
      if (p.length === 2) return new Date(new Date().getFullYear(), parseInt(p[0])-1, parseInt(p[1]));
      return null;
    }).filter(Boolean);
    if (jobDates.length > 0) {
      const minD = new Date(Math.min(...jobDates.map(d=>d.getTime())));
      const maxD = new Date(Math.max(...jobDates.map(d=>d.getTime())));
      const cutStart = new Date(minD); cutStart.setDate(cutStart.getDate()-30);
      const cutEnd   = new Date(maxD); cutEnd.setDate(cutEnd.getDate()+30);
      let cleaned = false;
      Object.keys(partMemos).forEach(k => {
        if (!k.includes('|')) return;
        const dp = (k.split('|')[1]||'').split('/');
        if (dp.length !== 2) return;
        const md = new Date(new Date().getFullYear(), parseInt(dp[0])-1, parseInt(dp[1]));
        if (md < cutStart || md > cutEnd) { delete partMemos[k]; cleaned = true; }
      });
      if (cleaned) {
        try { localStorage.setItem(LS_PMEMO, JSON.stringify(partMemos)); } catch(e) {}
        sbSet('jungbi_pmemo', partMemos);
      }
    }
  } catch(e) { console.warn('partMemos 정리 중 오류:', e); }

  renderSchedule();
}

// ── 비밀번호 보호 ─────────────────────────────────────────────
const PW_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // 1234
async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function checkPw() {
  const val = document.getElementById('pwInput').value;
  const h = await hashPw(val);
  if (h === PW_HASH) {
    sessionStorage.setItem('jungbi_auth', '1');
    document.getElementById('pw-screen').style.display = 'none';
  } else {
    document.getElementById('pwError').style.display = 'block';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}
if (sessionStorage.getItem('jungbi_auth') === '1') {
  document.getElementById('pw-screen').style.display = 'none';
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pwInput').focus();
  });
}

// ── 초기화 ───────────────────────────────────────────────────
initTheme();

(async function initFromSupabase() {
  try {
    const [sbJobs, sbChecked, sbMemos] = await Promise.all([
      sbGet('jungbi_jobs'),
      sbGet('jungbi_checked'),
      sbGet('jungbi_pmemo'),
    ]);
    if (sbJobs) {
      const jobKey = _jobKey;
      const sbMap = {};
      sbJobs.forEach(j => { sbMap[jobKey(j)] = j; });
      const merged = DEFAULT_JOBS.map(dj => {
        const sb = sbMap[jobKey(dj)];
        if (!sb) return dj;
        return {
          ...dj,
          done:      dj.done || sb.done,
          cancelled: dj.cancelled || sb.cancelled,
          note:      sb.note !== undefined && sb.note !== '' ? sb.note : dj.note,
          region:    sb.region !== undefined && sb.region !== '' ? sb.region : dj.region,
          parts:     (sb.parts && sb.parts.length > 0) ? filterBlacklistFromParts(sb.parts) : dj.parts,
        };
      });
      JOBS = merged;
      try { localStorage.setItem(LS_JOBS, JSON.stringify(JOBS)); } catch(e) {}
    }
    if (sbChecked) {
      checkedState = Object.assign({}, checkedState, sbChecked);
      try { localStorage.setItem(LS_CHECKED, JSON.stringify(checkedState)); } catch(e) {}
    }
    if (sbMemos) {
      partMemos = Object.assign({}, partMemos, sbMemos);
      try { localStorage.setItem(LS_PMEMO, JSON.stringify(partMemos)); } catch(e) {}
    }
    SB_READY = true;
    console.log('Supabase 데이터 로드 완료');
  } catch(e) {
    SB_READY = true;
    console.warn('Supabase 로드 실패, localStorage 사용:', e);
  }
  const todayStr = getTodayStr();
  if (JOBS.some(j => j.date === todayStr)) currentFilter = todayStr;
  renderSchedule();
})();
