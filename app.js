// app.js – Interaktive Darstellung mit Mini-XG-Charts (Canvas), stacked bars & tooltips
const top3Div = document.getElementById("top3");
const top7ValueDiv = document.getElementById("top7Value");
const top5OverDiv = document.getElementById("top5Over25");
const gamesDiv = document.getElementById("games");
const loadBtn = document.getElementById("loadBtn");
const dateInput = document.getElementById("date");
const leagueSelect = document.getElementById("league");
const teamInput = document.getElementById("team");

function formatPct(v){ return (v*100).toFixed(1) + "%"; }

function createStackedBar(parts, colors, showText=false){
  // returns element with stacked segments (widths sum to 100%)
  const wrap = document.createElement("div");
  wrap.className = "bar-container";
  wrap.style.display = "flex";
  parts.forEach((p, i) => {
    const seg = document.createElement("div");
    seg.className = "bar";
    seg.style.width = Math.max(0.5, Math.round(p*100)) + "%";
    seg.style.background = colors[i];
    if(showText) seg.textContent = formatPct(p);
    wrap.appendChild(seg);
  });
  return wrap;
}

function createValueBar(vals){
  // show H/D/A value bars; color by sign
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.gap = "6px";
  ["home","draw","away"].forEach((k, idx) => {
    const v = vals[k] || 0;
    const segWrap = document.createElement("div");
    segWrap.style.width = "32%";
    segWrap.style.display = "flex";
    segWrap.style.flexDirection = "column";
    const bar = document.createElement("div");
    bar.className = "bar";
    const pct = Math.min(Math.abs(v), 1); // cap for visualization
    bar.style.width = Math.max(3, Math.round(pct*100)) + "%";
    bar.style.background = v >= 0 ? "#16a34a" : "#ef4444";
    bar.style.height = "12px";
    bar.style.borderRadius = "6px";
    bar.title = `${k.toUpperCase()} Value: ${v}`;
    segWrap.appendChild(bar);
    const lbl = document.createElement("div");
    lbl.style.fontSize = "11px";
    lbl.style.color = "#9aa4b2";
    lbl.style.marginTop = "4px";
    lbl.textContent = `${k.toUpperCase()} ${v.toFixed(3)}`;
    segWrap.appendChild(lbl);
    wrap.appendChild(segWrap);
  });
  return wrap;
}

function createMiniXGCanvas(lastGoals){
  // lastGoals: array of goals/xg-like numbers (most recent last)
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 40;
  canvas.style.verticalAlign = "middle";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if(!lastGoals || !lastGoals.length) return canvas;
  const vals = lastGoals.slice(-5); // up to 5
  const maxVal = Math.max(...vals, 2.5);
  ctx.beginPath();
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 2;
  vals.forEach((v,i) => {
    const x = (i) * (canvas.width / (vals.length - 1 || 1));
    const y = canvas.height - (v / maxVal) * (canvas.height - 6) - 2;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // dots
  ctx.fillStyle = "#06b6d4";
  vals.forEach((v,i) => {
    const x = (i) * (canvas.width / (vals.length - 1 || 1));
    const y = canvas.height - (v / maxVal) * (canvas.height - 6) - 2;
    ctx.beginPath(); ctx.arc(x,y,2.3,0,Math.PI*2); ctx.fill();
  });
  return canvas;
}

function getTrendColor(trend){
  if(trend === "home") return "#16a34a";
  if(trend === "away") return "#ef4444";
  if(trend === "draw") return "#f59e0b";
  return "rgba(255,255,255,0.04)";
}

async function loadGames(){
  try {
    let url = "/api/games";
    if(dateInput.value) url += "?date=" + dateInput.value;
    const res = await fetch(url);
    const data = await res.json();
    if(!data || !Array.isArray(data.response)){
      gamesDiv.innerHTML = "<p>Fehler: keine Spieldaten erhalten.</p>";
      return;
    }
    let games = data.response.slice();

    // Apply client filters
    if(leagueSelect.value) games = games.filter(g => g.league === leagueSelect.value);
    if(teamInput.value){
      const q = teamInput.value.toLowerCase();
      games = games.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    // sort by best value
    games.sort((a,b) => Math.max(b.value.home,b.value.draw,b.value.away) - Math.max(a.value.home,a.value.draw,a.value.away));
    const topGames = games.slice(0,3);
    const otherGames = games.slice(3);

    // render top3
    top3Div.innerHTML = "";
    topGames.forEach(g => {
      const el = document.createElement("div"); el.className = "game top3";
      const dateObj = g.date ? new Date(g.date) : new Date();
      const bestVal = Math.max(g.value.home,g.value.draw,g.value.away);
      const color = getTrendColor(g.trend);
      el.style.borderLeft = `6px solid ${color}`;

      // header
      const header = document.createElement("div");
      header.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> <span class="date">(${g.league}) ${dateObj.toLocaleString()}</span></div>`;
      el.appendChild(header);

      // xg + form charts row
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "12px";
      row.style.alignItems = "center";

      const left = document.createElement("div");
      left.className = "team";
      left.innerHTML = `<img src="${g.homeLogo}" alt=""> ${g.home} xG:${g.homeXG}`;
      left.style.flex = "1";
      left.style.flexDirection = "column";
      left.style.alignItems = "flex-start";
      left.appendChild(document.createElement("div"));
      if(g.homeStats && g.homeStats.lastGoals) {
        const label = document.createElement("div"); label.className = "form-label"; label.textContent = "Form (letzte Spiele)";
        left.appendChild(label);
        left.appendChild(createMiniXGCanvas(g.homeStats.lastGoals));
      }

      const mid = document.createElement("div");
      mid.style.flex = "0 0 260px";
      mid.appendChild(createStackedBar([g.prob.home,g.prob.draw,g.prob.away], ["#16a34a","#f59e0b","#ef4444"], true));
      mid.appendChild(createValueBar(g.value));

      const right = document.createElement("div");
      right.className = "team";
      right.innerHTML = `<img src="${g.awayLogo}" alt=""> ${g.away} xG:${g.awayXG}`;
      right.style.flex = "1";
      if(g.awayStats && g.awayStats.lastGoals){
        const label2 = document.createElement("div"); label2.className = "form-label"; label2.textContent = "Form (letzte Spiele)";
        right.appendChild(label2);
        right.appendChild(createMiniXGCanvas(g.awayStats.lastGoals));
      }

      row.appendChild(left); row.appendChild(mid); row.appendChild(right);
      el.appendChild(row);

      // Over/Under & BTTS
      const ou = document.createElement("div"); ou.style.marginTop = "8px";
      ou.appendChild(createStackedBar([g.prob.over25, g.prob.under25], ["#2196f3","#8b5cf6"], false));
      const btts = document.createElement("div"); btts.style.marginTop = "6px"; btts.style.color = "#9aa4b2";
      btts.textContent = `BTTS: ${formatPct(g.btts)}  •  Over2.5: ${formatPct(g.prob.over25)}`;
      el.appendChild(ou); el.appendChild(btts);

      top3Div.appendChild(el);
    });

    // top7 value
    top7ValueDiv.innerHTML = "";
    const top7 = games.slice(0,7);
    top7.forEach(g => {
      const d = document.createElement("div"); d.className = "game";
      d.style.borderLeft = `6px solid ${getTrendColor(g.trend)}`;
      const bestVal = Math.max(g.value.home,g.value.draw,g.value.away);
      d.textContent = `${g.home} vs ${g.away} (${g.league}) → Best Value ${bestVal.toFixed(2)} • Trend ${g.trend}`;
      top7ValueDiv.appendChild(d);
    });

    // top5 over
    top5OverDiv.innerHTML = "";
    const top5Over = games.slice().sort((a,b) => (b.value.over25||0) - (a.value.over25||0)).slice(0,5);
    top5Over.forEach(g => {
      const d = document.createElement("div"); d.className = "game";
      d.style.borderLeft = `6px solid #2196f3`;
      d.textContent = `${g.home} vs ${g.away} (${g.league}) → Over2.5 ${(g.prob.over25*100).toFixed(1)}% • Trend ${g.trend}`;
      top5OverDiv.appendChild(d);
    });

    // all games
    gamesDiv.innerHTML = "";
    otherGames.forEach(g => {
      const el = document.createElement("div"); el.className = "game";
      el.style.borderLeft = `6px solid ${getTrendColor(g.trend)}`;
      const dateObj = g.date ? new Date(g.date) : new Date();
      // header
      const header = document.createElement("div");
      header.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> <span class="date">(${g.league}) ${dateObj.toLocaleString()}</span></div>`;
      el.appendChild(header);

      // teams + bars row
      const row = document.createElement("div"); row.style.display="flex"; row.style.gap="12px"; row.style.alignItems="center";
      const left = document.createElement("div"); left.className="team"; left.innerHTML = `<img src="${g.homeLogo}"> ${g.home} xG:${g.homeXG}`;
      if(g.homeStats && g.homeStats.lastGoals) { left.appendChild(createMiniXGCanvas(g.homeStats.lastGoals)); }
      const mid = document.createElement("div"); mid.style.flex="0 0 240px";
      mid.appendChild(createStackedBar([g.prob.home,g.prob.draw,g.prob.away], ["#16a34a","#f59e0b","#ef4444"], false));
      mid.appendChild(createValueBar(g.value));
      const right = document.createElement("div"); right.className="team"; right.innerHTML = `<img src="${g.awayLogo}"> ${g.away} xG:${g.awayXG}`;
      if(g.awayStats && g.awayStats.lastGoals) { right.appendChild(createMiniXGCanvas(g.awayStats.lastGoals)); }

      row.appendChild(left); row.appendChild(mid); row.appendChild(right);
      el.appendChild(row);

      // ou + btts
      const ou = document.createElement("div"); ou.style.marginTop="8px";
      ou.appendChild(createStackedBar([g.prob.over25,g.prob.under25], ["#2196f3","#8b5cf6"], false));
      const btts = document.createElement("div"); btts.style.marginTop="6px"; btts.style.color = "#9aa4b2";
      btts.textContent = `BTTS: ${formatPct(g.btts)}  •  Over2.5: ${formatPct(g.prob.over25)}`;
      el.appendChild(ou); el.appendChild(btts);

      gamesDiv.appendChild(el);
    });

  } catch(err){
    console.error("Fehler beim Laden:", err);
    gamesDiv.innerHTML = "<p>Fehler beim Laden der Spiele. Siehe Konsole.</p>";
  }
}

document.getElementById("loadBtn").addEventListener("click", loadGames);
window.addEventListener("load", loadGames);
