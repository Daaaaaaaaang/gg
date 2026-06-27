// ── Supabase 설정 ─────────────────────────────────────────────────────
var SB_URL = 'https://nywusbbvowpeurtieilj.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3VzYmJ2b3dwZXVydGllaWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDI0NjAsImV4cCI6MjA4OTM3ODQ2MH0.urseR75-_FIwhfrHjl8jvYOGgGHyBNehY7DHPxp2W9o';
var SB_READY = false;

async function sbGet(id) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/schedule_data?id=eq.${id}&select=data`, {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    });
    const rows = await res.json();
    return rows.length > 0 ? rows[0].data : null;
  } catch(e) { return null; }
}

async function sbSet(id, data) {
  try {
    await fetch(`${SB_URL}/rest/v1/schedule_data`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
    });
  } catch(e) {}
}
