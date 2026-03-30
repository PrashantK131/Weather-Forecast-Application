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