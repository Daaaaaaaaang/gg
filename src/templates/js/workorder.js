// ── 작업 지시서 출력 ──────────────────────────────────────────
function printWorkOrders() {
  const todayStr = getTodayStr();
  const todayJobs = JOBS.filter(j => j.date === todayStr && !j.cancelled);

  if (todayJobs.length === 0) {
    alert('오늘 등록된 일정이 없습니다.');
    return;
  }

  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtDate(d) {
    const p = (d || '').split('/');
    if (p.length !== 2) return d || '';
    const y = new Date().getFullYear();
    return `${y}.${String(p[0]).padStart(2,'0')}.${String(p[1]).padStart(2,'0')}`;
  }

  function fmtDateWithTime(d, t) {
    const datePart = d || '';
    if (!t || t === '종일') return datePart + (t === '종일' ? ' 종일' : '');
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return datePart;
    const h = parseInt(m[1]);
    let timePart;
    if (h === 0)       timePart = '오전 12시';
    else if (h < 12)   timePart = '오전 ' + h + '시';
    else if (h === 12) timePart = '오후 12시';
    else               timePart = '오후 ' + (h - 12) + '시';
    return datePart + ' ' + timePart;
  }

  const NUM_ROWS = 7;

  const pages = todayJobs.map((job, idx) => {
    // 작업 항목: parts 우선, 없으면 title을 쉼표로 분리
    const raw = (job.parts && job.parts.length > 0)
      ? job.parts
      : (job.title || '').split(',').map(s => s.trim()).filter(Boolean);

    const rows = Array.from({length: NUM_ROWS}, (_, i) => {
      const v = esc(raw[i] || '');
      return `<tr>
        <td class="col-no">${i + 1}</td>
        <td class="col-list"><input type="text" value="${v}"></td>
        <td class="col-check"><input type="checkbox"></td>
        <td class="col-check"><input type="checkbox"></td>
      </tr>`;
    }).join('');

    const oId = `go-${idx}`, cId = `gc-${idx}`;

    return `<div class="paper" id="paper-${idx}">
  <div class="doc-header">
    <div class="title-block">
      <div class="doc-title">작업 지시서</div>
      <div class="doc-sub">WORK ORDER</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><span class="meta-label">담당자</span><input class="meta-value" type="text" value=""></div>
      <div class="meta-item"><span class="meta-label">차종</span><input class="meta-value" type="text" value="${esc(job.model)}"></div>
      <div class="meta-item"><span class="meta-label">날짜</span><input class="meta-value" type="text" value="${esc(fmtDateWithTime(job.date, job.time))}"></div>
      <div class="meta-item"><span class="meta-label">차량 번호</span><input class="meta-value" type="text" value="${esc(job.plate)}"></div>
      <div class="meta-item wide"><span class="meta-label">주행 거리</span><input class="meta-value" type="text" value=""></div>
    </div>
  </div>
  <div class="reservation-row">
    <span class="meta-label">예약 내용</span>
    <textarea class="meta-value reservation-full">${esc(job.title)}</textarea>
  </div>
  <div class="table-wrap">
    <table class="work-table">
      <thead>
        <tr>
          <th style="width:44px;text-align:center;border-right:0.5px solid #ddd;">No.</th>
          <th>List</th>
          <th class="center" style="width:56px;border-left:0.5px solid #ddd;">Check</th>
          <th class="center" style="width:56px;border-left:0.5px solid #ddd;">Check</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="special-row" style="border-top:0.5px solid #ccc;">
          <td colspan="4"><div class="special-inner"><div class="special-label">특이사항 1</div><textarea class="special-input" rows="2">${esc(job.note)}</textarea></div></td>
        </tr>
        <tr class="special-row" style="border-top:0.5px solid #ddd;">
          <td colspan="4"><div class="special-inner"><div class="special-label">특이사항 2</div><textarea class="special-input" rows="2"></textarea></div></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="doc-footer">
    <div class="basic-check">
      <div class="basic-title">기본 점검</div>
      <div class="chips">
        <div class="chip" onclick="toggleChip(this)"><span class="chip-box"></span>공기압</div>
        <div class="chip" onclick="toggleChip(this)"><span class="chip-box"></span>워셔액</div>
        <div class="chip" onclick="toggleChip(this)"><span class="chip-box"></span>서비스 리셋</div>
        <div class="chip" onclick="toggleChip(this)"><span class="chip-box"></span>엔진룸 크리닝</div>
        <div class="chip" onclick="toggleChip(this)"><span class="chip-box"></span>전구류 점검</div>
      </div>
    </div>
    <div class="gauges">
      <div class="gauge">
        <div class="gauge-bar" id="${oId}" onclick="cycleGauge('${oId}')"><div class="gauge-fill oil" style="height:0%"></div></div>
        <div class="gauge-label">OIL LEVEL</div>
      </div>
      <div class="gauge">
        <div class="gauge-bar" id="${cId}" onclick="cycleGauge('${cId}')"><div class="gauge-fill coolant" style="height:0%"></div></div>
        <div class="gauge-label">COOLANT</div>
      </div>
    </div>
  </div>
</div>`;
  });

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>작업 지시서 ${fmtDate(todayStr)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;background:#eeede9;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:16px;}
  .toolbar{width:100%;max-width:794px;display:flex;justify-content:space-between;align-items:center;}
  .toolbar-hint{font-size:13px;color:#888;font-weight:300;}
  .print-btn{display:flex;align-items:center;gap:8px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;font-weight:400;cursor:pointer;transition:background 0.15s;}
  .print-btn:hover{background:#333;}
  .print-btn svg{width:15px;height:15px;}
  .paper{width:794px;height:1123px;background:#fff;border-radius:4px;padding:52px 56px;box-shadow:0 2px 24px rgba(0,0,0,0.10);display:flex;flex-direction:column;}
  .doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;margin-bottom:0;}
  .reservation-row{display:flex;flex-direction:column;gap:4px;margin-top:-4px;margin-bottom:14px;}
  .reservation-full{width:100%;resize:none;overflow:hidden;line-height:1.6;min-height:22px;padding:2px 0 4px;}
  .title-block .doc-title{font-size:33px;font-weight:500;color:#1a1a1a;letter-spacing:-0.5px;line-height:1.1;}
  .title-block .doc-sub{font-size:12px;font-weight:300;color:#999;letter-spacing:1.5px;margin-top:6px;}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;min-width:340px;}
  .meta-item{display:flex;flex-direction:column;gap:4px;}
  .meta-item.wide{grid-column:1/-1;}
  .meta-label{font-size:11px;font-weight:300;color:#aaa;}
  .meta-value{border:none;border-bottom:0.5px solid #ccc;outline:none;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:400;color:#1a1a1a;padding:2px 0 4px;background:transparent;width:100%;}
  .meta-value:focus{border-bottom-color:#888;}
  .table-wrap{flex:1;display:flex;flex-direction:column;margin-bottom:20px;min-height:0;}
  .work-table{width:100%;border-collapse:collapse;border:0.5px solid #ccc;border-radius:4px;overflow:hidden;height:100%;}
  .work-table thead th{background:#f5f5f3;font-size:11px;font-weight:500;color:#666;letter-spacing:0.3px;padding:8px 12px;border-bottom:0.5px solid #ccc;text-align:left;}
  .work-table thead th.center{text-align:center;}
  .work-table tbody tr{border-bottom:0.5px solid #e5e5e5;}
  .work-table tbody tr:last-child{border-bottom:none;}
  .col-no{width:44px;text-align:center;font-size:12px;color:#bbb;font-weight:300;border-right:0.5px solid #e5e5e5;padding:0;vertical-align:middle;}
  .col-list{padding:0;vertical-align:middle;}
  .col-list input{width:100%;border:none;outline:none;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13.5px;font-weight:400;color:#1a1a1a;background:transparent;padding:14px 12px;display:block;}
  .col-check{width:56px;text-align:center;border-left:0.5px solid #e5e5e5;vertical-align:middle;padding:14px 0;}
  .col-check input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:1px solid #ccc;border-radius:2px;cursor:pointer;position:relative;display:inline-block;transition:all 0.15s;}
  .col-check input[type="checkbox"]:checked{background:#1a1a1a;border-color:#1a1a1a;}
  .col-check input[type="checkbox"]:checked::after{content:'';position:absolute;left:3px;top:1px;width:5px;height:8px;border:2px solid #fff;border-top:none;border-left:none;transform:rotate(45deg);}
  .special-row td{background:#f5f5f3;padding:0;vertical-align:top;}
  .special-inner{padding:10px 12px;height:100%;display:flex;flex-direction:column;}
  .special-label{font-size:11px;font-weight:300;color:#aaa;letter-spacing:0.3px;margin-bottom:6px;}
  .special-input{width:100%;border:none;outline:none;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13.5px;font-weight:400;color:#1a1a1a;background:transparent;resize:none;flex:1;min-height:44px;line-height:1.6;}
  .doc-footer{border-top:1px solid #1a1a1a;padding-top:20px;display:flex;justify-content:space-between;align-items:flex-end;}
  .basic-check{flex:1;}
  .basic-title{font-size:11px;font-weight:500;color:#666;letter-spacing:0.3px;margin-bottom:10px;}
  .chips{display:flex;flex-wrap:wrap;gap:6px;}
  .chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:300;color:#555;border:0.5px solid #ccc;border-radius:20px;padding:5px 12px;background:#f9f9f7;cursor:pointer;transition:all 0.15s;user-select:none;}
  .chip:hover{border-color:#999;}
  .chip.checked{background:#1a1a1a;border-color:#1a1a1a;color:#fff;}
  .chip-box{display:inline-block;width:11px;height:11px;border:1px solid #ccc;border-radius:2px;position:relative;flex-shrink:0;transition:all 0.15s;}
  .chip.checked .chip-box{border-color:#fff;background:transparent;}
  .chip.checked .chip-box::after{content:'';position:absolute;left:2px;top:0;width:4px;height:7px;border:1.5px solid #fff;border-top:none;border-left:none;transform:rotate(45deg);}
  .gauges{display:flex;gap:16px;align-items:flex-end;margin-left:24px;}
  .gauge{display:flex;flex-direction:column;align-items:center;gap:6px;}
  .gauge-label{font-size:10px;font-weight:300;color:#aaa;letter-spacing:0.5px;}
  .gauge-bar{width:32px;height:64px;border:0.5px solid #ccc;border-radius:3px;background:#f5f5f3;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;}
  .gauge-fill{width:100%;transition:height 0.3s ease;}
  .gauge-fill.oil{background:#B5D4F4;}
  .gauge-fill.coolant{background:#9FE1CB;}
  @media print {
    @page{size:A4;margin:18mm;}
    body{background:none;padding:0;display:block;}
    .toolbar{display:none;}
    .paper{width:100%;height:auto;min-height:0;padding:0;box-shadow:none;border-radius:0;page-break-after:always;}
    .paper:last-child{page-break-after:avoid;}
    .col-list input,.special-input,.meta-value,.special-row td,.work-table thead th,.gauge-fill,.chip.checked{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .col-check input[type="checkbox"]:checked{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
</style>
</head>
<body>
<div class="toolbar">
  <span class="toolbar-hint">내용 수정 후 인쇄 버튼으로 PDF 저장 (총 ${todayJobs.length}건)</span>
  <button class="print-btn" onclick="window.print()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    인쇄 / PDF 저장
  </button>
</div>
${pages.join('\n')}
<script>
  function toggleChip(el){el.classList.toggle('checked');}
  function cycleGauge(id){
    var bar=document.getElementById(id);
    var fill=bar.querySelector('.gauge-fill');
    var levels=[0,25,40,55,75,100];
    var cur=parseInt(fill.style.height)||0;
    var idx=levels.indexOf(cur);
    fill.style.height=levels[(idx+1)%levels.length]+'%';
  }
  function fitSpecialRows(paper){
    var tableWrap=paper.querySelector('.table-wrap');
    var specialRows=paper.querySelectorAll('.special-row');
    specialRows.forEach(function(r){r.style.height='';});
    var paperH=paper.clientHeight;
    var available=paperH-52-52;
    var siblings=Array.from(paper.children).filter(function(el){return el!==tableWrap;});
    var siblingsH=siblings.reduce(function(sum,el){
      var s=getComputedStyle(el);
      return sum+el.offsetHeight+parseInt(s.marginTop||0)+parseInt(s.marginBottom||0);
    },0);
    var wrapStyle=getComputedStyle(tableWrap);
    var targetH=available-siblingsH-parseInt(wrapStyle.marginBottom||0);
    var table=tableWrap.querySelector('.work-table');
    var thead=table.querySelector('thead');
    var fixedRows=Array.from(table.querySelectorAll('tbody tr:not(.special-row)'));
    var fixedH=thead.offsetHeight+fixedRows.reduce(function(s,r){return s+r.offsetHeight;},0);
    var specialH=Math.max((targetH-fixedH)/specialRows.length,80);
    specialRows.forEach(function(r){r.style.height=specialH+'px';});
  }
  function fitReservations(){
    document.querySelectorAll('.reservation-full').forEach(function(ta){
      ta.style.height='0';
      ta.style.height=ta.scrollHeight+'px';
    });
  }
  function fitAll(){fitReservations();document.querySelectorAll('.paper').forEach(function(p){fitSpecialRows(p);});}
  window.addEventListener('load',fitAll);
  window.addEventListener('resize',fitAll);
<\/script>
</body>
</html>`;

  const blob = new Blob([html], {type: 'text/html; charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    alert('팝업이 차단되었습니다. 이 사이트의 팝업을 허용한 후 다시 시도해주세요.');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
