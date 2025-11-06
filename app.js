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

// KORRIGIERTE getTrafficColor Funktion
function getTrafficColor(value, trend){
  // Berücksichtige den Trend für bessere Farben
  if (trend.includes("Strong")) {
    return trend.includes("Home") ? "#059669" : "#dc2626";
  }
  if (trend.includes("Home")) return "#16a34a";
  if (trend.includes("Away")) return "#ef4444";
  if (trend === "Draw") return "#f59e0b";
  if (trend === "Balanced") return "#6b7280";
  if (trend.includes("Slight")) {
    return trend.includes("Home") ? "#22c55e" : "#f97316";
  }
  
  // Fallback basierend auf Value
  if(value > 0.15) return '#16a34a';
  if(value > 0) return '#f59e0b';
  return '#ef4444';
}

// KORRIGIERTE createTrendArrow Funktion
function createTrendArrow(trend){
  const span = document.createElement("span");
  span.style.marginLeft = "8px";
  span.style.fontWeight = "bold";
  span.style.fontSize = "1.1em";
  
  if(trend === "Strong Home") {
    span.textContent = "⬆️⬆️ Strong Home";
    span.style.color = "#059669";
  } else if(trend === "Home") {
    span.textContent = "⬆️ Home";
    span.style.color = "#16a34a";
  } else if(trend === "Slight Home") {
    span.textContent = "↗️ Slight Home";
    span.style.color = "#22c55e";
  } else if(trend === "Strong Away") {
    span.textContent = "⬆️⬆️ Strong Away";
    span.style.color = "#dc2626";
  } else if(trend === "Away") {
    span.textContent = "⬆️ Away";
    span.style.color = "#ef4444";
  } else if(trend === "Slight Away") {
    span.textContent = "↗️ Slight Away";
    span.style.color = "#f97316";
  } else if(trend === "Draw") {
    span.textContent = "➡️ Draw";
    span.style.color = "#f59e0b";
  } else if(trend === "Balanced") {
    span.textContent = "⚖️ Balanced";
    span.style.color = "#6b7280";
  } else {
    span.textContent = `➡️ ${trend}`;
    span.style.color = "#6b7280";
  }
  return span;
}

// KORRIGIERTE renderTop10 Funktion
function renderTop10(games){
  top10Div.innerHTML = "";
  const top10Games = games.slice().map(g => {
    const maxWin = Math.max(g.prob.home, g.prob.away, g.prob.draw);
    // ✅ KORRIGIERT: Verwende den echten Trend aus der API!
    const trend = g.trend;
    return {...g, maxWin, trend};
  }).sort((a,b) => b.maxWin - a.maxWin).slice(0,10);

  top10Games.forEach(g => {
    const div = document.createElement("div");
    div.className = "game top10";
    
    // ✅ KORRIGIERT: Border-Farbe basierend auf echtem Trend
    let borderColor = "#6b7280"; // default gray
    if (g.trend.includes("Home")) borderColor = "#16a34a";
    else if (g.trend.includes("Away")) borderColor = "#ef4444";
    else if (g.trend === "Draw") borderColor = "#f59e0b";
    
    div.style.borderLeft = `6px solid ${borderColor}`;
    div.style.padding = "6px 8px";
    div.style.marginBottom = "6px";
    div.style.borderRadius = "4px";
    div.style.backgroundColor = "#f9fafb";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league})`;
    title.appendChild(createTrendArrow(g.trend));

    // Zeige die höchste Wahrscheinlichkeit an
    let highestProbType = "home";
    let highestProbValue = g.prob.home;
    if (g.prob.away > highestProbValue) {
      highestProbType = "away";
      highestProbValue = g.prob.away;
    }
    if (g.prob.draw > highestProbValue) {
      highestProbType = "draw";
      highestProbValue = g.prob.draw;
    }

    const bar = createBar(
      highestProbType.charAt(0).toUpperCase() + highestProbType.slice(1), 
      highestProbValue, 
      highestProbType === "home" ? "#16a34a" : highestProbType === "away" ? "#ef4444" : "#f59e0b"
    );

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
      
      // ✅ KORRIGIERT: Verwende den echten Trend für die Farbe
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league}) - <span class="date">${dateObj.toLocaleString()}</span></div>
        <div class="team"><img src="${g.homeLogo}" alt=""> ${g.home} xG:${g.homeXG} | Trend:${g.trend}</div>
        <div class="team"><img src="${g.awayLogo}" alt=""> ${g.away} xG:${g.awayXG} | Trend:${g.trend}</div>
      `;
      
      // ✅ KORRIGIERT: Over/Under mit Wahrscheinlichkeiten, nicht Values
      div.appendChild(createBar("Home", g.prob?.home ?? 0, "#4caf50"));
      div.appendChild(createBar("Draw", g.prob?.draw ?? 0, "#f59e0b"));
      div.appendChild(createBar("Away", g.prob?.away ?? 0, "#ef4444"));
      div.appendChild(createBar("Over 2.5", g.prob?.over25 ?? 0, "#2196f3"));
      div.appendChild(createBar("Under 2.5", g.prob ? (1 - (g.prob.over25 ?? 0)) : 0, "#8b5cf6"));
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
      
      // ✅ KORRIGIERT: Verwende den echten Trend für die Farbe
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      
      div.style.borderLeft = `6px solid ${color}`;
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Value ${bestVal.toFixed(2)} | Trend: ${g.trend}`;
      top7ValueDiv.appendChild(div);
    });

    // Top5 Over - ✅ KOMPLETT KORRIGIERT
    top5OverDiv.innerHTML = "";
    const top5Over = games.slice()
      .filter(g => (g.prob?.over25 ?? 0) > 0.35) // Mindestens 35% Over Chance
      .sort((a,b) => (b.prob?.over25 ?? 0) - (a.prob?.over25 ?? 0))
      .slice(0,5);

    top5Over.forEach(g => {
      const div = document.createElement("div");
      div.className = "game";
      
      // Over-spezifische Farbe
      const overProb = g.prob?.over25 ?? 0;
      let borderColor = "#2196f3";
      if (overProb > 0.7) borderColor = "#1e40af";
      else if (overProb > 0.55) borderColor = "#3b82f6";
      
      div.style.borderLeft = `6px solid ${borderColor}`;
      
      const overPercentage = Math.round(overProb * 100);
      div.textContent = `${g.home} vs ${g.away} (${g.league}) → Over 2.5: ${overPercentage}% | Trend: ${g.trend}`;
      
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
      
      // ✅ KORRIGIERT: Verwende den echten Trend für die Farbe
      const bestVal = Math.max(g.value.home, g.value.draw, g.value.away);
      const color = getTrafficColor(bestVal, g.trend);
      
      div.style.borderLeft = `6px solid ${color}`;
      div.innerHTML = `<div><strong>${g.home}</strong> vs <strong>${g.away}</strong> (${g.league}) - <span class="date">${dateObj.toLocaleString()}</span></div>
        <div class="team"><img src="${g.homeLogo}" alt=""> ${g.home} xG:${g.homeXG} | Trend:${g.trend}</div>
        <div class="team"><img src="${g.awayLogo}" alt=""> ${g.away} xG:${g.awayXG} | Trend:${g.trend}</div>
      `;
      
      // ✅ KORRIGIERT: Over/Under mit Wahrscheinlichkeiten
      div.appendChild(createBar("Home", g.prob?.home ?? 0, "#4caf50"));
      div.appendChild(createBar("Draw", g.prob?.draw ?? 0, "#f59e0b"));
      div.appendChild(createBar("Away", g.prob?.away ?? 0, "#ef4444"));
      div.appendChild(createBar("Over 2.5", g.prob?.over25 ?? 0, "#2196f3"));
      div.appendChild(createBar("Under 2.5", g.prob ? (1 - (g.prob.over25 ?? 0)) : 0, "#8b5cf6"));
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
