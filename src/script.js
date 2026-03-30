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

