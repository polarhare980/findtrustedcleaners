import fs from 'node:fs'; import path from 'node:path';
function escapeHtml(str=''){ return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function applyVars(tpl, vars) { tpl = tpl.replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, k) => vars[k] ?? ''); tpl = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => escapeHtml(vars[k] ?? '')); tpl = tpl.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, k, inner) => (vars[k] ? inner : '')); return tpl; }
function themeVars(theme){ if (theme==='dark') { return { bg_color:'#0b1220', card_bg:'#111827', brand_color:'#f8fafc', body_text:'#e5e7eb', footer_text:'#94a3b8', divider:'#1f2937', button_bg:'#2563eb' }; } return { bg_color:'#f6f7fb', card_bg:'#ffffff', brand_color:'#0f172a', body_text:'#334155', footer_text:'#64748b', divider:'#e2e8f0', button_bg:'#0f172a' }; }
function injectPreheader(html, preheader){ if (!preheader) return html; const span = `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${preheader}</span>`; const m = html.match(/<body[^>]*>/i); if (m) { const i = html.indexOf(m[0]) + m[0].length; return html.slice(0, i) + span + html.slice(i); } return span + html; }
export function renderEmail(name, vars = {}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const defaults = { site_url: base }; const palette = themeVars(vars.theme); const defaultsWithTheme = { ...defaults, ...palette };
  const finalVars = { ...defaultsWithTheme, ...vars };
  const p = path.join(process.cwd(), 'emails', 'dist', `${name}.html`);
  try { if (fs.existsSync(p)) { const tpl = fs.readFileSync(p, 'utf-8'); return injectPreheader(applyVars(tpl, finalVars), vars.preheader); } } catch {}
  const title = finalVars.subject || 'FindTrustedCleaners'; const content = finalVars.content_html || '<p>Hello from FindTrustedCleaners.</p>';
  return injectPreheader(`<!doctype html><html><body><h2>${title}</h2>${content}</body></html>`, vars.preheader);
}
