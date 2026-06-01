// ── 부품 키워드 / 블랙리스트 ────────────────────────────────
const PART_KEYWORDS = [
  '마운트세트','마운트 세트','엔진마운트',
  '타이밍체인커버','타이밍 체인 커버','타이밍커버',
  '워터펌프어셈블리','워터펌프 어셈블리','워터펌프',
  '댐퍼풀리세트','댐퍼풀리 세트','댐퍼풀리',
  '오일필터하우징','오일필터','오일팬',
  '터보인테이크가스켓','터보 인테이크 가스켓',
  '터보어셈블리','터보파이프','터보재생',
  '벨트세트','환기파이프',
  '로워암부싱세트','앞 부싱','앞부싱','부싱세트',
  '볼조인트','허브베어링','쇼바마운트',
  '인터쿨러파이프','플러그씰',
  '브레이크액','브레이크 액',
  '브레이크패드','브레이크 패드',
  '도어록','휠센서','앞휠센서','윈드실드커버',
  '에어필터','헤드개스킷','클러치','링크','부싱',
  '오일압력제어밸브',
  '컴프레서','컴프래서',
];
const PART_BLACKLIST = [
  '엔진오일','엔진 오일',
  '미션오일','미션 오일','DCT미션오일','DCT 미션오일',
  '에어컨필터','에어컨 필터',
  '배터리','브레이크',
  '앞패드','앞 패드','뒤패드','뒤 패드',
];

function extractParts(title) {
  const found = [];
  const tl = title.toLowerCase();
  for (const kw of PART_KEYWORDS) {
    if (tl.includes(kw.toLowerCase())) {
      if (PART_BLACKLIST.some(bl => bl.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(bl.toLowerCase()))) continue;
      if (!found.some(f => f.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(f.toLowerCase()))) {
        found.push(kw);
      }
    }
  }
  return found;
}

function filterBlacklistFromParts(parts) {
  if (!Array.isArray(parts)) return parts;
  return parts.filter(p => !PART_BLACKLIST.some(bl =>
    bl.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(bl.toLowerCase())
  ));
}

// ── ICS 텍스트 파서 ─────────────────────────────────────────
function cleanText(t) {
  return t.replace(/\\\\,/g, ',').replace(/\\,/g, ',').replace(/\\n/g, ' ').replace(/\\;/g, ';').replace(/\r/g, '').trim();
}

function parseDtStr(s) {
  s = (s || '').trim();
  if (s.includes(':')) s = s.split(':').pop();
  if (s.includes('T')) {
    const mo = s.slice(4,6), d = s.slice(6,8), h = s.slice(9,11), mi = s.slice(11,13);
    return [`${parseInt(mo)}/${parseInt(d)}`, `${h}:${mi}`];
  } else if (s.length >= 8) {
    const mo = s.slice(4,6), d = s.slice(6,8);
    return [`${parseInt(mo)}/${parseInt(d)}`, '종일'];
  }
  return ['', ''];
}

function parseSummary(summary) {
  let s = summary;
  s = s.replace(/0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g, '').trim();
  const modelM = s.match(/^([A-Z]\d+[a-z]*d?)/);
  const model = modelM ? modelM[1] : '';
  if (model) s = s.slice(model.length).replace(/^\./, '');
  const plateM = s.match(/\d{2,3}[가-힣]\d{4}|\d{3,4}[가-힣]{1,2}\d{4}|[가-힣]{2}\d{4}/);
  const plate = plateM ? plateM[0].trim() : '';
  if (plate) s = s.replace(plate, '');
  s = s.replace(/[(（][^)）\n]{1,15}[)）]/g, '').replace(/^[\s.,\-]+/, '').replace(/[\s.,\-]+$/, '').replace(/\s{2,}/g, ' ').trim();
  return { model, plate, title: s };
}

function parseICSText(text) {
  text = text.split('\r\n ').join('').split('\r\n\t').join('');
  text = text.split('\n ').join('').split('\n\t').join('');
  const lines = text.split(/\r\n|\n|\r/);
  const events = [];
  let current = null;
  for (const line of lines) {
    const l = line.trim();
    if (l === 'BEGIN:VEVENT') { current = {}; }
    else if (l === 'END:VEVENT') { if (current) events.push(current); current = null; }
    else if (current && l.includes(':')) {
      const sep = l.indexOf(':');
      const key = l.slice(0, sep).split(';')[0].toUpperCase();
      if (!(key in current)) current[key] = l.slice(sep + 1).trim();
    }
  }
  const seen = new Set();
  const jobs = [];
  for (const ev of events) {
    const summary = cleanText(ev['SUMMARY'] || '');
    if (!summary || summary.includes('청소 시간')) continue;
    const dedup = (ev['UID'] || '') + (ev['RECURRENCE-ID'] || '');
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    const [dateStr, timeStr] = parseDtStr(ev['DTSTART'] || '');
    let [endDateStr] = parseDtStr(ev['DTEND'] || '');
    if (endDateStr === dateStr) endDateStr = '';
    if (!dateStr) continue;
    const cancelled = summary.includes('취소');
    const done = !!(ev['X-NAVER-COMPLETED']);
    const desc = cleanText(ev['DESCRIPTION'] || '');
    const { model, plate, title } = parseSummary(summary);
    const parts = extractParts(title);
    jobs.push({ date: dateStr, endDate: endDateStr, time: timeStr || '종일',
      model, plate, region: '', title, parts, phone: '', note: desc,
      done, cancelled });
  }
  jobs.sort((a, b) => sortKey(a) - sortKey(b));
  return jobs;
}
