/* Oogstwerkplaats: logica. Eén bestand, geen afhankelijkheden, werkt zonder internet.
   Staat in S (de oogst, bewaard in de browser) en UI (waar je bent). Elke handeling past S aan en tekent opnieuw. */
(function(){
'use strict';
const OMG = window.OMGEVING || 'static';
const SITE = OMG === 'publiek' ? '' : 'https://nelefreedom.github.io/effectenoogst/';
const SLEUTEL = 'oogstwerkplaats-v1';
const $ = (s, r) => (r || document).querySelector(s);
const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const MND = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const maand = m => { if (!m) return 'datum onbekend'; const p = m.split('-'); return MAANDEN[+p[1]-1] + ' ' + p[0]; };
const vandaag = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const datumNl = d => { if (!d) return ''; const p = d.split('-'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : d; };
const GETAL = ['geen','één','twee','drie','vier','vijf','zes','zeven','acht','negen','tien','elf','twaalf'];
const getal = n => n <= 12 ? GETAL[n] : String(n);
const Hoofd = s => s.charAt(0).toUpperCase() + s.slice(1);
const wacht = ms => new Promise(r => setTimeout(r, ms));
const rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SCHERMEN = [
  {id:'overzicht', naam:'Overzicht'},
  {id:'verzamelen', nr:1, naam:'Verzamelen', lang:'Verzamelen wat er al ligt, met agentic AI'},
  {id:'aanvullen', nr:2, naam:'Aanvullen', lang:'Aanvullen, als er iets ontbreekt'},
  {id:'navragen', nr:3, naam:'Navragen', lang:'Navragen, waar dat nodig is'},
  {id:'wegen', nr:4, naam:'Wegen', lang:'Wegen: hoe diep reikt de verandering?'},
  {id:'verbinden', nr:5, naam:'Verbinden', lang:'Verbinden: welke verandering maakte welke mogelijk?'},
  {id:'duiden', nr:6, naam:'Duiden', lang:'Samen duiden en besluiten'},
  {id:'rapport', naam:'Rapport'}
];

/* ---------- Staat ---------- */
function geldig(d){ return d && d.versie === 1 && d.project && Array.isArray(d.veranderingen) && Array.isArray(d.documenten); }
function heel(d){
  d.aannames = d.aannames || []; d.besluiten = d.besluiten || []; d.duiding = d.duiding || {};
  d.veranderingen.forEach(v => { v.bronnen = v.bronnen || []; v.navraag = Object.assign({status:'geen',bij:'',datum:'',klopt:'',bijdrage:'',citaat:'',anders:''}, v.navraag || {}); v.status = v.status || 'opgenomen'; });
  d.volgnr = Math.max(d.volgnr || 0, ...d.veranderingen.map(v => v.id), 0);
  return d;
}
function laad(){
  try { const t = localStorage.getItem(SLEUTEL); if (t) { const d = JSON.parse(t); if (geldig(d)) return heel(d); } } catch (e) {}
  return heel(voorbeeld());
}
let S = laad();
let bewaarT = 0;
function bewaar(){ clearTimeout(bewaarT); bewaarT = setTimeout(() => { try { localStorage.setItem(SLEUTEL, JSON.stringify(S)); } catch (e) {} }, 120); }
const UI = {scherm:'overzicht', lade:null, bewerk:false, sorteer:'nr', koppel:null, agent:null, vol:null, sessie:null, eigen:null, loop:0, nieuwId:null};
let SAMPLE, DOWNLOADS;   // undefined: nog niet bekend; null: niet beschikbaar
if (window.claude && typeof window.claude.use === 'function') {
  window.claude.use('sample').then(s => { SAMPLE = s || null; if (UI.scherm === 'verzamelen') teken(); }, () => { SAMPLE = null; });
  window.claude.use('downloads').then(d => { DOWNLOADS = d || null; teken(); }, () => { DOWNLOADS = null; });
} else { SAMPLE = null; DOWNLOADS = null; }

const vind = id => S.veranderingen.find(v => v.id === +id);
const inOogst = () => S.veranderingen.filter(v => v.status === 'opgenomen');
const wij = () => S.project.wij || 'wij';

/* ---------- Kleine bouwstenen ---------- */
const labelHtml = k => { const l = LABELS[k] || LABELS.aanwijzing; return '<span class="zeker"><span class="treden" data-n="' + l.n + '" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' + h(l.naam) + '</span>'; };
const laagHtml = n => n ? '<span class="laag laag-' + n + '">' + h(LAGEN[n].naam) + '</span>' : '<span class="laag laag-0">Nog niet gewogen</span>';
const soortHtml = s => s === 'terug' ? '<span class="tag tag-rood">Stap terug</span>' : s === 'afgewend' ? '<span class="tag tag-geel">Verslechtering afgewend</span>' : '';
const leegBlok = (tekst, knoppen) => '<div class="leeg"><span class="ei-vorm" aria-hidden="true"></span><div class="stapel"><p>' + tekst + '</p>' + (knoppen ? '<div class="rij">' + knoppen + '</div>' : '') + '</div></div>';
const opties = (lijst, gekozen) => lijst.map(o => '<option value="' + h(o[0]) + '"' + (String(o[0]) === String(gekozen == null ? '' : gekozen) ? ' selected' : '') + '>' + h(o[1]) + '</option>').join('');
const laagOpties = g => opties([[0,'Nog niet gewogen'],[1,'1 Middelen'],[2,'2 Signalen'],[3,'3 Spelregels'],[4,'4 Bedoeling']], g || 0);
function toast(t){ const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 4200); }
async function kopieer(tekst, klaar){
  try { await navigator.clipboard.writeText(tekst); toast(klaar || 'Gekopieerd.'); }
  catch (e) { dialoog('<h2 class="subtitel">Kopieer de tekst</h2><p class="klein">Kopiëren ging niet vanzelf. Selecteer de tekst hieronder en kopieer die.</p><textarea id="kopie-veld" rows="8" readonly>' + h(tekst) + '</textarea><div class="rij"><button class="btn btn-rood" data-a="dialoog-uit">Sluit</button></div>'); const v = $('#kopie-veld'); v.focus(); v.select(); }
}
async function geefBestand(naam, inhoud, soort){
  if (OMG === 'artifact') {
    if (!DOWNLOADS) { toast('Bewaren als bestand kan hier niet. Kopieer de tekst of open de losse versie.'); return; }
    try { await DOWNLOADS.save({filename: naam, data: inhoud}); toast('Bewaard: ' + naam); }
    catch (e) { if (e && e.code !== 'declined') toast('Bewaren is niet gelukt. Probeer het opnieuw.'); }
    return;
  }
  const url = URL.createObjectURL(new Blob([inhoud], {type: soort || 'application/octet-stream'}));
  const a = document.createElement('a'); a.href = url; a.download = naam; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Bewaard: ' + naam);
}
const b64 = t => btoa(String.fromCharCode.apply(null, new TextEncoder().encode(t))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64 = t => { const s = atob(t.replace(/-/g,'+').replace(/_/g,'/')); return new TextDecoder().decode(Uint8Array.from(s, c => c.charCodeAt(0))); };
const slak = t => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'oogst';

/* ---------- Afgeleid: ketens, advies, stand, wat valt op ---------- */
function ketens(){
  const vs = inOogst(), ids = new Set(vs.map(v => v.id)), kind = {};
  vs.forEach(v => { if (v.bouwtOp && ids.has(v.bouwtOp)) (kind[v.bouwtOp] = kind[v.bouwtOp] || []).push(v); });
  const uit = [];
  const loop = (pad, v) => { const ks = (kind[v.id] || []).slice().sort((a, b) => (a.wanneer || '').localeCompare(b.wanneer || '')); if (!ks.length) { if (pad.length > 1) uit.push(pad); return; } ks.forEach(k => { if (!pad.includes(k)) loop(pad.concat(k), k); }); };
  vs.filter(v => !(v.bouwtOp && ids.has(v.bouwtOp))).forEach(v => loop([v], v));
  return uit;
}
const ketenNaam = k => { const l = k[k.length-1]; return (l.keten && l.keten.naam) || 'Van “' + k[0].titel + '” naar “' + l.titel + '”'; };
function advies(v){
  if (v.label === 'bevestigd' || v.label === 'verschil') return {soort:'klaar', tekst:'Klaar. De partij heeft geantwoord.'};
  if (v.navraag.status === 'verstuurd') return {soort:'wacht', tekst:'Verstuurd op ' + datumNl(v.navraag.datum) + '. Wacht op antwoord.'};
  const schakel = v.bouwtOp || S.veranderingen.some(x => x.bouwtOp === v.id && x.status === 'opgenomen');
  if (v.laag >= 3) return {soort:'doen', tekst:'Navragen. Een diepe verandering wil je bevestigd hebben.'};
  if (schakel) return {soort:'doen', tekst:'Navragen. Dit is een schakel in een keten.'};
  if (v.label === 'vermoeden') return {soort:'doen', tekst:'Navragen of aanvullen. Dit is nog een vermoeden.'};
  if (v.label === 'aanwijzing') return {soort:'doen', tekst:'Navragen. Er is nog maar één bron.'};
  return {soort:'kan', tekst:'Kan. De verandering staat vast; de bijdrage is nog alleen jullie eigen verhaal.'};
}
function stand(){
  const vs = inOogst();
  return {
    n: vs.length,
    ongelezen: S.documenten.filter(d => !d.gelezen).length,
    voorstellen: S.veranderingen.filter(v => v.status === 'voorstel').length,
    navraagDoen: vs.filter(v => advies(v).soort === 'doen').length,
    navraagWacht: vs.filter(v => v.navraag.status === 'verstuurd').length,
    nagevraagd: vs.filter(v => v.navraag.status === 'ontvangen').length,
    ongewogen: vs.filter(v => !v.laag).length,
    ketens: ketens().length,
    terug: vs.filter(v => v.soort === 'terug').length,
    afgewend: vs.filter(v => v.soort === 'afgewend').length,
    geduid: VIJF_VRAGEN.filter(q => (S.duiding[q.id] || '').trim()).length,
    uit: S.veranderingen.filter(v => v.status === 'uit').length
  };
}
function openWerk(id){ const s = stand(); return id === 'verzamelen' ? s.ongelezen + s.voorstellen > 0 : id === 'navragen' ? s.navraagDoen + s.navraagWacht > 0 : id === 'wegen' ? s.ongewogen > 0 : false; }
function valtOp(){
  const vs = inOogst(), n = vs.length, uit = [];
  if (!n) return uit;
  const c = [0,0,0,0,0]; vs.forEach(v => c[v.laag || 0]++);
  const gewogen = n - c[0];
  if (gewogen) {
    const top = [1,2,3,4].sort((a, b) => c[b] - c[a])[0];
    const diep = c[3] + c[4];
    uit.push({kop: Hoofd(getal(c[top])) + ' van de ' + getal(n) + ' ' + (c[top] === 1 ? 'gaat' : 'gaan') + ' over ' + LAGEN[top].naam.toLowerCase() + '.',
      tekst: (top <= 2 ? 'Daar zit het meeste werk. ' : 'Het zwaartepunt ligt diep. ') + (diep ? 'Bij de ' + getal(c[3]) + ' in de spelregels en de ' + getal(c[4]) + ' in de bedoeling gaat het systeem zelf anders werken; dat blijft vaak ook langer.' : 'Nog geen verandering in de spelregels of de bedoeling. Het systeem doet hetzelfde, met meer of minder.')});
  }
  const ks = ketens();
  if (ks.length) {
    const dieper = ks.filter(k => (k[k.length-1].laag || 0) > (k[0].laag || 0));
    uit.push({kop: dieper.length ? 'De diepe verandering begon klein.' : Hoofd(getal(ks.length)) + (ks.length === 1 ? ' keten' : ' ketens') + ': de ene verandering maakte de andere mogelijk.',
      tekst: (dieper.length ? dieper : ks).slice(0, 3).map(k => 'Van “' + k[0].titel + '”' + (k[0].laag ? ' (' + LAGEN[k[0].laag].naam.toLowerCase() + ')' : '') + ' naar “' + k[k.length-1].titel + '”' + (k[k.length-1].laag ? ' (' + LAGEN[k[k.length-1].laag].naam.toLowerCase() + ')' : '') + '.').join(' ') + (ks.length > 3 ? ' En nog ' + getal(ks.length - 3) + ' andere.' : '') + ' Wie de eerste stap vastlegt, ziet waar de volgende zit.'});
  } else if (n > 2) uit.push({kop:'Er zijn nog geen ketens gelegd.', tekst:'Kijk bij Verbinden welke verandering een andere mogelijk maakte.'});
  const bev = vs.filter(v => v.label === 'bevestigd' || v.label === 'verschil').length, ver = vs.filter(v => v.label === 'verschil').length;
  if (bev) uit.push({kop: ver ? Hoofd(getal(ver)) + ' keer woog de ander onze rol anders.' : Hoofd(getal(bev)) + ' van de ' + getal(n) + ' zijn bevestigd.',
    tekst: Hoofd(getal(bev)) + ' van de ' + getal(n) + ' veranderingen zijn bevestigd door de partij die veranderde.' + (ver ? ' Bij ' + getal(ver) + ' daarvan noemt die partij ook het eigen aandeel. Beide lezingen staan in de oogst naast elkaar.' : '')});
  const t = vs.filter(v => v.soort === 'terug').length, a = vs.filter(v => v.soort === 'afgewend').length;
  if (t + a) uit.push({kop: [t ? Hoofd(getal(t)) + (t === 1 ? ' stap terug' : ' stappen terug') : '', a ? (t ? getal(a) : Hoofd(getal(a))) + (a === 1 ? ' verslechtering die uitbleef' : ' verslechteringen die uitbleven') : ''].filter(Boolean).join(' en ') + '.',
    tekst:'Ook die horen in de oogst. Een stap terug laat zien waar de grens van jullie invloed lag; een verslechtering die uitbleef is winst die je anders niet ziet.'});
  const open = [];
  const verm = vs.filter(v => v.label === 'vermoeden').length, aanw = vs.filter(v => v.label === 'aanwijzing').length;
  if (verm) open.push(getal(verm) + (verm === 1 ? ' vermoeden' : ' vermoedens'));
  if (aanw) open.push(getal(aanw) + (aanw === 1 ? ' aanwijzing' : ' aanwijzingen') + ' met één bron');
  if (c[0]) open.push(getal(c[0]) + ' nog niet gewogen');
  if (open.length) uit.push({kop:'Nog niet alles staat vast.', tekst: Hoofd(open.join(', ')) + '. Weeg mee hoe zwaar je daarop leunt.'});
  return uit;
}

/* ---------- De oogstkaart: tijd horizontaal, diepte verticaal ---------- */
const EI = 'M0,-15.5 C7.4,-15.5 12,-5 12,3.2 C12,10.6 6.6,15.5 0,15.5 C-6.6,15.5 -12,10.6 -12,3.2 C-12,-5 -7.4,-15.5 0,-15.5Z';
function kaart(modus){
  const vs = inOogst();
  if (!vs.length) return leegBlok('De kaart vult zich zodra er veranderingen in de oogst staan.', '<button class="btn btn-rood btn-klein" data-a="ga" data-id="aanvullen">Voeg een verandering toe</button>');
  const banden = (vs.some(v => !v.laag) ? [0] : []).concat([1,2,3,4]);
  const W = 1000, L = 138, R = 26, T = 36, BH = 112, H = T + banden.length * BH + 6;
  const mnd = v => { if (!v.wanneer) return null; const p = v.wanneer.split('-').map(Number); return p[0] * 12 + p[1] - 1; };
  const ms = vs.map(mnd).filter(x => x != null);
  let m0, m1;
  if (ms.length) { m0 = Math.min.apply(null, ms) - 1; m1 = Math.max.apply(null, ms) + 1; } else { const d = new Date(); m0 = d.getFullYear() * 12; m1 = m0 + 12; }
  if (m1 - m0 < 6) m1 = m0 + 6;
  const x = m => L + 22 + (m - m0) / (m1 - m0) * (W - L - R - 44);
  const stap = m1 - m0 > 30 ? 6 : 3;
  let o = '<svg class="oogstkaart" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Oogstkaart: tijd van links naar rechts, diepte van boven naar beneden">';
  o += '<defs><marker id="pijl" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.6 L10,5 L0,9.4 Z" fill="#000"/></marker></defs>';
  o += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>';
  const KL = ['#fff','#dcebe9','#a6cac8','#2f6f76','#00454e'];
  banden.forEach((b, i) => {
    const y = T + i * BH, licht = b <= 2;
    o += '<rect x="0" y="' + y + '" width="' + W + '" height="' + BH + '" fill="' + KL[b] + '"/>';
    if (b === 0) o += '<line x1="0" x2="' + W + '" y1="' + (y + BH) + '" y2="' + (y + BH) + '" stroke="#c83f27" stroke-width="1" stroke-dasharray="4 3"/>';
    o += '<text x="16" y="' + (y + 28) + '" font-size="15" letter-spacing=".8" fill="' + (licht ? '#000' : '#fff') + '">' + (b ? b + '  ' + LAGEN[b].naam.toUpperCase() : 'NOG NIET GEWOGEN') + '</text>';
  });
  for (let m = Math.ceil(m0 / stap) * stap; m <= m1; m += stap) {
    const xx = x(m);
    o += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (T - 6) + '" y2="' + (H - 6) + '" stroke="#000" stroke-opacity=".14" stroke-width="1"/>';
    o += '<text x="' + xx + '" y="' + (T - 14) + '" font-size="13" text-anchor="middle" fill="#3a3a3a">' + MND[m % 12] + ' ' + Math.floor(m / 12) + '</text>';
  }
  const pos = {};
  banden.forEach((b, i) => {
    const rij = [], ps = [];
    vs.filter(v => (v.laag || 0) === b).map(v => ({v: v, x: x(mnd(v) == null ? m1 : mnd(v))})).sort((a, c) => a.x - c.x).forEach(p => {
      let r = 0; while (rij[r] != null && p.x - rij[r] < 40) r++;
      rij[r] = p.x; p.r = Math.min(r, 2); ps.push(p);
    });
    const hoog = [[58], [34, 82], [26, 58, 90]][Math.min(rij.length, 3) - 1] || [58];
    ps.forEach(p => { pos[p.v.id] = {x: p.x, y: T + i * BH + hoog[p.r]}; });
  });
  vs.forEach(v => {
    const a = pos[v.bouwtOp], b = pos[v.id]; if (!v.bouwtOp || !a) return;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const sx = a.x + ux * 19, sy = a.y + uy * 19, ex = b.x - ux * 23, ey = b.y - uy * 23;
    const cx = (sx + ex) / 2 + uy * 22, cy = (sy + ey) / 2 - ux * 22;
    const pad = 'M' + sx.toFixed(1) + ',' + sy.toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1);
    o += '<path d="' + pad + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="' + pad + '" fill="none" stroke="#000" stroke-width="2" marker-end="url(#pijl)"/>';
  });
  vs.forEach(v => {
    const p = pos[v.id], l = v.label;
    const vol = l === 'bevestigd' || l === 'verschil';
    const rand = l === 'vermoeden' ? ' stroke="#6b6560" stroke-width="2" stroke-dasharray="1.5 3.5" stroke-linecap="round"' : l === 'aanwijzing' ? ' stroke="#c83f27" stroke-width="2" stroke-dasharray="5 3"' : ' stroke="#c83f27" stroke-width="2.4"';
    const gekozen = modus === 'koppel' && UI.koppel === v.id;
    o += '<g class="knoop' + (gekozen ? ' gekozen' : '') + '" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')" tabindex="0" role="button" data-a="' + (modus === 'koppel' ? 'koppel' : 'open') + '" data-id="' + v.id + '" data-titel="' + h(v.id + ' · ' + v.titel) + '" aria-label="' + h(v.id + '. ' + v.titel + '. ' + (v.laag ? LAGEN[v.laag].naam : 'Nog niet gewogen') + ', ' + (LABELS[l] || LABELS.aanwijzing).naam + (v.soort !== 'vooruit' ? ', ' + SOORTEN[v.soort] : '')) + '">';
    o += '<path class="ring" d="' + EI + '" transform="scale(' + (l === 'verschil' ? 1.5 : 1.3) + ')" fill="#fff" stroke="#fff" stroke-width="2"/>';
    if (l === 'verschil') o += '<path d="' + EI + '" transform="scale(1.3)" fill="#fff" stroke="#c83f27" stroke-width="1.6"/>';
    o += '<path d="' + EI + '" fill="' + (vol ? '#c83f27' : '#fff') + '"' + rand + '/>';
    o += '<text y="2.5" dy=".35em" font-size="14.5" text-anchor="middle" fill="' + (vol ? '#fff' : '#000') + '">' + v.id + '</text>';
    if (v.soort === 'terug') o += '<path d="M-6,21 L6,21 L0,29 Z" fill="#000" stroke="#fff" stroke-width="1.5"/>';
    if (v.soort === 'afgewend') o += '<circle cx="12" cy="-13" r="5.5" fill="#fac618" stroke="#000" stroke-width="1.4"/>';
    o += '</g>';
  });
  return '<div class="kaartwrap">' + o + '</svg></div><p class="klein kaartbij" id="kaartbij" aria-live="polite">' + (modus === 'koppel' ? 'Kies eerst de verandering die er eerst was. Kies daarna de verandering die erop voortbouwt.' : 'Kies een verandering op de kaart voor het hele verhaal.') + '</p>';
}
function legenda(){
  const ei = (in_, extra) => '<svg width="22" height="28" viewBox="-15 -19 30 38" aria-hidden="true">' + (extra || '') + '<path d="' + EI + '" ' + in_ + '/></svg>';
  return '<div class="legenda">' +
    '<span>' + ei('fill="#c83f27" stroke="#c83f27" stroke-width="2"') + 'Bevestigd</span>' +
    '<span>' + ei('fill="#c83f27" stroke="#c83f27" stroke-width="2" transform="scale(.8)"', '<path d="' + EI + '" transform="scale(1.12)" fill="#fff" stroke="#c83f27" stroke-width="1.6"/>') + 'Bevestigd, met verschil van inzicht</span>' +
    '<span>' + ei('fill="#fff" stroke="#c83f27" stroke-width="2.4"') + 'Onderbouwd</span>' +
    '<span>' + ei('fill="#fff" stroke="#c83f27" stroke-width="2" stroke-dasharray="5 3"') + 'Aanwijzing</span>' +
    '<span>' + ei('fill="#fff" stroke="#6b6560" stroke-width="2" stroke-dasharray="1.5 3.5" stroke-linecap="round"') + 'Vermoeden</span>' +
    '<span><svg width="16" height="14" viewBox="-8 -1 16 12" aria-hidden="true"><path d="M-6,1 L6,1 L0,9 Z" fill="#000"/></svg>Stap terug</span>' +
    '<span><svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="5.5" fill="#fac618" stroke="#000" stroke-width="1.4"/></svg>Verslechtering afgewend</span>' +
    '<span><svg width="30" height="12" viewBox="0 0 30 12" aria-hidden="true"><path d="M1,6 L22,6" stroke="#000" stroke-width="2"/><path d="M20,1.5 L29,6 L20,10.5 Z" fill="#000"/></svg>Maakte mogelijk</span></div>';
}

/* ---------- Schermen ---------- */
function kaartVk(v){
  return '<button class="vk" data-a="open" data-id="' + v.id + '"><span class="nr">' + v.id + '</span><h3>' + h(v.titel) + '</h3><p class="meta">' + h(v.wie) + ', ' + maand(v.wanneer) + '</p><div class="tags">' + laagHtml(v.laag) + labelHtml(v.label) + soortHtml(v.soort) + '</div></button>';
}
function schermkop(s, lead){
  return '<div class="schermkop">' + (s.nr ? '<p class="oog">Stap ' + s.nr + ' van 6</p>' : '') + '<h2 class="titel">' + h(s.lang || s.naam) + '</h2><p class="lead">' + lead + '</p></div>';
}
function sOverzicht(){
  const s = stand(), vs = inOogst();
  const stapTekst = {
    verzamelen: s.ongelezen ? '<span class="open">' + Hoofd(getal(s.ongelezen)) + ' document nog niet gelezen</span>' : s.voorstellen ? '<span class="open">' + Hoofd(getal(s.voorstellen)) + (s.voorstellen === 1 ? ' vondst wacht' : ' vondsten wachten') + ' op jullie keuze</span>' : '<span>' + S.documenten.length + ' documenten gelezen</span>',
    aanvullen: '<span>' + vs.filter(v => v.herkomst === 'team').length + ' aangevuld door het team</span>',
    navragen: (s.navraagDoen + s.navraagWacht) ? '<span class="open">' + s.nagevraagd + ' beantwoord, ' + (s.navraagDoen ? s.navraagDoen + ' aan te raden' : '') + (s.navraagDoen && s.navraagWacht ? ', ' : '') + (s.navraagWacht ? s.navraagWacht + ' staat uit' : '') + '</span>' : '<span>' + s.nagevraagd + ' beantwoord</span>',
    wegen: s.ongewogen ? '<span class="open">' + Hoofd(getal(s.ongewogen)) + ' nog niet gewogen</span>' : '<span>Alle ' + s.n + ' gewogen</span>',
    verbinden: '<span>' + Hoofd(getal(s.ketens)) + (s.ketens === 1 ? ' keten' : ' ketens') + ' gelegd</span>',
    duiden: '<span>' + s.geduid + ' van de 5 vragen besproken, ' + S.besluiten.length + (S.besluiten.length === 1 ? ' besluit' : ' besluiten') + '</span>'
  };
  let o = '<div class="schermkop"><h2 class="titel">De oogst in één oogopslag</h2><p class="lead">' + (S.project.fictief ? 'Dit is een gevulde oogst van een verzonnen coalitie. Loop de zes stappen door en zie hoe een oogst groeit.' : 'Zo staat jullie oogst ervoor. Kies een stap om verder te werken.') + '</p></div>';
  if (!vs.length && !s.voorstellen) {
    return o + leegBlok('Deze oogst is nog leeg. Begin met de documenten die er al liggen, of voeg zelf een eerste verandering toe.', '<button class="btn btn-rood" data-a="ga" data-id="verzamelen">Begin bij Verzamelen</button><button class="btn btn-lijn" data-a="ga" data-id="aanvullen">Voeg een verandering toe</button><button class="btn btn-stil" data-a="project">Naam en periode</button>');
  }
  o += '<div class="cijfers"><div><b class="cijfer">' + s.n + '</b><span>veranderingen bij anderen</span></div><div><b class="cijfer">' + s.nagevraagd + '</b><span>nagevraagd bij de partij die veranderde</span></div><div><b class="cijfer">' + s.ketens + '</b><span>' + (s.ketens === 1 ? 'keten' : 'ketens') + ': de ene verandering maakte de andere mogelijk</span></div><div><b class="cijfer">' + s.terug + '</b><span>' + (s.terug === 1 ? 'stap terug, die er ook bij hoort' : 'stappen terug, die er ook bij horen') + '</span></div></div>';
  o += '<section class="stapel"><h3 class="tussenkop">Voortgang per stap</h3><div class="voortgang">' + SCHERMEN.filter(x => x.nr).map(x => '<button data-a="ga" data-id="' + x.id + '"><span class="nr">' + x.nr + '</span><b>' + x.naam + '</b>' + stapTekst[x.id] + '</button>').join('') + '</div></section>';
  o += '<section class="stapel"><div class="kopregel"><h3 class="tussenkop">De oogstkaart</h3><p class="klein">Tijd van links naar rechts, diepte van boven naar beneden</p></div>' + kaart() + legenda() + '</section>';
  const lijst = vs.slice().sort(UI.sorteer === 'tijd' ? (a, b) => (a.wanneer || '').localeCompare(b.wanneer || '') : UI.sorteer === 'diepte' ? (a, b) => (b.laag || 0) - (a.laag || 0) || a.id - b.id : (a, b) => a.id - b.id);
  o += '<section class="stapel"><div class="kopregel"><h3 class="tussenkop">De ' + (s.n === 1 ? 'verandering' : getal(s.n) + ' veranderingen') + '</h3><label class="rij klein" for="sorteer">Volgorde <select id="sorteer" data-c="sorteer" style="width:auto;min-height:36px">' + opties([['nr','Nummer'],['tijd','Tijd'],['diepte','Diepte']], UI.sorteer) + '</select></label></div><div class="lijst">' + lijst.map(kaartVk).join('') + '</div></section>';
  if (s.uit) o += '<p class="klein">' + Hoofd(getal(s.uit)) + (s.uit === 1 ? ' verandering is' : ' veranderingen zijn') + ' uit de oogst gehaald omdat de partij de verandering niet herkende: ' + S.veranderingen.filter(v => v.status === 'uit').map(v => '<button class="link" data-a="open" data-id="' + v.id + '">' + h(v.titel) + '</button>').join(', ') + '.</p>';
  o += '<div class="rij"><button class="btn btn-stil btn-klein" data-a="project">Naam en periode aanpassen</button></div>';
  return o;
}

function alineaHtml(d, al, i){
  const klaar = i < (d.voortgang || 0), leest = UI.agent && UI.agent.doc === d.id && UI.agent.i === i;
  let o = '<div class="alinea' + (leest ? ' leest' : '') + (klaar ? ' ' + al.oordeel : '') + (!klaar && !leest ? ' wacht' : '') + '"><b>' + h(al.kop) + '</b><p>' + h(al.tekst) + '</p>';
  if (leest) o += '<p class="agentlog"><span class="puls"></span>De agent leest deze alinea</p>';
  if (klaar) {
    const tag = {nieuw:'<span class="tag tag-rood">Nieuwe verandering</span>', activiteit:'<span class="tag tag-wit">Activiteit van jezelf</span>', bekend:'<span class="tag tag-groen">Al in de oogst</span>', niets:'<span class="tag tag-wit">Niets</span>'}[al.oordeel];
    o += '<div class="oordeel">' + tag + '<span>' + h(al.uitleg) + '</span></div>';
    if (al.oordeel === 'bekend' && al.van) o += '<div class="oordeel"><span class="tag">Extra bron</span><span>Het label van verandering ' + al.bijVerandering + ' gaat omhoog: van ' + LABELS[al.van].naam.toLowerCase() + ' naar ' + LABELS[al.naar].naam.toLowerCase() + '.</span></div>';
    const v = al.vid && vind(al.vid);
    if (v) o += voorstelHtml(v, al.vondst && al.vondst.waarom);
  }
  return o + '</div>';
}
function voorstelHtml(v, waarom){
  let o = '<div class="voorstel"><div class="tags rij">' + labelHtml('vermoeden') + laagHtml(v.laag) + '</div><p class="t">' + h(v.titel) + '</p><p class="klein">' + h(v.zin) + '</p>' + (waarom ? '<p class="klein">' + h(waarom) + '</p>' : '');
  if (v.status === 'voorstel') o += '<div class="rij"><button class="btn btn-rood btn-klein" data-a="neem-op" data-id="' + v.id + '">Neem op in de oogst</button><button class="btn btn-lijn btn-klein" data-a="wijs-af" data-id="' + v.id + '">Niet opnemen</button></div>';
  else if (v.status === 'opgenomen') o += '<p class="klein"><b>Opgenomen als verandering ' + v.id + '.</b> Nog door niemand bevestigd: vul aan of vraag na. <button class="link" data-a="open" data-id="' + v.id + '">Bekijk</button></p>';
  else o += '<p class="klein"><b>Niet opgenomen.</b> <button class="link" data-a="neem-op" data-id="' + v.id + '">Toch opnemen</button></p>';
  return o + '</div>';
}
function sVerzamelen(){
  const s = SCHERMEN[1];
  let o = schermkop(s, 'Jaarverslagen, notulen, nieuwsbrieven, Kamerstukken: er ligt meer dan je denkt. Een AI-agent leest mee en zoekt wat een ander anders ging doen. Het team beslist wat in de oogst komt.');
  o += '<div class="twee"><div class="stapel"><h3 class="tussenkop">Documenten</h3>';
  if (!S.documenten.length) o += leegBlok('Nog geen documenten. Zet hieronder op de lijst wat er al ligt.');
  S.documenten.forEach(d => {
    const bezig = UI.agent && UI.agent.doc === d.id, deels = (d.voortgang || 0) > 0 && !d.gelezen;
    o += '<article class="doc' + (d.gelezen ? '' : ' ongelezen') + '"><div class="kopregel"><h3>' + h(d.titel) + '</h3>' + (d.gelezen ? '<span class="tag tag-wit">Gelezen</span>' : '<span class="tag tag-geel">Nog niet gelezen</span>') + '</div><p class="klein">' + h([d.soort, d.datum ? maand(d.datum) : '', d.omvang].filter(Boolean).join(' · ')) + (d.gelezen ? ' · ' + (d.vondsten || 0) + (d.vondsten === 1 ? ' vondst' : ' vondsten') : '') + '</p>';
    if (d.alineas) {
      if (!d.gelezen && !bezig) o += '<div class="rij"><button class="btn btn-rood" data-a="agent" data-id="' + d.id + '">' + (deels ? 'Laat de agent verder lezen' : 'Laat de agent lezen') + '</button><span class="klein">' + d.alineas.length + ' alinea\'s, alinea voor alinea</span></div>';
      if (bezig) o += '<div class="rij"><p class="agentlog" role="status"><span class="puls"></span>Leest alinea ' + (UI.agent.i + 1) + ' van ' + d.alineas.length + '</p><button class="btn btn-stil btn-klein" data-a="agent-snel">Sla het wachten over</button></div>';
      if (bezig || d.gelezen || deels) o += '<div class="stapel alineas">' + d.alineas.map((al, i) => alineaHtml(d, al, i)).join('') + '</div>';
    } else if (!d.gelezen) o += '<div class="rij"><button class="btn btn-lijn btn-klein" data-a="doc-gelezen" data-id="' + d.id + '">Markeer als gelezen</button><button class="btn btn-stil btn-klein" data-a="doc-weg" data-id="' + d.id + '">Haal van de lijst</button></div>';
    o += '</article>';
  });
  o += '<form class="vlak formulier" data-f="doc-toe"><h3 class="tussenkop">Zet een document op de lijst</h3><div class="formrij"><label class="veld" for="doc-titel"><span>Titel</span><input type="text" id="doc-titel" name="titel" required></label><label class="veld" for="doc-soort"><span>Soort</span><input type="text" id="doc-soort" name="soort" placeholder="Jaarverslag, notulen, brief"></label></div><div class="rij"><button class="btn btn-lijn btn-klein">Zet op de lijst</button></div></form></div>';
  o += '<div class="stapel"><h3 class="tussenkop">Wat de agent doet</h3><div class="vlak stapel"><p>De agent leest alinea voor alinea en kiest uit vier uitkomsten:</p><ul class="stapel uitkomsten"><li><span class="tag tag-rood">Nieuwe verandering</span> Een ander ging iets anders doen. Label: vermoeden. Het team kiest: opnemen of niet.</li><li><span class="tag tag-wit">Activiteit van jezelf</span> Wat jullie zelf deden is geen verandering.</li><li><span class="tag tag-groen">Al in de oogst</span> Een extra bron. Het label gaat omhoog.</li><li><span class="tag tag-wit">Niets</span> Geen verandering en geen bron.</li></ul></div>';
  o += eigenHtml() + '</div></div>';
  return o;
}
function eigenHtml(){
  let o = '<div class="stapel"><h3 class="tussenkop">Eigen tekst laten lezen</h3>';
  if (OMG !== 'artifact' || SAMPLE === null) return o + '<div class="vlak"><p class="klein">' + (OMG === 'artifact' ? 'Claude is in deze weergave niet beschikbaar.' : 'In de besloten versie van de werkplaats (als Artifact in Claude) plak je hier een eigen tekst en zoekt Claude de veranderingen, met een voorstel voor de laag. In deze losse versie lees je mee met het voorbeeld hiernaast.') + '</p></div></div>';
  const e = UI.eigen;
  o += '<div class="vlak stapel"><label class="veld" for="eigen-tekst"><span>Plak een stuk tekst: een nieuwsbrief, notulen, een passage uit een jaarverslag</span><textarea id="eigen-tekst" rows="6">' + h(e ? e.tekst : '') + '</textarea><small>Claude zoekt veranderingen in drie delen en stelt een laag voor. Jij kiest wat in de oogst komt. De tekst gaat naar Claude via jouw eigen account.</small></label><div class="rij"><button class="btn btn-rood" data-a="eigen" ' + (e && e.status === 'bezig' ? 'disabled' : '') + '>Laat Claude lezen</button>' + (e && e.status === 'bezig' ? '<span class="agentlog" role="status"><span class="puls"></span>Claude leest en denkt na</span><button class="btn btn-stil btn-klein" data-a="eigen-stop">Stop</button>' : '') + '</div>';
  if (e && e.status === 'fout') o += '<p class="klein" role="alert">' + h(e.melding) + '</p>';
  if (e && e.status === 'klaar') {
    if (!e.items.length) o += '<p>Claude vond in deze tekst geen verandering bij een ander.</p>';
    e.items.forEach((it, i) => {
      o += '<div class="voorstel"><div class="tags rij">' + labelHtml('vermoeden') + laagHtml(it.laag) + soortHtml(it.soort) + '</div><p class="t">' + h(it.titel) + '</p><dl class="drie"><dt>Verandering</dt><dd>' + h(it.zin) + '</dd><dt>Voor wie maakt het verschil</dt><dd>' + h(it.betekenis || 'Staat niet in de tekst.') + '</dd><dt>Bijdrage</dt><dd>' + h(it.bijdrage || 'Staat niet in de tekst.') + (it.anderen ? ' ' + h(it.anderen) : '') + '</dd></dl>' + (it.waarom ? '<p class="klein">Voorstel voor de laag: ' + h(it.waarom) + '</p>' : '');
      o += it.vid ? '<p class="klein"><b>Opgenomen als verandering ' + it.vid + '.</b> <button class="link" data-a="open" data-id="' + it.vid + '">Bekijk</button></p>' : it.weg ? '<p class="klein"><b>Niet opgenomen.</b></p>' : '<div class="rij"><button class="btn btn-rood btn-klein" data-a="eigen-op" data-id="' + i + '">Neem op in de oogst</button><button class="btn btn-lijn btn-klein" data-a="eigen-weg" data-id="' + i + '">Niet opnemen</button></div>';
      o += '</div>';
    });
    if (e.activiteiten && e.activiteiten.length) o += '<div><p class="klein"><b>Activiteiten van jezelf, dus geen verandering:</b></p><ul class="klein punten">' + e.activiteiten.map(a => '<li>' + h(a) + '</li>').join('') + '</ul></div>';
  }
  return o + '</div></div>';
}

function veldenVerandering(v, pre){
  const id = n => pre + '-' + n;
  return '<label class="veld" for="' + id('titel') + '"><span>Korte naam</span><input type="text" id="' + id('titel') + '" name="titel" required maxlength="90" value="' + h(v.titel) + '"><small>Hooguit acht woorden, zoals een krantenkop.</small></label>' +
    '<label class="veld" for="' + id('zin') + '"><span>Wie deed wat anders?</span><textarea id="' + id('zin') + '" name="zin" required rows="3">' + h(v.zin) + '</textarea><small>Eén of twee zinnen. Het gaat om wat een ander ging doen: een besluit, een regel, geld, een werkwijze.</small></label>' +
    '<div class="formrij"><label class="veld" for="' + id('wie') + '"><span>Welke partij, en waar?</span><input type="text" id="' + id('wie') + '" name="wie" required value="' + h(v.wie) + '"><small>Een functie of organisatie, geen naam van een persoon.</small></label><label class="veld" for="' + id('wanneer') + '"><span>Wanneer?</span><input type="month" id="' + id('wanneer') + '" name="wanneer" value="' + h(v.wanneer) + '"></label></div>' +
    '<label class="veld" for="' + id('betekenis') + '"><span>Voor wie maakt het verschil?</span><textarea id="' + id('betekenis') + '" name="betekenis" rows="2">' + h(v.betekenis) + '</textarea></label>' +
    '<label class="veld" for="' + id('bijdrage') + '"><span>Wat deden wij?</span><textarea id="' + id('bijdrage') + '" name="bijdrage" rows="2">' + h(v.bijdrage) + '</textarea></label>' +
    '<label class="veld" for="' + id('anderen') + '"><span>Wie of wat droeg nog meer bij?</span><textarea id="' + id('anderen') + '" name="anderen" rows="2">' + h(v.anderen) + '</textarea><small>Bijna nooit deed je het alleen. Noem het hier, dat maakt je verhaal sterker.</small></label>' +
    '<label class="veld" for="' + id('soort') + '"><span>Wat voor verandering is het?</span><select id="' + id('soort') + '" name="soort">' + opties([['vooruit','Vooruit'],['terug','Stap terug'],['afgewend','Verslechtering afgewend']], v.soort) + '</select><small>Ook een stap terug telt mee, en een verslechtering die uitbleef.</small></label>';
}
function sAanvullen(){
  const s = SCHERMEN[2], vs = inOogst();
  let o = schermkop(s, 'Niet alles staat in documenten. Wat mensen weten en nog nergens opschreven, vul je hier aan: één verandering per keer.');
  const leegV = {titel:'', zin:'', wie:'', wanneer:'', betekenis:'', bijdrage:'', anderen:'', soort:'vooruit'};
  o += '<div class="twee"><form class="vlak formulier" data-f="aanvullen" id="form-aanvullen"><h3 class="tussenkop">Eén verandering</h3>' + veldenVerandering(leegV, 'av') +
    '<label class="veld" for="av-bron"><span>Hoe weet je dit?</span><input type="text" id="av-bron" name="bron" placeholder="Verteld door de projectleider, of de naam van een document"><small>Eén bron geeft het label aanwijzing. Een tweede, losse bron maakt het onderbouwd.</small></label>' +
    '<div class="rij"><button class="btn btn-rood">Voeg toe aan de oogst</button></div></form>';
  o += '<div class="stapel"><h3 class="tussenkop">Andere manieren om aan te vullen</h3><div class="vlak vlak-wit stapel"><p class="t-kop">Vragenlijst</p><p class="klein">Stuur collega\'s en partners de vragenlijst. Iedereen beschrijft één verandering, in dezelfde drie delen.</p><div><a class="btn btn-lijn btn-klein" href="' + SITE + 'Oogst%20je%20eigen%20verandering.html" target="_blank" rel="noopener">Open de vragenlijst</a></div></div><div class="vlak vlak-wit stapel"><p class="t-kop">Oogstgesprek</p><p class="klein">Liever praten dan schrijven? Een spraakassistent vraagt één verandering uit, vraagt door en vat samen.</p><div><a class="btn btn-lijn btn-klein" href="' + SITE + 'Oogstgesprek.html" target="_blank" rel="noopener">Open het Oogstgesprek</a></div></div>';
  const team = vs.filter(v => v.herkomst === 'team');
  o += '<h3 class="tussenkop">Aangevuld door het team</h3>' + (team.length ? '<div class="lijst">' + team.map(kaartVk).join('') + '</div>' : '<p class="klein">Nog niets aangevuld.</p>');
  const c = [0,0,0,0,0]; vs.forEach(v => c[v.laag || 0]++);
  const tips = [];
  if (vs.length && !vs.some(v => v.soort === 'terug')) tips.push('Er staat nog geen stap terug in de oogst. Is er iets verslechterd, ondanks jullie inzet?');
  if (vs.length && !vs.some(v => v.soort === 'afgewend')) tips.push('Is er een verslechtering uitgebleven doordat jullie er waren?');
  [2,3,4].forEach(l => { if (vs.length > 3 && !c[l]) tips.push('Nog niets in de laag ' + LAGEN[l].naam.toLowerCase() + '. ' + LAGEN[l].vraag); });
  if (tips.length) o += '<h3 class="tussenkop">Ontbreekt er iets?</h3><ul class="klein punten">' + tips.map(t => '<li>' + h(t) + '</li>').join('') + '</ul>';
  return o + '</div></div>';
}

function sNavragen(){
  const s = SCHERMEN[3], vs = inOogst();
  let o = schermkop(s, 'Je vraagt de partij die veranderde of het klopt: de verandering én jullie bijdrage. Dat hoeft niet bij alles. Het advies per verandering zie je hieronder.');
  if (!vs.length) return o + leegBlok('Er staat nog niets in de oogst om na te vragen.', '<button class="btn btn-rood btn-klein" data-a="ga" data-id="aanvullen">Voeg een verandering toe</button>');
  const tagA = {doen:'<span class="tag tag-rood">Navragen</span>', kan:'<span class="tag tag-wit">Kan</span>', wacht:'<span class="tag tag-geel">Staat uit</span>', klaar:'<span class="tag tag-groen">Klaar</span>'};
  o += '<div class="tabelwrap"><table><thead><tr><th>Verandering</th><th>Bij wie</th><th>Hoe zeker</th><th>Advies</th><th><span class="sr">Doen</span></th></tr></thead><tbody>';
  vs.slice().sort((a, b) => ({doen:0, wacht:1, kan:2, klaar:3}[advies(a).soort] - {doen:0, wacht:1, kan:2, klaar:3}[advies(b).soort]) || a.id - b.id).forEach(v => {
    const a = advies(v);
    o += '<tr><td><button class="link t" data-a="open" data-id="' + v.id + '">' + v.id + ' · ' + h(v.titel) + '</button><div class="klein">' + laagHtml(v.laag) + '</div></td><td><label class="sr" for="bij-' + v.id + '">Bij wie vraag je na, voor verandering ' + v.id + '</label><input type="text" id="bij-' + v.id + '" class="smal" data-c="bij" data-id="' + v.id + '" value="' + h(v.navraag.bij) + '" placeholder="Functie bij de partij"></td><td>' + labelHtml(v.label) + '</td><td>' + tagA[a.soort] + '<div class="klein">' + h(a.tekst) + '</div></td><td><div class="stapel smalknoppen">';
    if (a.soort !== 'klaar') {
      o += '<button class="btn btn-rood btn-klein" data-a="ontvanger" data-id="' + v.id + '">Bekijk wat de ontvanger ziet</button>';
      if (OMG !== 'artifact') o += '<button class="btn btn-lijn btn-klein" data-a="navraaglink" data-id="' + v.id + '">Kopieer navraaglink</button>';
    } else o += '<button class="btn btn-stil btn-klein" data-a="open" data-id="' + v.id + '">Lees het antwoord</button>';
    o += '</div></td></tr>';
  });
  o += '</tbody></table></div>';
  o += '<div class="twee gelijk"><div class="vlak stapel"><h3 class="tussenkop">Wat er met het antwoord gebeurt</h3><ul class="punten"><li>Bevestigt de partij de verandering en de bijdrage, dan wordt het label <b>bevestigd</b>.</li><li>Weegt de partij de bijdrage anders, dan blijven beide lezingen staan: <b>bevestigd, met verschil van inzicht</b>.</li><li>Ontkent de partij de verandering, dan gaat die <b>uit de oogst</b>.</li></ul><p class="klein">Het label wordt direct bijgewerkt zodra het antwoord binnen is.</p></div>';
  if (OMG !== 'artifact') o += '<form class="vlak stapel" data-f="antwoordcode"><h3 class="tussenkop">Antwoord ontvangen?</h3><label class="veld" for="code"><span>Plak hier de antwoordcode</span><textarea id="code" name="code" rows="3" class="mono" placeholder="OOGST-..." required></textarea><small>De ontvanger krijgt na het invullen een code om terug te sturen. Zo werkt navraag ook zonder server: jij stuurt de link, de ander stuurt de code.</small></label><div class="rij"><button class="btn btn-rood btn-klein">Verwerk het antwoord</button></div></form>';
  else o += '<div class="vlak stapel"><h3 class="tussenkop">Probeer het uit</h3><p>Kies bij een verandering <b>Bekijk wat de ontvanger ziet</b> en vul het formulier in als de ander. Je ziet het label direct veranderen.</p></div>';
  return o + '</div>';
}

function sWegen(){
  const s = SCHERMEN[4], vs = inOogst();
  let o = schermkop(s, 'Het systeem: de partijen rond het vraagstuk en hoe zij samen werken, met hun geld, hun regels en hun kijk op mensen. Hoe dieper een verandering reikt, hoe meer het systeem zelf anders gaat werken; dat blijft vaak ook langer.');
  if (!vs.length) return o + leegBlok('Er staat nog niets in de oogst om te wegen.', '<button class="btn btn-rood btn-klein" data-a="ga" data-id="aanvullen">Voeg een verandering toe</button>');
  o += '<div class="vuist"><div><b>Vuistregel 1</b>Een nieuw getal in een bestaande regel is middelen. Een nieuwe regel is spelregels.</div><div><b>Vuistregel 2</b>Een beter signaal voor wie al stuurt is signalen. Informatie of zeggenschap voor een andere partij is spelregels.</div></div>';
  o += '<p class="klein">Sleep een verandering naar een laag, of kies de laag in de keuzelijst.</p><div class="water">';
  const chip = v => '<div class="chip" draggable="true" data-id="' + v.id + '"><span class="nr">' + v.id + '</span><button class="t link-stil" data-a="open" data-id="' + v.id + '">' + h(v.titel) + '</button><label class="sr" for="laag-' + v.id + '">Laag van verandering ' + v.id + '</label><select id="laag-' + v.id + '" data-c="laag" data-id="' + v.id + '">' + laagOpties(v.laag) + '</select></div>';
  const nul = vs.filter(v => !v.laag);
  if (nul.length) o += '<div class="band band-0" data-laag="0"><div><h3>Nog niet gewogen</h3><p class="uitleg">Stel bij elke verandering de vier vragen, van boven naar beneden.</p></div><div class="chips">' + nul.map(chip).join('') + '</div></div>';
  o += '<svg class="golf" viewBox="0 0 1200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M0,14 L0,7 Q25,0 50,7 T100,7 T150,7 T200,7 T250,7 T300,7 T350,7 T400,7 T450,7 T500,7 T550,7 T600,7 T650,7 T700,7 T750,7 T800,7 T850,7 T900,7 T950,7 T1000,7 T1050,7 T1100,7 T1150,7 T1200,7 L1200,14 Z" fill="#dcebe9"/></svg>';
  [1,2,3,4].forEach(l => {
    const lijst = vs.filter(v => v.laag === l);
    o += '<div class="band band-' + l + (l >= 3 ? ' donker' : '') + '" data-laag="' + l + '"><div><h3>' + l + ' ' + LAGEN[l].naam + '</h3><p class="uitleg"><b>' + LAGEN[l].vraag + '</b> ' + LAGEN[l].uitleg + '</p></div><div class="chips">' + (lijst.length ? lijst.map(chip).join('') : '<p class="uitleg">Nog geen verandering in deze laag.</p>') + '</div></div>';
  });
  return o + '</div>';
}

function sVerbinden(){
  const s = SCHERMEN[5], vs = inOogst(), ks = ketens();
  let o = schermkop(s, 'Veranderingen komen zelden alleen. Een keten laat zien hoe jullie werken en waar de volgende stap zit.');
  if (vs.length < 2) return o + leegBlok('Voor een keten heb je minstens twee veranderingen nodig.', '<button class="btn btn-rood btn-klein" data-a="ga" data-id="aanvullen">Voeg een verandering toe</button>');
  o += '<section class="stapel">' + kaart('koppel') + '<div class="rij">' + (UI.koppel ? '<span class="tag tag-geel">Gekozen: ' + UI.koppel + ' · ' + h(vind(UI.koppel).titel) + '</span><button class="btn btn-stil btn-klein" data-a="koppel-stop">Kies opnieuw</button>' : '') + '</div>' + legenda() + '</section>';
  o += '<div class="twee gelijk"><section class="stapel"><h3 class="tussenkop">' + (ks.length ? 'De ' + (ks.length === 1 ? 'keten' : getal(ks.length) + ' ketens') : 'Nog geen ketens') + '</h3>';
  if (!ks.length) o += '<p class="klein">Kies op de kaart twee veranderingen, of gebruik de lijst hiernaast.</p>';
  ks.forEach(k => {
    const l = k[k.length-1];
    o += '<div class="vlak stapel keten"><p class="t-kop">' + h(ketenNaam(k)) + '</p><ol class="schakels">' + k.map(v => '<li><button class="link-stil" data-a="open" data-id="' + v.id + '"><span class="nr">' + v.id + '</span> ' + h(v.titel) + '</button> ' + laagHtml(v.laag) + '</li>').join('') + '</ol><label class="veld" for="keten-' + l.id + '"><span class="klein">Hoe maakte de ene de andere mogelijk, en van wie weet je dat?</span><textarea id="keten-' + l.id + '" rows="2" data-i="keten" data-id="' + l.id + '">' + h((l.keten && l.keten.uitleg) || '') + '</textarea></label></div>';
  });
  o += '</section><section class="stapel"><h3 class="tussenkop">Per verandering: bouwt voort op</h3><div class="lijst">';
  vs.forEach(v => {
    const eerder = vs.filter(x => x.id !== v.id && !afstammeling(x, v));
    o += '<div class="vk koppelrij"><span class="nr">' + v.id + '</span><h3>' + h(v.titel) + '</h3><label class="sr" for="op-' + v.id + '">Verandering ' + v.id + ' bouwt voort op</label><select id="op-' + v.id + '" data-c="bouwtop" data-id="' + v.id + '">' + opties([['', 'Staat op zichzelf']].concat(eerder.map(x => [x.id, 'Bouwt voort op ' + x.id + ' · ' + x.titel])), v.bouwtOp || '') + '</select></div>';
  });
  return o + '</div></section></div>';
}
function afstammeling(x, v){ let p = x, n = 0; while (p && p.bouwtOp && n++ < 50) { if (p.bouwtOp === v.id) return true; p = vind(p.bouwtOp); } return false; }

function sDuiden(){
  const s = SCHERMEN[6], inz = valtOp();
  let o = schermkop(s, 'De oogst is van het team. In een sessie van anderhalf uur lopen jullie vijf gewone vragen langs en kiezen jullie waar de volgende inzet heen gaat.');
  o += '<div class="rij"><button class="btn btn-rood btn-groot" data-a="sessie">Start de sessie op volledig scherm</button><button class="btn btn-lijn" data-a="ga" data-id="rapport">Naar het rapport</button></div>';
  o += '<section class="stapel"><div class="kopregel"><h3 class="tussenkop">Wat valt op</h3><p class="klein">Berekend uit de oogst zoals die nu is</p></div>' + (inz.length ? '<div class="inzichten">' + inz.map(i => '<div class="inzicht"><b>' + h(i.kop) + '</b><p>' + h(i.tekst) + '</p></div>').join('') + '</div>' : '<p class="klein">Zodra er veranderingen in de oogst staan, zie je hier wat opvalt.</p>') + '</section>';
  o += '<div class="twee gelijk"><section class="stapel"><h3 class="tussenkop">Aannames uit de verandertheorie</h3><p class="klein">Wat dachten jullie vooraf over hoe verandering zou gaan? Leg de oogst ernaast.</p>';
  S.aannames.forEach(a => {
    o += '<div class="aanname"><p class="t">' + h(a.tekst) + '</p><div class="keuze" role="group" aria-label="Oordeel over deze aanname">' + [['houdt','Houdt stand'],['anders','Loopt anders'],['nietvoorzien','Niet voorzien']].map(k => '<button data-a="aanname" data-id="' + a.id + '" data-k="' + k[0] + '" aria-pressed="' + (a.oordeel === k[0]) + '">' + k[1] + '</button>').join('') + '<button class="weg" data-a="aanname-weg" data-id="' + a.id + '" aria-label="Verwijder deze aanname">Verwijder</button></div><label class="sr" for="aan-' + a.id + '">Toelichting</label><input type="text" id="aan-' + a.id + '" data-i="aanname" data-id="' + a.id + '" value="' + h(a.toelichting) + '" placeholder="Waar zie je dat in de oogst?"></div>';
  });
  o += '<form class="rij" data-f="aanname-toe"><label class="sr" for="aanname-nieuw">Nieuwe aanname</label><input type="text" id="aanname-nieuw" name="tekst" placeholder="Een aanname, of iets wat niemand voorzag" required style="flex:1;min-width:200px"><button class="btn btn-lijn btn-klein">Voeg toe</button></form></section>';
  o += '<section class="stapel"><h3 class="tussenkop">De vijf vragen</h3>';
  VIJF_VRAGEN.forEach(q => { o += '<div class="vraagblok"><label for="d-' + q.id + '">' + q.vraag + '</label><p class="hulp">' + q.hulp + '</p><textarea id="d-' + q.id + '" rows="3" data-i="duiding" data-id="' + q.id + '">' + h(S.duiding[q.id] || '') + '</textarea></div>'; });
  o += '</section></div>';
  o += '<section class="stapel"><h3 class="tussenkop">Besluiten</h3>' + besluitenHtml() + '</section>';
  return o;
}
function besluitenHtml(){
  let o = '<div>';
  if (!S.besluiten.length) o += '<p class="klein">Nog geen besluiten. Wat gaan jullie anders doen, of juist niet meer?</p>';
  S.besluiten.forEach((b, i) => { o += '<div class="besluit"><span class="mei" aria-hidden="true"></span><p>' + h(b) + '</p><button class="btn btn-stil btn-klein" data-a="besluit-weg" data-id="' + i + '">Verwijder</button></div>'; });
  return o + '</div><form class="rij" data-f="besluit"><label class="sr" for="besluit-nieuw">Nieuw besluit</label><input type="text" id="besluit-nieuw" name="tekst" placeholder="Wij besluiten dat..." required style="flex:1;min-width:200px"><button class="btn btn-lijn btn-klein">Leg vast</button></form>';
}

function rapportDelen(){
  const vs = inOogst(), s = stand(), ks = ketens();
  return {vs: vs, s: s, ks: ks, inz: valtOp(), aann: S.aannames.filter(a => a.oordeel), duid: VIJF_VRAGEN.filter(q => (S.duiding[q.id] || '').trim())};
}
const AANNAME_NAAM = {houdt:'Houdt stand', anders:'Loopt anders', nietvoorzien:'Niet voorzien'};
function magCiteren(v){ return v.navraag.status === 'ontvangen' && v.navraag.citaat && v.navraag.citeren !== 'nee'; }
function rapportHtml(){
  const r = rapportDelen(), p = S.project;
  let o = '<article class="rapport" id="rapport">' + (p.fictief ? '<p><span class="tag tag-geel">Voorbeeld</span> <span class="klein">Jong en Zeker is een verzonnen coalitie. De veranderingen zijn bedacht om te laten zien hoe een effectenoogst eruitziet.</span></p>' : '') + '<p class="oog">Effectenoogst' + (p.periode ? ' · ' + h(p.periode) : '') + '</p><h2>De oogst van ' + h(p.naam) + '</h2>' + (p.ondertitel ? '<p class="lead">' + h(p.ondertitel) + '</p>' : '');
  o += '<p>' + Hoofd(getal(r.s.n)) + ' veranderingen bij anderen, waarvan ' + getal(r.s.nagevraagd) + ' nagevraagd bij de partij die veranderde. ' + Hoofd(getal(r.s.ketens)) + (r.s.ketens === 1 ? ' keten' : ' ketens') + (r.s.terug ? ', ' + getal(r.s.terug) + (r.s.terug === 1 ? ' stap terug' : ' stappen terug') : '') + (r.s.afgewend ? ', ' + getal(r.s.afgewend) + (r.s.afgewend === 1 ? ' verslechtering die uitbleef' : ' verslechteringen die uitbleven') : '') + '.</p>';
  if (r.inz.length) o += '<h3>Wat valt op</h3>' + r.inz.map(i => '<p><b>' + h(i.kop) + '</b> ' + h(i.tekst) + '</p>').join('');
  o += '<h3>De veranderingen, van diep naar oppervlak</h3>';
  [4,3,2,1,0].forEach(l => {
    const lijst = r.vs.filter(v => (v.laag || 0) === l); if (!lijst.length) return;
    o += '<div class="rij">' + laagHtml(l) + '<span class="klein">' + (l ? LAGEN[l].vraag : '') + '</span></div>';
    lijst.forEach(v => {
      o += '<div class="item"><h4>' + v.id + '. ' + h(v.titel) + '</h4><p class="k">' + h(v.wie) + ', ' + maand(v.wanneer) + ' · ' + h((LABELS[v.label] || LABELS.aanwijzing).naam) + (v.soort !== 'vooruit' ? ' · ' + SOORTEN[v.soort] : '') + '</p><p>' + h(v.zin) + '</p>' + (v.betekenis ? '<p><b>Voor wie maakt het verschil.</b> ' + h(v.betekenis) + '</p>' : '') + (v.bijdrage ? '<p><b>Wat deden wij.</b> ' + h(v.bijdrage) + '</p>' : '') + (v.anderen ? '<p><b>Wie of wat droeg nog meer bij.</b> ' + h(v.anderen) + '</p>' : '') + (magCiteren(v) ? '<p class="citaat">“' + h(v.navraag.citaat) + '”</p><p class="k">' + h(v.navraag.citeren === 'anoniem' ? 'De partij die veranderde' : v.navraag.bij) + '</p>' : '') + '</div>';
    });
  });
  if (r.ks.length) o += '<h3>De ketens</h3>' + r.ks.map(k => { const l = k[k.length-1]; return '<p><b>' + h(ketenNaam(k)) + '.</b> ' + h((l.keten && l.keten.uitleg) || k.map(v => v.titel).join(', daarna ') + '.') + '</p>'; }).join('');
  if (r.aann.length) o += '<h3>Aannames uit de verandertheorie</h3>' + r.aann.map(a => '<p><b>' + AANNAME_NAAM[a.oordeel] + '.</b> ' + h(a.tekst) + (a.toelichting ? ' ' + h(a.toelichting) : '') + '</p>').join('');
  if (r.duid.length) o += '<h3>Samen geduid</h3>' + r.duid.map(q => '<p><b>' + q.vraag + '</b> ' + h(S.duiding[q.id]).replace(/\n+/g, '<br>') + '</p>').join('');
  if (S.besluiten.length) o += '<h3>Besluiten</h3><ul class="punten">' + S.besluiten.map(b => '<li>' + h(b) + '</li>').join('') + '</ul>';
  o += '<h3>Hoe zeker weten we dit</h3><p class="klein">' + Object.keys(LABELS).map(k => '<b>' + LABELS[k].naam + '.</b> ' + LABELS[k].uitleg).join(' ') + '</p><hr class="stippel"><p class="klein">Gemaakt in de Oogstwerkplaats van Perspectivity, ' + datumNl(vandaag()) + '.</p></article>';
  return o;
}
function rapportTekst(){
  const r = rapportDelen(), p = S.project, R = [];
  R.push('DE OOGST VAN ' + p.naam.toUpperCase()); if (p.fictief) R.push('(Voorbeeld: een verzonnen coalitie)'); if (p.ondertitel) R.push(p.ondertitel); if (p.periode) R.push('Periode: ' + p.periode);
  R.push('', Hoofd(getal(r.s.n)) + ' veranderingen bij anderen, ' + getal(r.s.nagevraagd) + ' nagevraagd, ' + getal(r.s.ketens) + (r.s.ketens === 1 ? ' keten.' : ' ketens.'));
  if (r.inz.length) { R.push('', 'WAT VALT OP'); r.inz.forEach(i => R.push('- ' + i.kop + ' ' + i.tekst)); }
  R.push('', 'DE VERANDERINGEN, VAN DIEP NAAR OPPERVLAK');
  [4,3,2,1,0].forEach(l => { const lijst = r.vs.filter(v => (v.laag || 0) === l); if (!lijst.length) return; R.push('', l ? l + ' ' + LAGEN[l].naam + ': ' + LAGEN[l].vraag : 'Nog niet gewogen');
    lijst.forEach(v => { R.push('', v.id + '. ' + v.titel, v.wie + ', ' + maand(v.wanneer) + ' · ' + (LABELS[v.label] || LABELS.aanwijzing).naam + (v.soort !== 'vooruit' ? ' · ' + SOORTEN[v.soort] : ''), v.zin); if (v.betekenis) R.push('Voor wie maakt het verschil: ' + v.betekenis); if (v.bijdrage) R.push('Wat deden wij: ' + v.bijdrage); if (v.anderen) R.push('Wie of wat droeg nog meer bij: ' + v.anderen); if (magCiteren(v)) R.push('“' + v.navraag.citaat + '” (' + (v.navraag.citeren === 'anoniem' ? 'de partij die veranderde' : v.navraag.bij) + ')'); }); });
  if (r.ks.length) { R.push('', 'DE KETENS'); r.ks.forEach(k => { const l = k[k.length-1]; R.push('- ' + ketenNaam(k) + '. ' + ((l.keten && l.keten.uitleg) || k.map(v => v.titel).join(', daarna ') + '.')); }); }
  if (r.aann.length) { R.push('', 'AANNAMES UIT DE VERANDERTHEORIE'); r.aann.forEach(a => R.push('- ' + AANNAME_NAAM[a.oordeel] + ': ' + a.tekst + (a.toelichting ? ' ' + a.toelichting : ''))); }
  if (r.duid.length) { R.push('', 'SAMEN GEDUID'); r.duid.forEach(q => R.push(q.vraag, S.duiding[q.id].trim(), '')); }
  if (S.besluiten.length) { R.push('', 'BESLUITEN'); S.besluiten.forEach(b => R.push('- ' + b)); }
  return R.join('\n');
}
function sRapport(){
  const kanPrint = OMG !== 'artifact';
  let o = '<div class="schermkop"><h2 class="titel">Het rapport</h2><p class="lead">Kort en leesbaar: wat er veranderde, hoe diep, hoe zeker, en wat jullie ermee doen. Het rapport volgt de oogst zoals die nu is.</p></div>';
  if (!inOogst().length) return o + leegBlok('Er staat nog niets in de oogst. Het rapport vult zich vanzelf.', '<button class="btn btn-rood btn-klein" data-a="ga" data-id="overzicht">Naar het overzicht</button>');
  o += '<div class="rij rapportknoppen">' + (kanPrint ? '<button class="btn btn-rood" data-a="print">Print of bewaar als pdf</button>' : (DOWNLOADS ? '<button class="btn btn-rood" data-a="rapport-html">Bewaar als bestand om te printen</button>' : '')) + '<button class="btn btn-lijn" data-a="rapport-kopie">Kopieer als tekst</button></div>';
  return o + rapportHtml();
}
function rapportLos(){
  return '<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>De oogst van ' + h(S.project.naam) + '</title><style>body{font:16px/1.55 Cambria,Georgia,serif;color:#000;max-width:760px;margin:32px auto;padding:0 20px}h2{font:400 34px/1.05 Tahoma,Verdana,sans-serif;text-transform:uppercase;color:#c83f27;margin:6px 0 12px}h3{font-size:16px;text-transform:uppercase;letter-spacing:.02em;margin:26px 0 6px}h4{font:400 20px/1.2 Tahoma,Verdana,sans-serif;margin:0}p{margin:6px 0}.oog,.k{font:13px Tahoma,Verdana,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#6b6560}.item{padding:12px 0;border-top:.75pt dashed #c83f27;break-inside:avoid}.citaat{color:#c83f27;font-size:19px}.klein{font-size:14px;color:#3a3a3a}.laag,.tag{font:13px Tahoma,Verdana,sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:3px 9px;display:inline-block;margin-top:14px}.laag-1{background:#dcebe9}.laag-2{background:#a6cac8}.laag-3{background:#2f6f76;color:#fff}.laag-4{background:#00454e;color:#fff}.laag-0{border:1px solid #b9a493}.tag-geel{background:#fac618}.stippel{border:0;border-top:.75pt dashed #c83f27;margin:24px 0 10px}ul{padding-left:20px}.rij{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.lead{font-size:19px}</style></head><body>' + rapportHtml() + '</body></html>';
}

/* ---------- Lade: één verandering ---------- */
function ladeHtml(){
  const v = vind(UI.lade); if (!v) return '';
  let o = '<div class="scrim" data-a="lade-uit"></div><aside class="lade" role="dialog" aria-modal="true" aria-labelledby="lade-titel"><button class="btn btn-stil btn-klein sluit" data-a="lade-uit">Sluit</button>';
  if (UI.bewerk) {
    o += '<h2 id="lade-titel">Verandering ' + v.id + ' bewerken</h2><form class="formulier" data-f="bewerk">' + veldenVerandering(v, 'bw') +
      '<label class="veld" for="bw-verhaal"><span>Het verhaal</span><textarea id="bw-verhaal" name="verhaal" rows="5">' + h(v.verhaal) + '</textarea></label>' +
      '<div class="formrij"><label class="veld" for="bw-laag"><span>Laag</span><select id="bw-laag" name="laag">' + laagOpties(v.laag) + '</select></label><label class="veld" for="bw-label"><span>Hoe zeker</span><select id="bw-label" name="label">' + opties(Object.keys(LABELS).map(k => [k, LABELS[k].naam]), v.label) + '</select></label></div>' +
      '<label class="veld" for="bw-bronnen"><span>Bronnen</span><textarea id="bw-bronnen" name="bronnen" rows="3">' + h(v.bronnen.join('\n')) + '</textarea><small>Eén bron per regel.</small></label>' +
      '<div class="rij"><button class="btn btn-rood">Bewaar</button><button type="button" class="btn btn-lijn" data-a="bewerk-uit">Annuleer</button></div></form></aside>';
    return o;
  }
  const nv = v.navraag;
  o += '<p class="oog">Verandering ' + v.id + (v.status === 'uit' ? ' · uit de oogst' : v.status === 'voorstel' ? ' · wacht op jullie keuze' : v.status === 'afgewezen' ? ' · niet opgenomen' : '') + '</p><h2 id="lade-titel">' + h(v.titel) + '</h2><p class="klein">' + h(v.wie) + ', ' + maand(v.wanneer) + '</p><div class="rij">' + laagHtml(v.laag) + labelHtml(v.label) + soortHtml(v.soort) + '</div>';
  if (v.status === 'uit') o += '<div class="vlak"><p><b>Uit de oogst gehaald.</b> ' + h(v.uitReden || '') + (nv.toelichting ? ' Toelichting van de partij: “' + h(nv.toelichting) + '”' : '') + '</p></div>';
  o += '<p class="lead">' + h(v.zin) + '</p><hr class="stippel"><dl>';
  if (v.verhaal) o += '<div><dt>Het verhaal</dt><dd>' + h(v.verhaal) + '</dd></div>';
  if (v.betekenis) o += '<div><dt>Voor wie maakt het verschil</dt><dd>' + h(v.betekenis) + '</dd></div>';
  if (v.label === 'verschil') o += '<div><dt>De bijdrage: twee lezingen naast elkaar</dt><dd><div class="lezingen"><div><b>Lezing van ' + h(wij()) + '</b>' + h(v.bijdrage) + '</div><div><b>Lezing van de ander</b>' + h(nv.anders || nv.citaat || v.anderen) + '</div></div></dd></div>';
  else if (v.bijdrage) o += '<div><dt>Wat deden wij</dt><dd>' + h(v.bijdrage) + '</dd></div>';
  if (v.anderen) o += '<div><dt>Wie of wat droeg nog meer bij</dt><dd>' + h(v.anderen) + (nv.meer ? ' Volgens de partij zelf: ' + h(nv.meer) : '') + '</dd></div>';
  o += '</dl>';
  if (nv.status === 'ontvangen' && nv.citaat) o += '<figure class="stapel"><blockquote class="citaat">“' + h(nv.citaat) + '”</blockquote><figcaption class="klein">' + h(nv.bij) + (nv.citeren === 'nee' ? ' · niet om te citeren, alleen voor het team' : nv.citeren === 'anoniem' ? ' · citeren mag zonder herkenbare functie' : '') + '</figcaption></figure>';
  o += '<hr class="stippel"><dl><div><dt>Hoe zeker: ' + h((LABELS[v.label] || LABELS.aanwijzing).naam.toLowerCase()) + '</dt><dd class="klein">' + h((LABELS[v.label] || LABELS.aanwijzing).uitleg) + '</dd></div>';
  o += '<div><dt>Bronnen</dt><dd>' + (v.bronnen.length ? '<ul class="bronnen">' + v.bronnen.map(b => '<li>' + h(b) + '</li>').join('') + '</ul>' : '<span class="klein">Nog geen bron genoemd.</span>') + '</dd></div>';
  o += '<div><dt>Navraag</dt><dd class="klein">' + (nv.status === 'ontvangen' ? 'Beantwoord door ' + h(nv.bij) + ' op ' + datumNl(nv.datum) + '.' : nv.status === 'verstuurd' ? 'Verstuurd aan ' + h(nv.bij) + ' op ' + datumNl(nv.datum) + '. Nog geen antwoord.' : 'Nog niet nagevraagd. ' + h(advies(v).tekst)) + '</dd></div>';
  const op = v.bouwtOp && vind(v.bouwtOp), door = inOogst().filter(x => x.bouwtOp === v.id);
  if (op || door.length) o += '<div><dt>Keten</dt><dd>' + (op ? 'Bouwt voort op: <button class="link" data-a="open" data-id="' + op.id + '">' + h(op.titel) + '</button>. ' : '') + (door.length ? 'Maakte mogelijk: ' + door.map(x => '<button class="link" data-a="open" data-id="' + x.id + '">' + h(x.titel) + '</button>').join(', ') + '.' : '') + '</dd></div>';
  o += '<div><dt>Herkomst</dt><dd class="klein">' + ({document:'Gevonden in documenten.', team:'Aangevuld door het team.', ai:'Vondst van de AI-agent.'}[v.herkomst] || 'Aangevuld door het team.') + '</dd></div></dl>';
  o += '<div class="rij"><button class="btn btn-rood btn-klein" data-a="bewerk">Bewerk</button>';
  if (v.status === 'opgenomen' && v.label !== 'bevestigd' && v.label !== 'verschil') o += '<button class="btn btn-lijn btn-klein" data-a="ontvanger" data-id="' + v.id + '">Vraag na</button>';
  if (v.status === 'voorstel' || v.status === 'afgewezen' || v.status === 'uit') o += '<button class="btn btn-lijn btn-klein" data-a="neem-op" data-id="' + v.id + '">' + (v.status === 'uit' ? 'Zet terug in de oogst' : 'Neem op in de oogst') + '</button>';
  if (v.status === 'opgenomen') o += '<button class="btn btn-stil btn-klein" data-a="haal-uit" data-id="' + v.id + '">Haal uit de oogst</button>';
  return o + '</div></aside>';
}

/* ---------- Volledig scherm: wat de ontvanger ziet ---------- */
function briefHtml(d, los){
  const logo = $('.top .logo') ? $('.top .logo').src : '';
  const keuze = (naam, lijst) => '<div class="opties">' + lijst.map((k, i) => '<label class="optie" for="' + naam + '-' + k[0] + '"><input type="radio" id="' + naam + '-' + k[0] + '" name="' + naam + '" value="' + k[0] + '"' + (i === 0 ? ' required' : '') + '><span><b>' + k[1] + '</b>' + (k[2] ? '<span>' + k[2] + '</span>' : '') + '</span></label>').join('') + '</div>';
  let o = '<div class="vol" role="dialog" aria-modal="true" aria-label="Navraag">' + (los ? '' : '<div class="rolbalk"><span>Je kijkt nu als ontvanger' + (d.bij ? ': ' + h(d.bij) : '') + '. Vul het in zoals de ander dat zou doen.</span><button data-a="vol-uit">Terug naar de werkplaats</button></div>');
  o += '<div class="vol-in"><form class="brief" data-f="navraag" data-id="' + d.id + '"><img class="logo" src="' + logo + '" alt="Perspectivity">' + (d.fictief ? '<p><span class="tag tag-geel">Voorbeeld</span> <span class="klein">Verzonnen coalitie en verzonnen verandering.</span></p>' : '') +
    '<h2 class="titel rood">Klopt dit?</h2><p>' + h(Hoofd(d.wij)) + (d.project && d.project.toLowerCase() !== d.wij.toLowerCase() ? ' (' + h(d.project) + ')' : '') + ' kijkt terug op wat het werk in beweging bracht. Hieronder staat één verandering bij jullie organisatie, zoals wij die hebben begrepen. Klopt het? Het kost vijf minuten. Jouw antwoord komt naast het onze te staan, ook als je het anders ziet.</p>' +
    '<div class="vlak stapel"><p class="oog">De verandering</p><p class="subtitel">' + h(d.titel) + '</p><p>' + h(d.verhaal || d.zin) + '</p></div>' +
    '<fieldset class="stapel"><legend class="tussenkop">1. Klopt deze verandering?</legend>' + keuze('klopt', [['ja','Ja, zo is het gegaan'],['deels','Grotendeels, met een aanvulling'],['nee','Nee, dit is niet gebeurd','De verandering gaat dan uit de oogst.']]) + '<label class="veld" for="nv-toelichting"><span class="klein">Aanvulling of toelichting</span><textarea id="nv-toelichting" name="toelichting" rows="2"></textarea></label></fieldset>' +
    '<fieldset class="stapel"><legend class="tussenkop">2. Klopt onze bijdrage?</legend><div class="vlak"><p class="oog">Zo zien wij onze bijdrage</p><p>' + h(d.bijdrage || 'Nog niet beschreven.') + '</p></div>' + keuze('bijdrage', [['zo','Ja, zo zien wij het ook'],['anders','Wij wegen dat anders','Beide lezingen blijven naast elkaar staan.'],['niet','Dit speelde bij ons geen rol']]) + '<label class="veld" for="nv-anders"><span class="klein">Hoe zien jullie het?</span><textarea id="nv-anders" name="anders" rows="3"></textarea></label></fieldset>' +
    '<fieldset class="stapel"><legend class="tussenkop">3. Wat speelde er nog meer?</legend><label class="veld" for="nv-meer"><span class="klein">Andere partijen, gebeurtenissen of omstandigheden die meewogen</span><textarea id="nv-meer" name="meer" rows="2"></textarea></label></fieldset>' +
    '<fieldset class="stapel"><legend class="tussenkop">4. Mogen we je citeren?</legend>' + keuze('citeren', [['functie','Ja, met mijn functie','Geen naam: alleen functie en organisatie.'],['anoniem','Ja, zonder herkenbare functie'],['nee','Nee, alleen voor het team']]) + '<label class="veld" for="nv-citaat"><span class="klein">In je eigen woorden, in één of twee zinnen</span><textarea id="nv-citaat" name="citaat" rows="3"></textarea></label></fieldset>' +
    '<hr class="stippel"><div class="rij"><button class="btn btn-rood btn-groot">Verstuur mijn antwoord</button></div></form></div></div>';
  return o;
}
function briefKlaar(code){
  return '<div class="vol"><div class="vol-in"><div class="brief"><img class="logo" src="' + ($('.top .logo') ? $('.top .logo').src : '') + '" alt="Perspectivity"><h2 class="titel rood">Dank je wel</h2><p>Je antwoord staat hieronder als code. Kopieer de code en stuur die terug naar degene van wie je deze link kreeg. Pas dan komt je antwoord in de oogst.</p><label class="veld" for="antwoordcode"><span>Antwoordcode</span><textarea id="antwoordcode" class="mono" rows="5" readonly>' + h(code) + '</textarea></label><div class="rij"><button class="btn btn-rood" data-a="code-kopie">Kopieer de code</button></div></div></div></div>';
}
function pasToe(v, a){
  v.navraag = Object.assign({}, v.navraag, {status:'ontvangen', datum: a.datum || vandaag(), klopt: a.klopt, bijdrage: a.bijdrage, toelichting: a.toelichting || '', anders: a.anders || '', meer: a.meer || '', citeren: a.citeren || 'nee', citaat: a.citaat || ''});
  const bron = 'Navraag bij ' + (v.navraag.bij || 'de partij die veranderde') + ', ' + datumNl(v.navraag.datum);
  if (!v.bronnen.includes(bron)) v.bronnen.unshift(bron);
  if (a.klopt === 'nee') { v.status = 'uit'; v.uitReden = 'De partij herkent de verandering niet.'; return 'Verandering ' + v.id + ' gaat uit de oogst: de partij herkent haar niet.'; }
  v.label = a.bijdrage === 'zo' ? 'bevestigd' : 'verschil';
  return 'Label van verandering ' + v.id + ' bijgewerkt: ' + LABELS[v.label].naam.toLowerCase() + '.';
}

/* ---------- Volledig scherm: de duidingssessie ---------- */
function klokTekst(s){ const m = Math.floor(Math.max(0, s) / 60), r = Math.max(0, s) % 60; return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0'); }
function sessieHtml(){
  const s = UI.sessie, q = VIJF_VRAGEN[s.i], inz = valtOp();
  let o = '<div class="vol sessie donker" role="dialog" aria-modal="true" aria-label="Duidingssessie"><div class="vol-in"><div class="sessiekop"><div class="bolletjes" aria-hidden="true">' + VIJF_VRAGEN.map((_, i) => '<i class="' + (i <= s.i ? 'aan' : '') + '"></i>').join('') + '</div><div class="rij"><span class="klok' + (s.rest <= 0 ? ' op' : '') + '" id="klok" role="timer" aria-label="Tijd voor deze vraag">' + klokTekst(s.rest) + '</span><button class="btn btn-lijn btn-klein" data-a="klok">' + (s.loopt ? 'Pauze' : 'Start de klok') + '</button><label class="sr" for="klok-min">Minuten per vraag</label><select id="klok-min" data-c="klok-min">' + opties([[5,'5 min'],[8,'8 min'],[10,'10 min'],[15,'15 min']], s.min) + '</select><button class="btn btn-wit btn-klein" data-a="sessie-uit">Sluit de sessie</button></div></div>';
  o += '<p class="sessie-oog">Vraag ' + (s.i + 1) + ' van 5 · ' + h(S.project.naam) + '</p><h2 class="vraag" id="sessie-vraag" tabindex="-1">' + q.vraag + '</h2><p class="hulp">' + q.hulp + '</p>';
  if (s.i === 0 && inz.length) o += '<ul class="sessie-inz">' + inz.map(i => '<li><b>' + h(i.kop) + '</b> ' + h(i.tekst) + '</li>').join('') + '</ul>';
  o += '<label class="sessie-oog" for="sessie-notitie">Wat we zeggen</label><textarea id="sessie-notitie" data-i="duiding" data-id="' + q.id + '">' + h(S.duiding[q.id] || '') + '</textarea>';
  if (q.id === 'doen') o += '<div class="sessie-besluit"><p class="sessie-oog">Besluiten</p>' + (S.besluiten.length ? '<ul>' + S.besluiten.map(b => '<li>' + h(b) + '</li>').join('') + '</ul>' : '') + '<form class="rij" data-f="besluit"><label class="sr" for="sessie-besluit">Nieuw besluit</label><input type="text" id="sessie-besluit" name="tekst" placeholder="Wij besluiten dat..." required style="flex:1;min-width:200px"><button class="btn btn-wit btn-klein">Leg vast</button></form></div>';
  o += '<div class="rij sessie-nav"><button class="btn btn-lijn" data-a="sessie-stap" data-id="-1"' + (s.i === 0 ? ' disabled' : '') + '>Vorige vraag</button>' + (s.i < 4 ? '<button class="btn btn-wit btn-groot" data-a="sessie-stap" data-id="1">Volgende vraag</button>' : '<button class="btn btn-wit btn-groot" data-a="sessie-rapport">Klaar: naar het rapport</button>') + '</div></div></div>';
  return o;
}
let klokT = 0;
function klokLoop(){
  clearInterval(klokT);
  klokT = setInterval(() => {
    const s = UI.sessie; if (!s) { clearInterval(klokT); return; }
    if (!s.loopt) return;
    s.rest = Math.max(0, Math.round((s.eind - Date.now()) / 1000));
    const el = $('#klok'); if (el) { el.textContent = klokTekst(s.rest); el.classList.toggle('op', s.rest <= 0); }
    if (s.rest <= 0) { s.loopt = false; tekenVol(); toast('De tijd voor deze vraag is om.'); }
  }, 250);
}

/* ---------- Dialoog ---------- */
function dialoog(html){ $('#laag-dialoog').innerHTML = '<div class="dialoog" role="dialog" aria-modal="true"><div>' + html + '</div></div>'; const f = $('#laag-dialoog input, #laag-dialoog textarea, #laag-dialoog button'); if (f) f.focus(); }
function dialoogUit(){ $('#laag-dialoog').innerHTML = ''; }
function projectDialoog(nieuw){
  const p = nieuw ? {naam:'', ondertitel:'', periode:'', wij:''} : S.project;
  dialoog('<h2 class="subtitel">' + (nieuw ? 'Nieuwe, lege oogst' : 'Naam en periode') + '</h2>' + (nieuw ? '<p class="klein">De oogst die nu open staat verdwijnt uit deze browser. Bewaar die eerst als bestand als je haar wilt houden.</p>' : '') + '<form class="formulier" data-f="' + (nieuw ? 'nieuw' : 'project') + '"><label class="veld" for="p-naam"><span>Van wie is de oogst?</span><input type="text" id="p-naam" name="naam" required value="' + h(p.naam) + '" placeholder="Naam van de organisatie of coalitie"></label><label class="veld" for="p-wij"><span>Hoe noemen we jullie in de tekst?</span><input type="text" id="p-wij" name="wij" value="' + h(p.wij) + '" placeholder="de coalitie, de raad, het fonds"></label><label class="veld" for="p-periode"><span>Periode</span><input type="text" id="p-periode" name="periode" value="' + h(p.periode) + '" placeholder="januari 2025 tot december 2026"></label><label class="veld" for="p-onder"><span>Eén zin over de oogst</span><textarea id="p-onder" name="ondertitel" rows="2">' + h(p.ondertitel) + '</textarea></label><div class="rij"><button class="btn btn-rood">' + (nieuw ? 'Begin een lege oogst' : 'Bewaar') + '</button><button type="button" class="btn btn-lijn" data-a="dialoog-uit">Annuleer</button></div></form>');
}

/* ---------- Tekenen ---------- */
function tekenKop(){
  const p = S.project;
  $('#projectkop').innerHTML = '<h1 class="titel">' + h(p.naam) + '</h1>' + (p.fictief ? '<span class="tag tag-geel">Voorbeeld: verzonnen coalitie</span>' : '') + (p.ondertitel ? '<p>' + h(p.ondertitel) + '</p>' : '');
  $('#stappen').innerHTML = SCHERMEN.map(s => '<button data-a="ga" data-id="' + s.id + '"' + (UI.scherm === s.id ? ' aria-current="page"' : '') + '>' + (s.nr ? '<span class="nr">' + s.nr + '</span>' : '') + s.naam + (openWerk(s.id) ? '<span class="stip" title="Hier ligt nog werk"></span><span class="sr">, hier ligt nog werk</span>' : '') + '</button>').join('');
  document.title = 'Oogstwerkplaats · ' + p.naam;
}
const TEKEN = {overzicht:sOverzicht, verzamelen:sVerzamelen, aanvullen:sAanvullen, navragen:sNavragen, wegen:sWegen, verbinden:sVerbinden, duiden:sDuiden, rapport:sRapport};
function tekenScherm(){ $('#scherm').innerHTML = TEKEN[UI.scherm](); }
function tekenLade(){ $('#laag-lade').innerHTML = UI.lade ? ladeHtml() : ''; }
function tekenVol(){
  const el = $('#laag-vol');
  if (UI.sessie) { const n = $('#sessie-notitie'); const had = n && document.activeElement === n; el.innerHTML = sessieHtml(); if (had) $('#sessie-notitie').focus(); }
  else if (UI.vol) el.innerHTML = UI.vol.klaar ? briefKlaar(UI.vol.klaar) : briefHtml(UI.vol.d, UI.vol.los);
  else el.innerHTML = '';
  document.body.classList.toggle('op-slot', !!(UI.sessie || UI.vol || UI.lade));
}
function teken(){ tekenKop(); tekenScherm(); tekenLade(); tekenVol(); }
function ga(id, stil){
  if (!TEKEN[id]) id = 'overzicht';
  UI.scherm = id; UI.koppel = null;
  if (!stil && location.hash.slice(1) !== id) { try { history.replaceState(null, '', '#' + id); } catch (e) { location.hash = id; } }
  teken(); window.scrollTo(0, 0);
  const a = $('#stappen [aria-current]'); if (a && a.scrollIntoView) a.scrollIntoView({block:'nearest', inline:'center'});
}
function openLade(id){ UI.lade = +id; UI.bewerk = false; tekenLade(); tekenVol(); const s = $('.lade .sluit'); if (s) s.focus(); }
function sluitLade(){ const id = UI.lade; UI.lade = null; UI.bewerk = false; tekenLade(); tekenVol(); const t = $('#scherm [data-a="open"][data-id="' + id + '"]'); if (t) t.focus(); }

/* ---------- De agent leest ---------- */
function nieuweVerandering(g, extra){
  const v = Object.assign({id: ++S.volgnr, titel:'', wie:'', wanneer:'', zin:'', verhaal:'', betekenis:'', bijdrage:'', anderen:'', laag:0, label:'aanwijzing', soort:'vooruit', bronnen:[], bouwtOp:null, herkomst:'team', status:'opgenomen', navraag:{status:'geen', bij:'', datum:'', klopt:'', bijdrage:'', citaat:'', anders:''}}, g, extra || {});
  S.veranderingen.push(v); return v;
}
function oordeel(d, i){
  const al = d.alineas[i];
  if (al.oordeel === 'nieuw' && al.vondst && !al.vid) {
    const g = Object.assign({}, al.vondst); delete g.waarom;
    al.vid = nieuweVerandering(g, {label:'vermoeden', status:'voorstel', herkomst:'ai', bronnen:[d.titel]}).id;
    d.vondsten = (d.vondsten || 0) + 1;
  }
  if (al.oordeel === 'bekend' && !al.verwerkt) {
    const v = vind(al.bijVerandering);
    if (v) { if (al.bron && !v.bronnen.includes(al.bron)) v.bronnen.push(al.bron); if (v.label === 'aanwijzing' || v.label === 'vermoeden') { al.van = v.label; al.naar = 'onderbouwd'; v.label = 'onderbouwd'; } d.vondsten = (d.vondsten || 0) + 1; }
    al.verwerkt = true;
  }
  d.voortgang = i + 1;
}
async function agent(id){
  const d = S.documenten.find(x => x.id === id); if (!d || !d.alineas || UI.agent) return;
  const loop = ++UI.loop;
  UI.snel = rustig;
  for (let i = d.voortgang || 0; i < d.alineas.length; i++) {
    UI.agent = {doc: id, i: i};
    if (UI.scherm === 'verzamelen') { tekenScherm(); const el = $('.alinea.leest'); if (el && el.scrollIntoView && !UI.snel) el.scrollIntoView({block:'center', behavior:'smooth'}); }
    if (!UI.snel) await wacht(900 + Math.min(1700, d.alineas[i].tekst.length * 9));
    if (loop !== UI.loop) return;
    oordeel(d, i); bewaar();
    if (UI.scherm === 'verzamelen') tekenScherm();
    if (!UI.snel) await wacht(650);
    if (loop !== UI.loop) return;
  }
  UI.agent = null; d.gelezen = true; bewaar(); teken();
  const n = d.alineas.filter(a => a.oordeel === 'nieuw').length, b = d.alineas.filter(a => a.oordeel === 'bekend').length;
  toast('Klaar met lezen: ' + getal(n) + (n === 1 ? ' nieuwe verandering' : ' nieuwe veranderingen') + ', ' + getal(b) + (b === 1 ? ' extra bron.' : ' extra bronnen.'));
}

/* ---------- Eigen tekst, gelezen door Claude (alleen als Artifact) ---------- */
let eigenStop = null;
const FOUT = {not_granted:'Je gaf geen toestemming om Claude te gebruiken. Zonder Claude werkt dit onderdeel niet.', rate_limited:'Claude is even druk. Wacht een minuut en probeer het opnieuw.', prompt_too_large:'De tekst is te lang. Plak een korter stuk.', refused:'Claude kon deze tekst niet verwerken.', invalid_json:'Het antwoord van Claude was niet leesbaar. Probeer het opnieuw.', cancelled:'Gestopt.'};
async function leesEigen(){
  const tekst = ($('#eigen-tekst').value || '').trim();
  if (tekst.length < 60) { toast('Plak eerst een tekst van een paar zinnen.'); return; }
  if (!SAMPLE) return;
  UI.eigen = {status:'bezig', tekst: tekst, items:[]}; tekenScherm();
  eigenStop = new AbortController();
  const vraag = 'Je helpt een team bij een effectenoogst (outcome harvesting) voor ' + wij() + ' (' + S.project.naam + '). Lees de tekst tussen de regels met === en zoek veranderingen. Een verandering is iets wat een ANDERE partij aantoonbaar anders is gaan doen: een besluit, een regel, geld, een werkwijze, gedrag of een relatie. Een activiteit van het team zelf (een bijeenkomst, een rapport, een gesprek, een campagne) is geen verandering. Ook een stap terug telt mee, en een verslechtering die uitbleef. Verzin niets: gebruik alleen wat in de tekst staat. Wat de tekst niet zegt, laat je leeg. Noem geen namen van personen, alleen functies en organisaties.\n\n' +
    'Beschrijf elke verandering in drie delen:\n1. verandering: wie deed wat anders, wanneer en waar (één of twee zinnen)\n2. betekenis: voor wie maakt het verschil\n3. bijdrage: wat deed het team, en wie of wat droeg nog meer bij\n\n' +
    'Stel per verandering een laag voor, van oppervlak naar diepte:\n1 Middelen: krijgt het systeem meer of minder middelen? Geld, een extra plek, een vergoeding, een ruimere norm, een kortere termijn.\n2 Signalen: reageert het systeem anders op signalen? Een vast overleg, een klacht die tot bijsturing leidt.\n3 Spelregels: veranderen de spelregels? Een nieuwe regel in beleid of een verordening; een andere partij krijgt informatie of zeggenschap.\n4 Bedoeling: verandert de bedoeling? Een partij stuurt op iets anders, of kijkt anders naar de mensen om wie het gaat.\nVuistregels: een nieuw getal in een bestaande regel is middelen, een nieuwe regel is spelregels. Een beter signaal voor wie al stuurt is signalen; informatie of zeggenschap voor een andere partij is spelregels.\n\n' +
    'Antwoord alleen met JSON in precies deze vorm:\n{"veranderingen":[{"titel":"korte naam, hooguit acht woorden","wie":"de partij die veranderde, en waar","wanneer":"JJJJ-MM of leeg","verandering":"...","betekenis":"...","bijdrage":"wat het team deed","anderen":"wie of wat nog meer bijdroeg","soort":"vooruit of terug of afgewend","laag":1,"waarom":"één zin: waarom deze laag"}],"activiteiten":["korte omschrijving van een eigen activiteit die dus geen verandering is"]}\nSchrijf Nederlands in gewone taal, zonder gedachtestreepjes.\n\n===\n' + tekst.slice(0, 60000) + '\n===';
  try {
    const d = await SAMPLE.json(vraag, {signal: eigenStop.signal});
    const lijst = d && Array.isArray(d.veranderingen) ? d.veranderingen : [];
    UI.eigen = {status:'klaar', tekst: tekst, activiteiten: (d && Array.isArray(d.activiteiten) ? d.activiteiten : []).map(String).slice(0, 12),
      items: lijst.slice(0, 12).map(x => ({titel: String(x.titel || 'Verandering zonder naam').slice(0, 120), wie: String(x.wie || ''), wanneer: /^\d{4}-\d{2}$/.test(x.wanneer || '') ? x.wanneer : '', zin: String(x.verandering || ''), betekenis: String(x.betekenis || ''), bijdrage: String(x.bijdrage || ''), anderen: String(x.anderen || ''), soort: SOORTEN[x.soort] ? x.soort : 'vooruit', laag: [1,2,3,4].includes(+x.laag) ? +x.laag : 0, waarom: String(x.waarom || '')}))};
  } catch (e) {
    UI.eigen = {status:'fout', tekst: tekst, items:[], melding: FOUT[e && e.code] || 'Het lezen is niet gelukt. Probeer het opnieuw.'};
  }
  if (UI.scherm === 'verzamelen') tekenScherm();
}

/* ---------- Handelingen ---------- */
function formData(f){ const o = {}; new FormData(f).forEach((v, k) => { o[k] = String(v).trim(); }); return o; }
const DOE = {
  ga: (el) => ga(el.dataset.id),
  open: (el) => openLade(el.dataset.id),
  'lade-uit': () => sluitLade(),
  bewerk: () => { UI.bewerk = true; tekenLade(); const f = $('.lade input'); if (f) f.focus(); },
  'bewerk-uit': () => { UI.bewerk = false; tekenLade(); },
  'dialoog-uit': () => dialoogUit(),
  nieuw: () => projectDialoog(true),
  project: () => projectDialoog(false),
  herstel: () => dialoog('<h2 class="subtitel">Voorbeeld terugzetten?</h2><p>De oogst van Jong en Zeker komt terug zoals die begon. Wat je hebt veranderd, verdwijnt uit deze browser.</p><div class="rij"><button class="btn btn-rood" data-a="herstel-ja">Zet het voorbeeld terug</button><button class="btn btn-lijn" data-a="dialoog-uit">Annuleer</button></div>'),
  'herstel-ja': () => { UI.loop++; UI.agent = null; UI.eigen = null; UI.lade = null; S = heel(voorbeeld()); bewaar(); dialoogUit(); ga('overzicht'); toast('Het voorbeeld staat er weer.'); },
  bewaar: () => geefBestand('oogst-' + slak(S.project.naam) + '.json', JSON.stringify(S, null, 1), 'application/json'),
  'open-bestand': () => $('#bestand').click(),
  agent: (el) => agent(el.dataset.id),
  'agent-snel': () => { UI.snel = true; },
  'neem-op': (el) => { const v = vind(el.dataset.id); v.status = 'opgenomen'; bewaar(); teken(); toast('Verandering ' + v.id + ' staat in de oogst' + (v.label === 'vermoeden' ? ', als vermoeden.' : '.')); },
  'wijs-af': (el) => { vind(el.dataset.id).status = 'afgewezen'; bewaar(); teken(); toast('Niet opgenomen.'); },
  'haal-uit': (el) => { const v = vind(el.dataset.id); v.status = 'afgewezen'; bewaar(); UI.lade = null; teken(); toast('Verandering ' + v.id + ' is uit de oogst gehaald.'); },
  'doc-gelezen': (el) => { S.documenten.find(d => d.id === el.dataset.id).gelezen = true; bewaar(); teken(); },
  'doc-weg': (el) => { S.documenten = S.documenten.filter(d => d.id !== el.dataset.id); bewaar(); teken(); },
  eigen: () => leesEigen(),
  'eigen-stop': () => { if (eigenStop) eigenStop.abort(); },
  'eigen-op': (el) => { const it = UI.eigen.items[+el.dataset.id]; const g = Object.assign({}, it); delete g.waarom; g.verhaal = it.zin; it.vid = nieuweVerandering(g, {label:'vermoeden', herkomst:'ai', bronnen:['Geplakte tekst, gelezen door Claude op ' + datumNl(vandaag())]}).id; bewaar(); teken(); toast('Verandering ' + it.vid + ' staat in de oogst, als vermoeden.'); },
  'eigen-weg': (el) => { UI.eigen.items[+el.dataset.id].weg = true; tekenScherm(); },
  ontvanger: (el) => { const v = vind(el.dataset.id); UI.lade = null; UI.vol = {d: {id: v.id, titel: v.titel, zin: v.zin, verhaal: v.verhaal, bijdrage: v.bijdrage, wij: wij(), project: S.project.naam, bij: v.navraag.bij, fictief: !!S.project.fictief}}; tekenLade(); tekenVol(); const el2 = $('.vol'); if (el2) el2.scrollTop = 0; const f = $('.rolbalk button'); if (f) f.focus(); },
  'vol-uit': () => { UI.vol = null; tekenVol(); },
  navraaglink: (el) => { const v = vind(el.dataset.id); const d = {id: v.id, titel: v.titel, zin: v.zin, verhaal: v.verhaal, bijdrage: v.bijdrage, wij: wij(), project: S.project.naam, bij: v.navraag.bij, fictief: !!S.project.fictief}; const link = location.href.split('#')[0] + '#navraag.' + b64(JSON.stringify(d)); if (v.navraag.status === 'geen') { v.navraag.status = 'verstuurd'; v.navraag.datum = vandaag(); bewaar(); teken(); } kopieer(link, 'Navraaglink gekopieerd. Stuur hem zelf aan ' + (v.navraag.bij || 'de partij die veranderde') + '.'); },
  'code-kopie': () => kopieer($('#antwoordcode').value, 'Code gekopieerd.'),
  koppel: (el) => { const id = +el.dataset.id; if (!UI.koppel) { UI.koppel = id; tekenScherm(); const g = $('.knoop[data-id="' + id + '"]'); if (g) g.focus(); return; } if (UI.koppel === id) { UI.koppel = null; tekenScherm(); return; } koppel(id, UI.koppel); UI.koppel = null; teken(); },
  'koppel-stop': () => { UI.koppel = null; tekenScherm(); },
  aanname: (el) => { const a = S.aannames.find(x => x.id === el.dataset.id); a.oordeel = a.oordeel === el.dataset.k ? '' : el.dataset.k; bewaar(); tekenScherm(); const b = $('[data-a="aanname"][data-id="' + a.id + '"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); },
  'aanname-weg': (el) => { S.aannames = S.aannames.filter(x => x.id !== el.dataset.id); bewaar(); tekenScherm(); },
  'besluit-weg': (el) => { S.besluiten.splice(+el.dataset.id, 1); bewaar(); teken(); },
  sessie: () => { UI.sessie = {i: 0, min: 8, rest: 480, loopt: false, eind: 0}; tekenVol(); klokLoop(); const el = $('.sessie'); try { if (el && el.requestFullscreen) { const p = el.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) {} const v = $('#sessie-vraag'); if (v) v.focus(); },
  'sessie-uit': () => sessieUit(),
  'sessie-stap': (el) => { const s = UI.sessie; s.i = Math.min(4, Math.max(0, s.i + (+el.dataset.id))); s.loopt = false; s.rest = s.min * 60; tekenVol(); $('.sessie').scrollTop = 0; const v = $('#sessie-vraag'); if (v) v.focus(); },
  'sessie-rapport': () => { sessieUit(); ga('rapport'); },
  klok: () => { const s = UI.sessie; if (s.loopt) { s.loopt = false; } else { if (s.rest <= 0) s.rest = s.min * 60; s.eind = Date.now() + s.rest * 1000; s.loopt = true; } tekenVol(); const b = $('[data-a="klok"]'); if (b) b.focus(); },
  print: () => window.print(),
  'rapport-html': () => geefBestand('oogst-' + slak(S.project.naam) + '-rapport.html', rapportLos(), 'text/html'),
  'rapport-kopie': () => kopieer(rapportTekst(), 'Het rapport staat op je klembord.')
};
function sessieUit(){ UI.sessie = null; clearInterval(klokT); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} teken(); const b = $('[data-a="sessie"]'); if (b) b.focus(); }
function koppel(doelId, bronId){
  const doel = vind(doelId), bron = vind(bronId);
  if (afstammeling(bron, doel)) { toast('Dat kan niet: dan loopt de keten in een cirkel.'); return; }
  doel.bouwtOp = bron.id; bewaar();
  toast('Verandering ' + bron.id + ' maakte verandering ' + doel.id + ' mogelijk.' + (bron.wanneer && doel.wanneer && bron.wanneer > doel.wanneer ? ' Let op: ' + doel.id + ' was eerder dan ' + bron.id + '.' : ''));
}
const VORM = {
  aanvullen: (f, d) => { const v = nieuweVerandering({titel: d.titel, zin: d.zin, verhaal: d.zin, wie: d.wie, wanneer: d.wanneer, betekenis: d.betekenis, bijdrage: d.bijdrage, anderen: d.anderen, soort: d.soort}, {bronnen: d.bron ? [d.bron] : ['Verteld door het team, ' + datumNl(vandaag())]}); bewaar(); teken(); f.reset(); window.scrollTo(0, 0); toast('Verandering ' + v.id + ' staat in de oogst, als aanwijzing. Weeg haar bij stap 4.'); },
  bewerk: (f, d) => { const v = vind(UI.lade); Object.assign(v, {titel: d.titel, zin: d.zin, wie: d.wie, wanneer: d.wanneer, betekenis: d.betekenis, bijdrage: d.bijdrage, anderen: d.anderen, soort: d.soort, verhaal: d.verhaal, laag: +d.laag, label: d.label, bronnen: d.bronnen.split('\n').map(x => x.trim()).filter(Boolean)}); UI.bewerk = false; bewaar(); teken(); toast('Bewaard.'); },
  'doc-toe': (f, d) => { S.documenten.push({id: 'd' + Date.now(), titel: d.titel, soort: d.soort || 'Document', datum: vandaag().slice(0, 7), omvang: '', gelezen: false, vondsten: 0}); bewaar(); teken(); toast('Het document staat op de lijst.'); },
  navraag: (f, d) => {
    if (!d.klopt || !d.bijdrage || !d.citeren) { toast('Kies bij vraag 1, 2 en 4 een antwoord.'); return; }
    d.datum = vandaag();
    if (UI.vol.los) { d.id = UI.vol.d.id; UI.vol.klaar = 'OOGST-' + b64(JSON.stringify(d)); tekenVol(); $('.vol').scrollTop = 0; return; }
    const v = vind(f.dataset.id); const m = pasToe(v, d); UI.vol = null; bewaar(); teken(); openLade(v.id); toast(m);
  },
  antwoordcode: (f, d) => {
    try { const a = JSON.parse(unb64(d.code.replace(/\s+/g, '').replace(/^OOGST-/, ''))); const v = vind(a.id); if (!v || !a.klopt) throw 0; const m = pasToe(v, a); bewaar(); teken(); openLade(v.id); toast(m); }
    catch (e) { toast('Deze code kan ik niet lezen. Plak de hele code, van OOGST- tot het eind.'); }
  },
  'aanname-toe': (f, d) => { S.aannames.push({id: 'a' + Date.now(), tekst: d.tekst, oordeel: '', toelichting: ''}); bewaar(); tekenScherm(); const n = $('#aanname-nieuw'); if (n) n.focus(); },
  besluit: (f, d) => { S.besluiten.push(d.tekst); bewaar(); if (UI.sessie) { tekenVol(); const n = $('#sessie-besluit'); if (n) n.focus(); } else { teken(); const n = $('#besluit-nieuw'); if (n) n.focus(); } },
  nieuw: (f, d) => { UI.loop++; UI.agent = null; UI.eigen = null; S = heel(leeg(d.naam)); Object.assign(S.project, {wij: d.wij || 'wij', periode: d.periode, ondertitel: d.ondertitel}); bewaar(); dialoogUit(); ga('overzicht'); toast('Een lege oogst voor ' + d.naam + '.'); },
  project: (f, d) => { Object.assign(S.project, {naam: d.naam, wij: d.wij || 'wij', periode: d.periode, ondertitel: d.ondertitel}); bewaar(); dialoogUit(); teken(); }
};
const WIJZIG = {
  sorteer: (el) => { UI.sorteer = el.value; tekenScherm(); const n = $('#sorteer'); if (n) n.focus(); },
  laag: (el) => zetLaag(el.dataset.id, +el.value, 'laag-' + el.dataset.id),
  bouwtop: (el) => { const v = vind(el.dataset.id); if (!el.value) { v.bouwtOp = null; bewaar(); toast('Verandering ' + v.id + ' staat op zichzelf.'); } else koppel(v.id, +el.value); teken(); const n = $('#op-' + v.id); if (n) n.focus(); },
  bij: (el) => { vind(el.dataset.id).navraag.bij = el.value.trim(); bewaar(); },
  'klok-min': (el) => { const s = UI.sessie; s.min = +el.value; s.rest = s.min * 60; s.loopt = false; tekenVol(); const n = $('#klok-min'); if (n) n.focus(); }
};
function zetLaag(id, laag, focusId){
  const v = vind(id); if (!v || (v.laag || 0) === laag) return;
  v.laag = laag; bewaar(); teken();
  toast('Verandering ' + v.id + ' staat nu ' + (laag ? 'in de laag ' + LAGEN[laag].naam.toLowerCase() : 'bij nog niet gewogen') + '.');
  const n = focusId && document.getElementById(focusId); if (n) n.focus();
}
const TYP = {
  duiding: (el) => { S.duiding[el.dataset.id] = el.value; },
  aanname: (el) => { const a = S.aannames.find(x => x.id === el.dataset.id); if (a) a.toelichting = el.value; },
  keten: (el) => { const v = vind(el.dataset.id); v.keten = Object.assign({}, v.keten, {uitleg: el.value}); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  if (el.tagName === 'A') return;
  const f = DOE[el.dataset.a]; if (f) { if (el.type !== 'submit') e.preventDefault(); f(el); }
});
document.addEventListener('submit', e => { const f = e.target.closest('form[data-f]'); if (!f) return; e.preventDefault(); const g = VORM[f.dataset.f]; if (g) g(f, formData(f)); });
document.addEventListener('change', e => { const el = e.target.closest('[data-c]'); if (el && WIJZIG[el.dataset.c]) WIJZIG[el.dataset.c](el); });
document.addEventListener('input', e => { const el = e.target.closest('[data-i]'); if (el && TYP[el.dataset.i]) { TYP[el.dataset.i](el); bewaar(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#laag-dialoog').innerHTML) dialoogUit();
    else if (UI.sessie) sessieUit();
    else if (UI.vol && !UI.vol.los) { UI.vol = null; tekenVol(); }
    else if (UI.lade) sluitLade();
    else if (UI.koppel) { UI.koppel = null; tekenScherm(); }
    return;
  }
  const k = e.target.closest && e.target.closest('.knoop');
  if (k && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); DOE[k.dataset.a](k); }
  if (UI.sessie && (e.key === 'PageDown' || e.key === 'PageUp')) { e.preventDefault(); DOE['sessie-stap']({dataset: {id: e.key === 'PageDown' ? 1 : -1}}); }
});
const bij = e => { const k = e.target.closest && e.target.closest('.knoop'); const b = $('#kaartbij'); if (k && b) b.textContent = k.dataset.titel; };
document.addEventListener('mouseover', bij); document.addEventListener('focusin', bij);

/* Slepen bij Wegen */
let sleep = null;
document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.chip'); if (!c) return; sleep = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', sleep); } catch (x) {} });
document.addEventListener('dragover', e => { const b = sleep && e.target.closest && e.target.closest('.band'); if (!b) return; e.preventDefault(); document.querySelectorAll('.band.doel').forEach(x => { if (x !== b) x.classList.remove('doel'); }); b.classList.add('doel'); });
document.addEventListener('drop', e => { const b = sleep && e.target.closest && e.target.closest('.band'); if (!b) return; e.preventDefault(); const id = sleep; sleep = null; zetLaag(id, +b.dataset.laag); });
document.addEventListener('dragend', () => { sleep = null; document.querySelectorAll('.band.doel').forEach(x => x.classList.remove('doel')); });

$('#bestand').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!geldig(d)) throw 0; UI.loop++; UI.agent = null; UI.eigen = null; S = heel(d); bewaar(); ga('overzicht'); toast('Geopend: de oogst van ' + S.project.naam + '.'); } catch (x) { toast('Dit bestand is geen oogst uit de Oogstwerkplaats.'); } e.target.value = ''; };
  r.readAsText(f);
});
window.addEventListener('hashchange', () => { const n = location.hash.slice(1); if (TEKEN[n] && n !== UI.scherm) ga(n, true); });

/* ---------- Start ---------- */
(function start(){
  const hsh = location.hash.slice(1);
  if (hsh.indexOf('navraag.') === 0) {
    try { const d = JSON.parse(unb64(hsh.slice(8))); UI.vol = {d: d, los: true}; document.body.classList.add('alleen-navraag'); document.title = 'Klopt dit? Navraag van ' + (d.project || 'de oogst'); tekenVol(); return; } catch (e) {}
  }
  UI.scherm = TEKEN[hsh] ? hsh : 'overzicht';
  teken();
})();
})();
