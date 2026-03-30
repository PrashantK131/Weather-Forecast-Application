# 🌤️ Weather Forecast App
A modern, responsive weather forecast application built with HTML, vanilla css, Tailwind CSS v4 and vanilla JavaScript. This application provides real-time weather data using the OpenWeatherMap API and presents it using a glass-morphism UI with dynamic, weather-reactive backgrounds.
 
## 🚀 Features
 
- **City search** — look up any city worldwide by name
- **GPS location** — one-click detection of your current position
- **Current conditions** — temperature, feels-like, humidity, wind speed, visibility, pressure and sunrise & sunset
- **5-day forecast** — noon-representative daily cards with temperature, humidity, wind and feels-like
- **°C / °F toggle** — switch units on the current-day temperature without refetching
- **Dynamic backgrounds** — gradient and colour scheme adapt to the live weather condition (clear, cloudy, rainy, snowy, night)
- **Rain animation** — animated rain drops overlay the page when the condition is rainy/drizzly/stormy.
- **Extreme-temperature alert** — a dismissible banner appears automatically above 35 °C or below −10 °C
- **Recent cities** — dropdown of up to 8 previously searched cities, persisted in `localStorage`, each entry can be removed individually.
- **Toast or Popup notifications** — non-blocking, auto-dismissing messages replace `alert()` for all errors and confirmations.
- **Input validation** — empty queries, too-short strings and non-letter characters are caught before the API is called.
- **Responsive layout** — tested for desktop (1280 px+), iPad Mini (768 px), and iPhone SE (375 px).
 
## Tech Stack
 
- **HTML5**: Semantic structure.
- **Tailwind CSS**: For modern, utility-first styling and responsive design.
- **JavaScript (ES6+)**: For DOM manipulation, API integration and application logic.
- **OpenWeatherMap API**: Source for all weather data.
 
## Project Structure
 
Weather-Forecast-Project/
|
├── index.html          # App shell and static markup
├── .gitignore
├── src/
|   ├── input.css       # Tailwind source file (editable)
│   ├── output.css      # Compiled Tailwind output (auto-generated, do not edit)
│   └── script.js       # All application logic
├── package.json        # Node dependencies (Tailwind CLI)
├── package-lock.json
└── README.md

 
## Getting Started
 
### Prerequisites
 
- A modern web browser.
- A code editor (e.g., VS Code).
- An API Key from OpenWeatherMap.
 
### 1 — Clone the repository

```bash
git clone https://github.com/<your-username>/weather-forecast.git
cd weather-forecast
```
 
### 2 — Install dependencies
 
```bash
npm install
```
 
- This installs the Tailwind CSS CLI locally.
 
### 3 — Add your API key
 
- Open `src/script.js` and replace the placeholder on line 1:
 
```js
const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
```
 
> **Note:** The key included in the source is a my own development key which was used during testing and may be rate-limited or get expired in future. So, always use your own key.
 
### 4 — Build the CSS
 
- Run the Tailwind compiler in watch mode so styles rebuild automatically as you edit `input.css`:
 
```bash
npx tailwindcss -i ./input.css -o ./src/output.css --watch
```
 
### 5 — Open the app
 
- Open `index.html` directly in your browser or serve it with any static file server:
 

## Usage
 
1. **Search by city** — type a city name in the search box and press **Enter** or click **Search**.
2. **Use GPS** — click **Use Current Location** and accept the browser permission prompt.
3. **Switch units** — click **°C** or **°F** in the bottom-left panel to toggle today's temperature.
4. **Recent cities** — your last 8 searches appear in a dropdown when you focus the input. Click any city to reload its weather, or click **×** to remove it.
5. **Dismiss alerts** — the extreme-temperature banner closes on its own after 12 seconds, or immediately when you click **×**.
 
## API Reference
 
This project uses two OpenWeatherMap v2.5 endpoints:
 
- `/weather` | Current conditions for a city or coordinates |
- `/forecast` | 3-hourly forecast data for the next 5 days |
 
- Both endpoints are called with `units=metric` so all raw values are in °C and m/s.
 

## Browser Support
 
- It supports all the modern browsers.
 
## Known Limitations
 
- The free OpenWeatherMap tier allows 60 API calls per minute and 1,000,000 per month. Heavy usage may hit the rate limit (HTTP 429).
- The forecast always shows temperatures in °C regardless of the unit toggle. Only today's temperature switches between °C and °F, as specified in the project requirements.
- `localStorage` is used for the recent-cities list. Clearing browser storage will reset it.
 
## Implementation

- Code is thoroughly commented to explain the logic and implementation.
- GitHub Best Practices: This project is structured to support separate commits for HTML, CSS, JS and README to meet the evaluation requirements.
- Github Link: [https://github.com/PrashantK131/Weather-Forecast-Application]

## 👨‍💻 Author

[Prashant Kumar]