// ── 검색 ─────────────────────────────────────────────────────
function highlight(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text).replace(new RegExp('(' + escaped + ')', 'gi'), '<mark class="search-highlight">$1</mark>');
}
function jobMatchesSearch(job) {
  if (!searchQuery) return true;
  const fields = [job.plate, job.model, job.title, job.phone, job.note, job.region];
  if (fields.some(f => f && String(f).toLowerCase().includes(searchQuery))) return true;
  if (job.parts && job.parts.length > 0) {
    return job.parts.some(part => {
      const memo = partMemos[`${job.plate||''}|${job.date||''}|${part}`];
      return memo && memo.toLowerCase().includes(searchQuery);
    });
  }
  return false;
}
function onSearch(val) {
  searchQuery = val.trim().toLowerCase();
  document.getElementById('searchClear').classList.toggle('visible', searchQuery.length > 0);
  const mc = document.getElementById('searchClearMobile');
  if (mc) mc.classList.toggle('visible', searchQuery.length > 0);
  renderSchedule();
}
function clearSearch() {
  const si = document.getElementById('searchInput');
  const sim = document.getElementById('searchInputMobile');
  if (si) si.value = '';
  if (sim) sim.value = '';
  searchQuery = '';
  document.getElementById('searchClear').classList.remove('visible');
  const mc = document.getElementById('searchClearMobile');
  if (mc) mc.classList.remove('visible');
  renderSchedule();
}

// ── 체크 헬퍼 ────────────────────────────────────────────────
function stableKey(ji, pi) {
  const j = JOBS[ji];
  if (!j) return `${ji}-${pi}`;
  return `${j.plate||''}|${j.date||''}|${j.time||''}|${pi}`;
}
function isChecked(ji, pi) { return !!checkedState[stableKey(ji, pi)]; }
function setChecked(ji, pi, v) { checkedState[stableKey(ji, pi)] = v; saveChecked(); }

// ── 시간 포맷 ─────────────────────────────────────────────────
function parseTimeAmpm(t) {
  if (!t || t === '종일') return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1]), min = m[2];
  let ampm, hour;
  if (h === 0)       { ampm = '오전'; hour = `12:${min}`; }
  else if (h < 12)   { ampm = '오전'; hour = `${h}:${min}`; }
  else if (h === 12) { ampm = '오후'; hour = `12:${min}`; }
  else               { ampm = '오후'; hour = `${h - 12}:${min}`; }
  return { ampm, hour };
}

function formatTime(t) {
  if (!t || t === '종일') return '<span class="time-ampm">' + (t || '종일') + '</span>';
  const p = parseTimeAmpm(t);
  if (!p) return '<span class="time-ampm">' + t + '</span>';
  const cls = p.ampm === '오전' ? 'time-am' : 'time-pm';
  return `<span class="${cls}">${p.ampm}</span>\n${p.hour}`;
}

// 종료 시간 포맷: 시작과 오전/오후가 같으면 레이블 생략
function formatEndTime(endT, startT) {
  const ep = parseTimeAmpm(endT);
  const sp = parseTimeAmpm(startT);
  if (!ep) return '';
  if (sp && ep.ampm === sp.ampm) {
    // 같은 오전/오후 → 레이블 생략, 시간만 반환
    return ep.hour;
  }
  // 다른 오전/오후 → 레이블 표시
  const cls = ep.ampm === '오전' ? 'time-am' : 'time-pm';
  return `<span class="${cls}">${ep.ampm}</span>\n${ep.hour}`;
}

// ── 정렬 ─────────────────────────────────────────────────────
function sortKey(j) {
  try {
    const [m,d] = j.date.split('/');
    const [h,mn] = j.time && j.time.includes(':') ? j.time.split(':') : ['99','0'];
    return parseInt(m)*100000 + parseInt(d)*1000 + parseInt(h)*10 + parseInt(mn);
  } catch(e) { return 9999999; }
}
function sortJobs() { JOBS.sort((a,b) => sortKey(a) - sortKey(b)); }

// ── 시계 ─────────────────────────────────────────────────────
function getNow() { return new Date(new Date().toLocaleString('en-US', {timeZone:'Asia/Seoul'})); }
function getTodayStr() { const n = getNow(); return `${n.getMonth()+1}/${n.getDate()}`; }
function getDayName(dateStr) {
  try {
    const [m,d] = dateStr.split('/');
    const dt = new Date(new Date().getFullYear(), parseInt(m)-1, parseInt(d));
    return DAY_KO[dt.getDay()];
  } catch(e) { return ''; }
}
function updateClock() {
  const now = getNow();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const yyyy = now.getFullYear();
  const mo = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  document.getElementById('clockTime').innerHTML = `${formatTime(`${hh}:${mm}`)}:${ss}`;
  document.getElementById('clockDate').textContent = `${yyyy}.${mo}.${dd} (${DAY_KO[now.getDay()]})`;
  const hdr = document.getElementById('headerMonth');
  if (hdr) hdr.textContent = `${yyyy}년 ${now.getMonth()+1}월`;
}

// ── 필터 버튼 ─────────────────────────────────────────────────
function rebuildFilters() {
  const seen = [];
  JOBS.forEach(j => { if (!seen.includes(j.date)) seen.push(j.date); });
  seen.sort((a,b) => sortKey({date:a,time:'00:00'}) - sortKey({date:b,time:'00:00'}));
  const c = document.getElementById('filterBtns');
  c.innerHTML = `<button class="filter-btn ${currentFilter==='all'?'active':''}" onclick="filterJobs('all',this)">전체</button>`;
  seen.forEach(date => {
    const [m,d] = date.split('/');
    const active = currentFilter === date ? ' active' : '';
    c.innerHTML += `<button class="filter-btn${active}" onclick="filterJobs('${date}',this)">${m}/${d} (${getDayName(date)})</button>`;
  });
}

// ── 메인 렌더 ─────────────────────────────────────────────────
function renderSchedule() {
  sortJobs();
  rebuildFilters();
  const container = document.getElementById('scheduleContainer');
  container.innerHTML = '';
  const totalVisible = JOBS.filter(j => jobMatchesSearch(j)).length;
  if (searchQuery && totalVisible === 0) {
    container.innerHTML = '<div class="search-empty"><b>"' + searchQuery + '"</b> 검색 결과가 없습니다.</div>';
    return;
  }
  const byDate = {};
  JOBS.forEach((job,i) => {
    if (!byDate[job.date]) byDate[job.date] = [];
    byDate[job.date].push(i);
  });
  const dates = Object.keys(byDate).sort((a,b) => sortKey({date:a,time:'0'}) - sortKey({date:b,time:'0'}));
  const todayStr = getTodayStr();

  dates.forEach((date, di) => {
    if (currentFilter !== 'all' && date !== currentFilter) return;
    const indices = byDate[date];
    if (partsOnly) {
      const hasPartsInDate = indices.some(i => {
        const j = JOBS[i];
        return j.parts && j.parts.length > 0 && !j.done && !j.cancelled;
      });
      if (!hasPartsInDate) return;
    }
    const filteredIndices = indices.filter(ji => jobMatchesSearch(JOBS[ji]));
    if (filteredIndices.length === 0) return;
    const activeCount = filteredIndices.filter(i => !JOBS[i].done && !JOBS[i].cancelled).length;
    const [m,d] = date.split('/');
    const isToday = date === todayStr;
    const section = document.createElement('div');
    section.className = 'day-section';
    section.innerHTML = `<div class="day-header"><span class="day-label${isToday?' today':''}">${m}월 ${d}일 (${getDayName(date)})</span><span class="day-count">${activeCount}건</span></div>`;

    const now = getNow();
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    const nowTotal = nowH * 60 + nowM;

    indices.forEach(ji => {
      const job = JOBS[ji];
      if (!jobMatchesSearch(job)) return;
      if (partsOnly && !(job.parts && job.parts.length > 0)) return;

      // 현재 진행 중인 일정 판단 (오늘 날짜이고, 시작~종료 시간 사이)
      let isCurrent = false;
      if (isToday && job.time && job.time !== '종일' && !job.done && !job.cancelled) {
        const [sh, sm] = job.time.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        if (job.endTime && job.endTime !== '종일') {
          const [eh, em] = job.endTime.split(':').map(Number);
          const endTotal = eh * 60 + em;
          isCurrent = nowTotal >= startTotal && nowTotal < endTotal;
        } else {
          // 종료 시간 없으면 시작 시각의 같은 시간대(한 시간 내)
          isCurrent = nowH === sh;
        }
      }

      const card = document.createElement('div');
      card.className = 'job-card'+(job.done?' is-done':'')+(job.cancelled?' is-cancelled':'')+(isCurrent?' is-current':'');
      const endStr = job.endDate ? `<br><span style="font-size:13px;opacity:.5">→${job.endDate}</span>` : '';
      const endTimeHtml = (!job.endDate && job.endTime && job.endTime !== '종일' && job.endTime !== job.time)
        ? `<div class="time-end">~ ${formatEndTime(job.endTime, job.time)}</div>` : '';
      const badge = job.cancelled ? '<span class="status-badge badge-cancel">취소</span>' : job.done ? '<span class="status-badge badge-done">완료</span>' : '';
      const noteHtml = job.note ? `<div class="job-note">${highlight(job.note, searchQuery)}</div>` : '';
      const phoneHtml = job.phone ? `<div class="phone">${highlight(job.phone, searchQuery)}</div>` : '';
      const mc = getModelColor(job.model);
      const _isUnknownModel = !job.model || job.model.trim() === '' || mc.border === 'rgba(79,127,255,0.35)';
      const alertIcon = _isUnknownModel ? ALERT_SVG : '';
      const vinHtml = job.region ? (() => {
        const v = job.region;
        const prefix = v.length > 7 ? v.slice(0, v.length - 7) : '';
        const suffix = v.length > 7 ? v.slice(-7) : v;
        return `<span class="vin">${prefix}<span class="vin-highlight">${suffix}</span></span>`;
      })() : '';
      let partsHtml = '';
      if (job.parts && job.parts.length > 0) {
        const rows = job.parts.map((part,pi) => {
          const chk = isChecked(ji,pi) ? ' checked' : '';
          const memo = partMemos[stableMemoKey(ji, pi)] || '';
          const hasMemo = memo.length > 0;
          return `<div>
            <div class="part-row${chk}" id="p-${ji}-${pi}">
              <div class="cb-box" onclick="togglePart(${ji},${pi})">${CHECK_SVG}</div>
              <span class="part-label" onclick="togglePart(${ji},${pi})">${part}</span>
              <button class="part-memo-btn${hasMemo?' has-memo':''}" id="pmb-${ji}-${pi}" onclick="togglePartMemo(${ji},${pi})" title="메모">${NOTE_SVG}</button>
            </div>
            <div class="part-memo-wrap${hasMemo?' always':''}" id="pmw-${ji}-${pi}">
              ${hasMemo
                ? `<div class="part-memo-text" id="pmt-${ji}-${pi}" onclick="editPartMemo(${ji},${pi})">↳ ${memo}</div>`
                : `<input class="part-memo-input" id="pmi-${ji}-${pi}" placeholder="발주 메모 입력..." value="${memo}" onblur="savePartMemo(${ji},${pi})" onkeydown="if(event.key==='Enter')this.blur()">`
              }
            </div>
          </div>`;
        }).join('');
        partsHtml = `<div class="parts-block"><div class="parts-block-label">발주 부품</div>${rows}</div>`;
      }
      card.innerHTML = `${badge}
        <div class="time-col">${formatTime(job.time)}${endTimeHtml}${endStr}</div>
        <div class="job-body">
          <div class="job-top">
            ${alertIcon}<span class="car-model" style="background:${mc.bg};border-color:${mc.border};color:${mc.text}">${highlight(displayModel(job.model), searchQuery)||''}</span>
            <span class="plate">${highlight(job.plate, searchQuery)||''}</span>
            ${vinHtml}
          </div>
          <div class="job-title">${highlight(job.title, searchQuery)||''}</div>
          ${noteHtml}${phoneHtml}${partsHtml}
        </div>
        <div class="card-actions">
          <button class="btn-icon" onclick="openModal(${ji})">${PENCIL_SVG}</button>
          <button class="btn-icon btn-del" onclick="askDelete(${ji})">${TRASH_SVG}</button>
        </div>`;
      section.appendChild(card);
    });
    container.appendChild(section);
    if (di < dates.length-1) {
      const div = document.createElement('div'); div.className='section-divider'; container.appendChild(div);
    }
  });

  const active = JOBS.filter(j=>!j.done&&!j.cancelled).length;
  document.getElementById('totalCount').textContent = active;
  updateProgress();
  buildSummary();
  buildSidePanels();
}

// ── 부품 체크 토글 ────────────────────────────────────────────
function togglePart(ji, pi) {
  const val = !isChecked(ji, pi);
  setChecked(ji, pi, val);
  const el = document.getElementById(`p-${ji}-${pi}`);
  if (el) el.classList.toggle('checked', val);
  updateProgress();
  updateSummaryRow(ji);
}
function updateProgress() { /* 사이드바 부품발주 패널 제거됨 */ }
function buildSummary() { /* 사이드바 부품발주 패널 제거됨 */ }
function updateSummaryRow(ji) { /* 사이드바 부품발주 패널 제거됨 */ }

// ── 부품 메모 ─────────────────────────────────────────────────
function togglePartMemo(ji, pi) {
  const wrap = document.getElementById(`pmw-${ji}-${pi}`);
  if (!wrap) return;
  const memo = partMemos[stableMemoKey(ji, pi)] || '';
  if (memo) {
    editPartMemo(ji, pi);
  } else {
    const isOpen = wrap.classList.toggle('open');
    if (isOpen) {
      const inp = document.getElementById(`pmi-${ji}-${pi}`);
      if (inp) setTimeout(() => inp.focus(), 50);
    }
  }
}
function savePartMemo(ji, pi) {
  const inp = document.getElementById(`pmi-${ji}-${pi}`);
  if (!inp) return;
  const val = inp.value.trim();
  if (val) {
    partMemos[stableMemoKey(ji, pi)] = val;
  } else {
    delete partMemos[stableMemoKey(ji, pi)];
  }
  savePartMemos();
  renderSchedule();
}
function editPartMemo(ji, pi) {
  const wrap = document.getElementById(`pmw-${ji}-${pi}`);
  const memo = partMemos[stableMemoKey(ji, pi)] || '';
  wrap.innerHTML = `<input class="part-memo-input" id="pmi-${ji}-${pi}" placeholder="발주 메모 입력..." value="${memo}" onblur="savePartMemo(${ji},${pi})" onkeydown="if(event.key==='Enter')this.blur()">`;
  wrap.classList.add('open');
  setTimeout(() => {
    const inp = document.getElementById(`pmi-${ji}-${pi}`);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

// ── 사이드바 (장기 입고) ──────────────────────────────────────
function buildSidePanels() {
  const now = getNow();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  function parseDate(str) {
    if (!str) return null;
    const [m,d] = str.split('/');
    return new Date(now.getFullYear(), parseInt(m)-1, parseInt(d));
  }
  const longStay = JOBS.filter(j => j.endDate && !j.cancelled && !j.done).map(j => {
    const start = parseDate(j.date);
    const end   = parseDate(j.endDate);
    const days  = start ? Math.floor((todayDate - start) / 86400000) : 0;
    return {...j, days, endDateObj: end};
  }).filter(j => j.days >= 0 && j.endDateObj && j.endDateObj >= todayDate)
    .sort((a,b) => b.days - a.days);

  document.getElementById('longCount').textContent = longStay.length + '건';
  const lList = document.getElementById('longList');
  if (longStay.length === 0) {
    lList.innerHTML = '<div style="padding:8px 4px;font-size:13px;color:var(--text-muted)">현재 장기 입고 없음</div>';
  } else {
    lList.innerHTML = longStay.map((j, idx) => {
      const mc  = getModelColor(j.model);
      const end = j.endDateObj;
      const dLeft = end ? Math.ceil((end - todayDate) / 86400000) : null;
      const dayCls = j.days >= 7 ? 'warn' : j.days >= 3 ? 'caution' : 'ok';
      const ddCls  = dLeft !== null ? (dLeft <= 1 ? 'warn' : dLeft <= 3 ? 'caution' : 'ok') : 'ok';
      const ddLabel = dLeft === null ? '' : dLeft > 0 ? `D-${dLeft} 출고예정` : dLeft === 0 ? 'D-Day 출고' : '출고일 경과';
      const phoneRow = j.phone ? `<div class="long-card-expand-row"><b>연락처</b> ${j.phone}</div>` : '';
      const vinRow   = j.region? `<div class="long-card-expand-row"><b>차대번호</b> ${j.region}</div>` : '';
      const noteRow  = j.note  ? `<div class="long-card-expand-row"><b>메모</b> ${j.note}</div>` : '';
      return `<div class="long-card" id="lc-${idx}" onclick="toggleLongCard(${idx})">
        <div class="long-card-top">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="long-card-model" style="background:${mc.bg};border-color:${mc.border};color:${mc.text}">${displayModel(j.model)||''}</span>
            <span class="long-card-plate">${j.plate||''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="long-card-days ${dayCls}">${j.days}일째</span>
            <span class="long-card-chevron">▼</span>
          </div>
        </div>
        <div class="long-card-title">${j.title||''}</div>
        <div class="long-card-dates">${j.date} → ${j.endDate}</div>
        ${ddLabel ? `<div class="long-card-dday ${ddCls}">${ddLabel}</div>` : ''}
        <div class="long-card-expand" id="lce-${idx}">
          ${noteRow}${phoneRow}${vinRow}
        </div>
      </div>`;
    }).join('');
  }
}
function toggleLongCard(idx) {
  const card = document.getElementById('lc-' + idx);
  const body = document.getElementById('lce-' + idx);
  if (!card || !body) return;
  const isOpen = body.classList.toggle('open');
  card.classList.toggle('open', isOpen);
}
