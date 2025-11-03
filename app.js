const top3Div = document.getElementById("top3");
const top7ValueDiv = document.getElementById("top7Value");
const top5OverDiv = document.getElementById("top5Over25");
const gamesDiv = document.getElementById("games");
const top10Div = document.getElementById("top10");
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
  if(value > 0.15 && (trend === 'home' || trend === 'away')) return '#16a34a'; // stark grün
  if(value > 0) return '#f59e0b'; // gelb
  return '#ef4444'; // rot
}

function createTrendArrow(trend){
  const span = document.createElement("span");
  span.style.marginLeft = "8px";
  span.style.fontWeight = "bold";
  span.style.fontSize = "1.1em";
  if(trend === "home") {
    span.textContent = "⬆️ Home";
    span.style.color = "#16a34a";
  } else if(trend === "away") {
    span.textContent = "⬆️ Away";
    span.style.color = "#ef4444";
  } else {
    span.textContent = "➡️ Draw";
    span.style.color = "#f59e0b";
  }
  return span;
}

function renderTop10(games){
  top10Div.innerHTML = "";
  const top10Games = games.slice().map(g => {
    const maxWin = Math.max(g.prob.home, g.prob.away);
    const trend = g.prob.home > g.prob.away ? 'home' : 'away';
    return {...g, maxWin, trend};
  }).sort((a,b) => b.maxWin - a.maxWin).slice(0,10);

  top10Games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game top10";
    div.style.borderLeft = `6px solid ${g.trend === "home" ? "#16a34a" : "#ef4444"}`;
    div.style.padding = "6px 8px";
    div.style.marginBottom = "6px";
    div.style.borderRadius = "4px";
    div.style.backgroundColor = "#f9fafb";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league})`;
    title.appendChild(createTrendArrow(g.trend));

    const bar = createBar(g.trend === "home" ? "Home" : "Away", g.maxWin, g.trend === "home" ? "#16a34a" : "#ef4444");

    div.appendChild(title);
    div.appendChild(bar);
    top10Div.appendChild(div);
  });
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

    if(leagueSelect.value) games = games.filter(g => g.league === leagueSelect.value);
    if(teamInput.value){
      const q = teamInput.value.toLowerCase();
      games = games.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    renderTop10(games); // Top 10 laden

    // Top3
    top3Div.innerHTML = "";
    const topGames = games.slice(0,3);
    topGames.forEach(g => {
      g.btts = g.btts ?? 0;
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

    // Top7 Value
    top7ValueDiv.innerHTML = "";
    const top7 = games.slice(0,7);
    top7.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";
      const dateObj = g.date ? new Date(g.date) : new Date();
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      div.style.borderLeft = `6px solid ${color}`;
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Value ${bestVal.toFixed(2)} | Trend: ${g.trend}`;
      top7ValueDiv.appendChild(div);
    });

    // Top5 Over
    top5OverDiv.innerHTML = "";
    const top5Over = games.slice().sort((a,b) => b.value.over25 - a.value.over25).slice(0,5);
    top5Over.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";
      div.style.borderLeft = `6px solid #2196f3`;
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Over2.5 ${(g.prob?.over25 ?? g.value.over25).toFixed(2)} | Trend: ${g.trend}`;
      top5OverDiv.appendChild(div);
    });

    // Alle anderen Spiele
    gamesDiv.innerHTML = "";
    const otherGames = games.slice(3);
    otherGames.forEach(g => {
      g.btts = g.btts ?? 0;
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
