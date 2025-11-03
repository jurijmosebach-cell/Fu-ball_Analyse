const top10Div = document.getElementById("top10");
const top3Div = document.getElementById("top3");
const top7ValueDiv = document.getElementById("top7Value");
const top5OverDiv = document.getElementById("top5Over25");
const gamesDiv = document.getElementById("games");
const loadBtn = document.getElementById("loadBtn");
const dateInput = document.getElementById("date");
const leagueSelect = document.getElementById("league");
const teamInput = document.getElementById("team");

/* -------- Hilfsfunktionen -------- */
function createBar(label, value, color){
  const wrap = document.createElement("div");
  wrap.className = "bar-container";
  const bar = document.createElement("div");
  bar.className = "bar";
  const pct = Math.round((value || 0) * 100);
  bar.style.width = `${pct}%`;
  bar.style.background = color;
  bar.textContent = `${label} ${pct}%`;
  wrap.appendChild(bar);
  return wrap;
}

function getTrafficColor(value, trend){
  if(value > 0.15 && (trend === 'Home' || trend === 'Away')) return '#16a34a';
  if(value > 0) return '#f59e0b';
  return '#ef4444';
}

function determineTrend(game){
  const probs = game.prob;
  if(!probs) return 'Neutral';
  if(probs.home > probs.away + 0.1) return 'Home';
  if(probs.away > probs.home + 0.1) return 'Away';
  if(Math.abs(probs.home - probs.away) < 0.1 && probs.draw > 0.25) return 'Draw';
  return 'Neutral';
}

/* -------- Hauptfunktion -------- */
async function loadGames(){
  try {
    let url = "/api/games";
    if(dateInput.value) url += "?date=" + dateInput.value;
    const res = await fetch(url);
    const data = await res.json();
    if(!data || !Array.isArray(data.response)){
      gamesDiv.innerHTML = "<p>⚠️ Keine Spieldaten empfangen.</p>";
      return;
    }

    let games = data.response.slice();

    // Filter Liga & Team
    if(leagueSelect.value) games = games.filter(g => g.league === leagueSelect.value);
    if(teamInput.value){
      const q = teamInput.value.toLowerCase();
      games = games.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    // Trend & Sieg-Wahrscheinlichkeit berechnen
    games.forEach(g=>{
      g.btts = g.btts ?? 0;
      g.trend = determineTrend(g);
      g.winProb = Math.max(g.prob?.home ?? 0, g.prob?.away ?? 0); // höchste Sieg-Wahrscheinlichkeit
    });

    /* -------- TOP 10 – Highest Win Probability -------- */
    top10Div.innerHTML = "";
    const top10 = games.slice().sort((a,b)=>b.winProb - a.winProb).slice(0,10);
    top10.forEach(g=>{
      const div = document.createElement("div");
      div.className = "game";
      const winSide = (g.prob?.home ?? 0) > (g.prob?.away ?? 0) ? g.home : g.away;
      const dateObj = g.date ? new Date(g.date) : new Date();
      div.innerHTML = `
        <div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league})</div>
        <div>🏆 ${winSide} – ${(g.winProb*100).toFixed(1)}% Siegwahrscheinlichkeit</div>
        <div class="meta">xG: ${g.homeXG.toFixed(2)}-${g.awayXG.toFixed(2)} | ${dateObj.toLocaleString()}</div>
      `;
      top10Div.appendChild(div);
    });

    /* -------- TOP 3 Value -------- */
    games.sort((a,b) => Math.max(b.value.home,b.value.draw,b.value.away) - Math.max(a.value.home,a.value.draw,a.value.away));
    const top3 = games.slice(0,3);
    top3Div.innerHTML = "";
    top3.forEach(g=>{
      const div = document.createElement("div");
      div.className="game top3";
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `
        <div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league})</div>
        <div>💡 Value ${bestVal.toFixed(2)} | Trend: ${g.trend}</div>
      `;
      top3Div.appendChild(div);
    });

    /* -------- TOP 7 Value-Spiele -------- */
    top7ValueDiv.innerHTML = "";
    const top7 = games.slice(0,7);
    top7.forEach(g=>{
      const div = document.createElement("div");
      div.className = "game";
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      div.textContent = `${g.home} vs ${g.away} → Value ${bestVal.toFixed(2)} | Trend: ${g.trend}`;
      top7ValueDiv.appendChild(div);
    });

    /* -------- TOP 5 Over 2.5 -------- */
    top5OverDiv.innerHTML = "";
    const top5Over = games.slice().sort((a,b) => b.value.over25 - a.value.over25).slice(0,5);
    top5Over.forEach(g=>{
      const div = document.createElement("div");
      div.className = "game";
      div.style.borderLeft = `6px solid #2196f3`;
      div.textContent = `${g.home} vs ${g.away} → Over2.5 ${(g.prob?.over25*100).toFixed(0)}%`;
      top5OverDiv.appendChild(div);
    });

    /* -------- Alle anderen Spiele (kompakt) -------- */
    gamesDiv.innerHTML = "";
    games.forEach(g=>{
      const div = document.createElement("div");
      div.className = "game";
      const bestVal = Math.max(g.value.home,g.value.draw,g.value.away);
      const color = getTrafficColor(bestVal,g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `
        <div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league})</div>
        <div>Home ${(g.prob.home*100).toFixed(0)}% | Draw ${(g.prob.draw*100).toFixed(0)}% | Away ${(g.prob.away*100).toFixed(0)}%</div>
        <div>Over2.5 ${(g.prob.over25*100).toFixed(0)}% | BTTS ${(g.btts*100).toFixed(0)}%</div>
        <div>xG ${g.homeXG.toFixed(2)} - ${g.awayXG.toFixed(2)}</div>
      `;
      gamesDiv.appendChild(div);
    });

  } catch (err) {
    console.error("Fehler beim Laden:", err);
    gamesDiv.innerHTML = "<p>❌ Fehler beim Laden der Spiele.</p>";
  }
}

loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);
