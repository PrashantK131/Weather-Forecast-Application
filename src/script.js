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
    // Restore any cities saved in a previous session.
    loadRecent();

    // Show the current date/time in the header and keep it updated every minute.
    refreshClock();
    setInterval(refreshClock, 60000);

    // Wire up the search input's interactive behaviours.
    cityInput.addEventListener("input",   onInput);
    cityInput.addEventListener("focus",   onFocus);
    cityInput.addEventListener("keydown", e => {
        if (e.key === "Enter")  searchByCity();   // Submit on Enter
        if (e.key === "Escape") closeDropdown();  // Dismiss recent-cities on Escape
    });

    // Close the dropdown when the user clicks anywhere outside it.
    document.addEventListener("click", e => {
        if (!e.target.closest("#city-input") && !e.target.closest("#recent-dropdown"))
        closeDropdown();
    });
});

// Updates the header date/time display with the current local time. Called on load and every 60 seconds via setInterval.
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

/**
 * Processes the raw HTTP responses from the two API calls.
 * Handles HTTP-level errors (401, 404, 429, etc.) with user-friendly toasts, then delegates rendering to renderCurrent() and renderForecast().
 * wRes - Response from the /weather endpoint.
 * fRes - Response from the /forecast endpoint.
 */
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

    tempC      = d.main.temp;
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
        // Replace existing entry for this day only if the new one is closer to 12:00.
        if (!byDay[key] || Math.abs(h - 12) < Math.abs(new Date(byDay[key].dt * 1000).getHours() - 12))
        byDay[key] = item;
    });

    const grid = document.getElementById("forecast-grid");
    grid.innerHTML = ""; // Clear any previous forecast

    // Render up to 5 day cards with a staggered reveal animation.
    Object.entries(byDay).slice(0, 5).forEach(([label, item], i) => {
        const c = document.createElement("div");
        c.className = "forecast-card card-reveal";
        c.style.animationDelay = i * 70 + "ms"; // Stagger each card by 70 ms

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