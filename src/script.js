// OpenWeatherMap API key 
const API_KEY = "b3b0e4acb6bef0cb13d5c6e83a9ca697";

// Base URL for the OpenWeatherMap v2.5 
const BASE = "https://api.openweathermap.org/data/2.5";

let tempC = null;
let feelsLikeC  = null;
let unit  = "C";
let recentCities = [];
let dropdownOpen = false;

// DOM References
const cityInput      = document.getElementById("city-input");
const clearBtn       = document.getElementById("clear-btn");
const recentDropdown = document.getElementById("recent-dropdown");
const recentList     = document.getElementById("recent-list");
const weatherCard    = document.getElementById("weather-card");
const welcomeState   = document.getElementById("welcome-state");
const forecastSection= document.getElementById("forecast-section");
const loadingOverlay = document.getElementById("loading-overlay");
const tempAlert      = document.getElementById("temp-alert");
const tempAlertMsg   = document.getElementById("temp-alert-msg");
const rainContainer  = document.getElementById("rain-container");

document.addEventListener("DOMContentLoaded", () => {
    
    loadRecent();

    refreshClock();
    setInterval(refreshClock, 60000);

    cityInput.addEventListener("input",   onInput);
    cityInput.addEventListener("focus",   onFocus);
    cityInput.addEventListener("keydown", e => {
        if (e.key === "Enter")  searchByCity();   
        if (e.key === "Escape") closeDropdown();  
    });

    document.addEventListener("click", e => {
        if (!e.target.closest("#city-input") && !e.target.closest("#recent-dropdown"))
        closeDropdown();
    });
});

// Updates the header date/time display with the current local time. Called on load and every 60 seconds using setInterval.
function refreshClock() {
    const el = document.getElementById("current-datetime");
    if (!el) return;
    el.textContent = new Date().toLocaleString("en-US", {
        weekday: "short", 
        month: "short", 
        day: "numeric",
        hour: "2-digit", 
        minute: "2-digit"
    });
}

// For Searching using city name
function searchByCity() {
  const val = cityInput.value.trim();

    if (!val) { 
            showToast("⚠️ Please enter a city name.", "warning"); 
            return; 
    }
    if (val.length<2) { 
            showToast("⚠️ City name too short (min 2 chars).", "warning"); 
            return; 
    }

    if (!/^[a-zA-Z\s\-',\.]+$/.test(val)) {
        showToast("⚠️ Invalid city name. Use letters only.", "warning"); 
        return;
    }

    closeDropdown();
    fetchByCity(val);
}


// For Current Location of the user
function useCurrentLocation() {
    if (!navigator.geolocation) {
        showToast("❌ Geolocation not supported by your browser.", "error"); 
        return;
    }

    const btn = document.getElementById("location-btn");
    btn.innerHTML = "<span>📡</span> Detecting…";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        pos => {
            fetchByCoords(pos.coords.latitude, pos.coords.longitude);
            btn.innerHTML = "<span>📍</span> Use Current Location";
            btn.disabled = false;
        },
        err => {
            btn.innerHTML = "<span>📍</span> Use Current Location";
            btn.disabled = false;
            
            const msgs = {
                1: "Location access denied.",
                2: "Position unavailable.",
                3: "Request timed out."
        };
            showToast("❌ " + (msgs[err.code] || "Location error."), "error");
        },
        { timeout: 10000, maximumAge: 60000 } 
    );
}


// Fetches both the current weather and 5-day forecast for a city
async function fetchByCity(city) {
    showLoading(true);
    try {
            const [wRes, fRes] = await Promise.all([
            fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
            fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
        ]);
        await processResponses(wRes, fRes);
    } catch(e) {
        handleNetError(e);
    } finally {
        showLoading(false);
    }
}

// Fetches both the current weather and 5-day forecast using GPS coordinates
async function fetchByCoords(lat, lon) {
    showLoading(true);
    try {
            const [wRes, fRes] = await Promise.all([
            fetch(`${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
            fetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        ]);
        await processResponses(wRes, fRes);
    } catch(e) {
        handleNetError(e);
    } finally {
        showLoading(false);
    }
}

// For Processing, handling http errors, wRes - Response from the /weather endpoint and fRes - Response from the /forecast endpoint.
async function processResponses(wRes, fRes) {
    if (!wRes.ok) {
        
        const msgs = {
            401: "❌ Invalid API key. Update API_KEY in the code.",
            404: "❌ City not found. Check spelling and try again.",
            429: "⚠️ Rate limit reached. Wait a moment and retry."
        };
        showToast(msgs[wRes.status] || `❌ API error (${wRes.status}).`, "error");
        return;
    }

    const wData = await wRes.json();
    const fData = fRes.ok ? await fRes.json() : null; // Forecast is non-critical

    renderCurrent(wData);
    if (fData) renderForecast(fData);

    saveRecent(wData.name + ", " + wData.sys.country);

    updateBg(wData.weather[0].main, wData.weather[0].id);

    checkTempAlert(wData.main.temp);
}

// For rendering the current weather
function renderCurrent(d) {

    tempC = d.main.temp;
    feelsLikeC = d.main.feels_like;

    setText("city-name",    d.name);
    setText("country-info", d.sys.country + " · " + localTime(d.timezone));
    setText("weather-date", new Date().toLocaleDateString("en-US", {
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric"
    }));
    setText("weather-icon", weatherEmoji(d.weather[0].id));
    setText("weather-desc", d.weather[0].description);
    setText("humidity", d.main.humidity + "%");
    setText("wind-speed", Math.round(d.wind.speed * 3.6) + " km/h"); // m/s → km/h
    setText("visibility", d.visibility ? (d.visibility / 1000).toFixed(1) + " km" : "N/A");
    setText("pressure", d.main.pressure + " hPa");
    setText("sunrise", fmtUnix(d.sys.sunrise, d.timezone));
    setText("sunset", fmtUnix(d.sys.sunset,  d.timezone));

    renderTemp(); // Apply the currently selected unit (°C or °F).

    // Transition from the welcome placeholder to the actual weather card.
    welcomeState.classList.add("hidden");
    weatherCard.classList.remove("hidden");
    weatherCard.classList.add("card-reveal"); // CSS entry animation
}

// For rendering the temperatures
function renderTemp() {

    if (tempC === null) return; 

    const t  = unit === "C" ? Math.round(tempC) : Math.round(cToF(tempC));
    const fl = unit === "C" ? Math.round(feelsLikeC) + "°C" : Math.round(cToF(feelsLikeC)) + "°F";

    setText("temp-value", t);
    setText("temp-unit-lbl", unit === "C" ? "°C" : "°F");
    setText("feels-like", fl);
}

// For rendering the 5 day forecast
function renderForecast(data) {
    
    const byDay = {};
    data.list.forEach(item => {
            const d   = new Date(item.dt * 1000);
            const key = d.toLocaleDateString("en-US", {
            weekday: "short", month: "short", day: "numeric"
        });
        const h = d.getHours();
        
        if (!byDay[key] || Math.abs(h - 12) < Math.abs(new Date(byDay[key].dt * 1000).getHours() - 12))
        byDay[key] = item;
    });

    const grid = document.getElementById("forecast-grid");
    grid.innerHTML = ""; 

    // Render up to 5 day cards with a staggered reveal animation.
    Object.entries(byDay).slice(0, 5).forEach(([label, item], i) => {
        const c = document.createElement("div");
        c.className = "forecast-card card-reveal";
        c.style.animationDelay = i * 70 + "ms"; 

        c.innerHTML = `
        <p class="text-white/55 text-xs font-mono-custom text-center leading-tight">${label}</p>
        <div class="text-3xl my-1">${weatherEmoji(item.weather[0].id)}</div>
        <p class="text-white font-display font-bold text-sm">${Math.round(item.main.temp)}°C</p>
        <div class="w-full border-t border-white/10 pt-2 flex flex-col gap-1">
            <div class="flex items-center gap-1 text-white/50 text-xs"><span>💧</span>${item.main.humidity}%</div>
            <div class="flex items-center gap-1 text-white/50 text-xs"><span>💨</span>${Math.round(item.wind.speed * 3.6)} km/h</div>
            <div class="flex items-center gap-1 text-white/50 text-xs"><span>🌡</span>${Math.round(item.main.feels_like)}°C</div>
        </div>`;

        grid.appendChild(c);
    });

    forecastSection.classList.remove("hidden");
}

// For changing the units
function setUnit(u) {
    unit = u;
    renderTemp();
    
    document.getElementById("btn-c").classList.toggle("active", u === "C");
    document.getElementById("btn-f").classList.toggle("active", u === "F");
}

// For Dynamic background
function updateBg(main, id) {
    const body = document.getElementById("app-body");
    body.className = ""; 

    const h       = new Date().getHours();
    const isNight = h >= 20 || h < 5; 

    
    if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
        body.classList.add("bg-rainy");
        startRain();
        return;
    }

    stopRain(); 

    if (isNight) body.classList.add("bg-night");
    else if (main === "Clear") body.classList.add("bg-clear");
    else if (main === "Clouds") body.classList.add("bg-cloudy");
    else if (main === "Snow") body.classList.add("bg-snow");
    else if (id >= 800) body.classList.add("bg-clear");  
    else body.classList.add("bg-cloudy"); 
}

// For Rain animation
function startRain() {
    rainContainer.classList.remove("hidden");
    rainContainer.innerHTML = ""; 

    const count = window.innerWidth < 768 ? 55 : 110;

    for (let i = 0; i < count; i++) {
        const d = document.createElement("div");
        d.className = "rain-drop";

        Object.assign(d.style, {
        left:              Math.random() * 100 + "%",
        height:            (15 + Math.random() * 22) + "px",
        opacity:           (0.3 + Math.random() * 0.5).toString(),
        animationDuration: (0.55 + Math.random() * 0.7) + "s",
        animationDelay:    (Math.random() * 2) + "s"
        });

        rainContainer.appendChild(d);
  }
}

function stopRain() {
    rainContainer.classList.add("hidden");
    rainContainer.innerHTML = "";
}

// For temperature alert
function checkTempAlert(t) {
    let msg = null;

    if (t > 40) msg = `🔥 Extreme Heat: ${Math.round(t)}°C! Stay hydrated, avoid direct sunlight.`;
    else if (t > 35) msg = `☀️ Heat Advisory: ${Math.round(t)}°C. Stay cool and drink plenty of water.`;
    else if (t < -10) msg = `❄️ Extreme Cold: ${Math.round(t)}°C! Dress warmly and limit time outdoors.`;

    if (msg) {
        tempAlertMsg.textContent = msg;
        tempAlert.classList.remove("hidden");
        tempAlert.classList.add("slide-down");  
        setTimeout(() => tempAlert.classList.add("hidden"), 12000); 
    } else {
        tempAlert.classList.add("hidden"); 
    }
}

// For loading Recent Cities from localStorage
function loadRecent() {
    try {
        recentCities = JSON.parse(localStorage.getItem("recent")) || [];
    } catch {
        recentCities = [];
    }
}

// Saves the recent city that was searched
function saveRecent(city) {
    recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
    recentCities.unshift(city);          
    recentCities = recentCities.slice(0, 8); 
    try { localStorage.setItem("recent", JSON.stringify(recentCities)); } catch {}
}

// Clears recent-cities list from memory and localStorage */
function clearRecentCities() {
    recentCities = [];
    try { localStorage.removeItem("recent"); } catch {}
    closeDropdown();
    showToast("✓ Recent searches cleared.", "success");
}

// For dropdown list of the recent cities searched
function renderDropdown() {
    if (!recentCities.length) { closeDropdown(); return; }

    recentList.innerHTML = "";

    recentCities.forEach(city => {
        const li = document.createElement("li");
        li.className = "recent-item";

        const label = document.createElement("span");
        label.className = "flex items-center gap-2 flex-1";
        label.innerHTML = `<span style="color:rgba(255,255,255,.3);font-size:.85rem">🕐</span>${city}`;

        const rmv = document.createElement("button");
        rmv.textContent = "×";
        rmv.className   = "text-white/30 hover:text-red-400 text-lg leading-none transition-colors flex-shrink-0";
        rmv.onclick = e => {
            e.stopPropagation(); 
            recentCities = recentCities.filter(c => c !== city);
            try { localStorage.setItem("recent", JSON.stringify(recentCities)); } catch {}
            renderDropdown(); 
        };

        li.append(label, rmv);

        li.onclick = () => {
            cityInput.value = city.split(",")[0].trim(); 
            closeDropdown();
            fetchByCity(city.split(",")[0].trim());
        };

        recentList.appendChild(li);
    });

    recentDropdown.classList.remove("hidden");
    dropdownOpen = true;
}

// Hides the recent-cities dropdown
function closeDropdown() {
    recentDropdown.classList.add("hidden");
    dropdownOpen = false;
}

// Shows/hides the clear (×) button based on whether the input has a value
function onInput() {
    clearBtn.classList.toggle("hidden", !cityInput.value);
}

// Opens the recent-cities dropdown when the input is focused (if there are entries)
function onFocus() {
    if (recentCities.length) renderDropdown();
}

// Clears the city input field and returns focus to it
function clearSearch() {
    cityInput.value = "";
    clearBtn.classList.add("hidden");
    cityInput.focus();
}

// For Popup or Toast Notification System
function showToast(msg, type = "info") {
    const styles = {
        error:   "bg-red-500/85 border-red-400/40",
        warning: "bg-amber-500/85 border-amber-400/40",
        success: "bg-emerald-500/85 border-emerald-400/40",
        info:    "bg-sky-500/85 border-sky-400/40"
    };

    const t = document.createElement("div");
    t.className = `toast-in ${styles[type] || styles.info} backdrop-blur-md border text-white rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 text-sm font-body`;
    t.innerHTML = `
        <span class="flex-1">${msg}</span>
        <button onclick="dismissToast(this.parentElement)" class="text-white/55 hover:text-white text-xl leading-none ml-2 flex-shrink-0">×</button>`;

    document.getElementById("toast-container").appendChild(t);

    setTimeout(() => dismissToast(t), 5500);
}


function dismissToast(el) {
    if (!el?.parentElement) return;
    el.classList.replace("toast-in", "toast-out"); 
    setTimeout(() => el.remove(), 280);            
}

// For loading overlay
function showLoading(v) {
    loadingOverlay.classList.toggle("hidden", !v);
}

// Helper Function
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// For converting celsius to fahrenheit
function cToF(c) { 
    return c * 9 / 5 + 32; 
}


function fmtUnix(ts, tz) {
    const d = new Date((ts + tz) * 1000);
    return d.toUTCString().slice(17, 22);
}

// For returning the current local time of the searched city as a formatted string.
function localTime(tz) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + tz * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit"
    });
}

// For Mapping an OpenWeatherMap condition ID to the relatable emoji.
function weatherEmoji(id) {
    if (id >= 200 && id < 300) return "⛈️";  // Thunderstorm
    if (id >= 300 && id < 400) return "🌦️";  // Drizzle
    if (id >= 500 && id < 600) return "🌧️";  // Rain
    if (id >= 600 && id < 700) return "❄️";  // Snow
    if (id >= 700 && id < 800) return id === 741 ? "🌫️" : id === 781 ? "🌪️" : "🌁"; // Atmosphere
    if (id === 800) return "☀️";  // Clear sky
    if (id === 801) return "🌤️";  // Few clouds 
    if (id === 802) return "⛅";  // Scattered clouds 
    if (id >= 803) return "☁️";  // Broken / overcast clouds
    return "🌈"; 
}

// For handling network errors
function handleNetError(err) {
    console.error(err);
    showToast(
        err.name === "TypeError" ? "❌ Network error. Check your internet connection and ensure the API key is set." : "❌ Unexpected error. Please try again.", "error"
    );
}