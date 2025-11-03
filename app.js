const top3Div = document.getElementById("top3");
const top7ValueDiv = document.getElementById("top7Value");
const top5OverDiv = document.getElementById("top5Over25");
const top10Div = document.getElementById("top10MostLikely");
const gamesDiv = document.getElementById("games");
const loadBtn = document.getElementById("loadBtn");
const dateInput = document.getElementById("date");
const leagueSelect = document.getElementById("league");
const teamInput = document.getElementById("team");

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
  if(value > 0.15 && (trend === 'home' || trend === 'away')) return '#16a34a';
  if(value > 0) return '#f59e0b';
  return '#ef4444';
}

function determineTrend(game) {
  const trendCandidates = [
    {type:'Home', value:game.prob?.home ?? 0},
    {type:'Draw', value:game.prob?.draw ?? 0},
    {type:'Away', value:game.prob?.away ?? 0},
    {type:'Over2.5', value:game.prob?.over25 ?? 0},
    {type:'BTTS', value:game.btts ?? 0}
  ];

  // Gewichtung, damit BTTS nicht automatisch gewinnt
  trendCandidates.forEach(tc=>{
    if(tc.type==='BTTS') tc.value *= 0.7;
    else if(tc.type==='Over2.5') tc.value *= 0.9;
  });

  return trendCandidates.reduce((a,b)=>b.value>a.value?b:a).type;
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

    // Filter Liga
    if(leagueSelect.value) games = games.filter(g => g.league === leagueSelect.value);
    // Filter Team
    if(teamInput.value){
      const q = teamInput.value.toLowerCase();
      games = games.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    // Sortiere nach maximalem Value (1X2)
    games.sort((a,b) => Math.max(b.value.home,b.value.draw,b.value.away) - Math.max(a.value.home,a.value.draw,a.value.away));

    // --- Top3 Spiele ---
    const topGames = games.slice(0,3);
    top3Div.innerHTML = "";
    topGames.forEach(g => {
      g.btts = g.btts ?? 0;
      g.trend = determineTrend(g);
      const div = document.createElement("div");
      div.className = "game top3";
      const dateObj = g.date ? new Date(g.date) : new Date();
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league}) - <span class="date">${dateObj.toLocaleString()}</span></div>
        <div class="team"><img src="${g.homeLogo}" alt=""> ${g.home} xG:${g.homeXG} | Trend:${g.trend}</div>
        <div class="team"><img src="${g.awayLogo}" alt=""> ${g.away} xG:${g.awayXG} | Trend:${g.trend}</div>
      `;
      div.appendChild(createBar("Home", g.prob?.home ?? g.value.home, "#4caf50"));
      div.appendChild(createBar("Draw", g.prob?.draw ?? g.value.draw, "#f59e0b"));
      div.appendChild(createBar("Away", g.prob?.away ?? g.value.away, "#ef4444"));
      div.appendChild(createBar("Over 2.5", g.prob?.over25 ?? g.value.over25, "#2196f3"));
      div.appendChild(createBar("Under 2.5", g.prob ? (1 - g.prob.over25) : g.value.under25, "#8b5cf6"));
      div.appendChild(createBar("BTTS", g.btts ?? 0, "#ff7a00"));
      top3Div.appendChild(div);
    });

    // --- Top7 Value ---
    top7ValueDiv.innerHTML = "";
    const top7 = games.slice(0,7);
    top7.forEach(g=>{
      const div = document.createElement("div");
      div.className="game";
      const dateObj = g.date ? new Date(g.date) : new Date();
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Value ${bestVal.toFixed(2)} | Trend: ${g.trend}`;
      top7ValueDiv.appendChild(div);
    });

    // --- Top5 Over2.5 ---
    top5OverDiv.innerHTML = "";
    const top5Over = games.slice().sort((a,b)=>b.value.over25 - a.value.over25).slice(0,5);
    top5Over.forEach(g=>{
      const div = document.createElement("div");
      div.className="game";
      div.style.borderLeft = `6px solid #2196f3`;
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Over2.5 ${(g.prob?.over25 ?? g.value.over25).toFixed(2)} | Trend: ${g.trend}`;
      top5OverDiv.appendChild(div);
    });

    // --- Top10 Most Likely ---
    top10Div.innerHTML = "";
    const top10 = games.slice().map(g=>{
      const trend = determineTrend(g);
      let value = 0;
      switch(trend){
        case 'Home': value = g.prob?.home ?? 0; break;
        case 'Draw': value = g.prob?.draw ?? 0; break;
        case 'Away': value = g.prob?.away ?? 0; break;
        case 'Over2.5': value = g.prob?.over25 ?? 0; break;
        case 'BTTS': value = g.btts ?? 0; break;
      }
      return {...g, trend, trendProb:value};
    }).sort((a,b)=>b.trendProb - a.trendProb).slice(0,10);

    top10.forEach(g=>{
      const div = document.createElement("div");
      div.className="game";
      const dateObj = g.date ? new Date(g.date) : new Date();
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → ${g.trend} ${(g.trendProb*100).toFixed(0)}% | xG: ${g.homeXG.toFixed(2)}-${g.awayXG.toFixed(2)}`;
      top10Div.appendChild(div);
    });

    // --- Alle anderen Spiele ---
    const otherGames = games.slice(3);
    gamesDiv.innerHTML = "";
    otherGames.forEach(g=>{
      g.btts = g.btts ?? 0;
      g.trend = determineTrend(g);
      const div = document.createElement("div");
      div.className = "game";
      const dateObj = g.date ? new Date(g.date) : new Date();
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league}) - <span class="date">${dateObj.toLocaleString()}</span></div>
        <div class="team"><img src="${g.homeLogo}" alt=""> ${g.home} xG:${g.homeXG} | Trend:${g.trend}</div>
        <div class="team"><img src="${g.awayLogo}" alt=""> ${g.away} xG:${g.awayXG} | Trend:${g.trend}</div>
      `;
      div.appendChild(createBar("Home", g.prob?.home ?? g.value.home, "#4caf50"));
      div.appendChild(createBar("Draw", g.prob?.draw ?? g.value.draw, "#f59e0b"));
      div.appendChild(createBar("Away", g.prob?.away ?? g.value.away, "#ef4444"));
      div.appendChild(createBar("Over 2.5", g.prob?.over25 ?? g.value.over25, "#2196f3"));
      div.appendChild(createBar("Under 2.5", g.prob ? (1 - g.prob.over25) : g.value.under25, "#8b5cf6"));
      div.appendChild(createBar("BTTS", g.btts ?? 0, "#ff7a00"));
      gamesDiv.appendChild(div);
    });

  } catch (err) {
    console.error("Fehler beim Laden:", err);
    gamesDiv.innerHTML = "<p>Fehler beim Laden der Spiele. Siehe Konsole.</p>";
  }
}

loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);
