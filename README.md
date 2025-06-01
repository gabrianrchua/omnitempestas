# omnitempestas

WIP: Multi source hourly weather aggregator using Playwright, TypeScript, and React.

## Dev Setup

1. Clone this repository

2. Install node modules

```
cd frontend
npm install
cd ../backend
npm install
```

3. Install Playwright Chromium browser

`npx playwright install chromium`

4. Set up environment variables

See [supported environment variables](#env).

Also see `/backend/src/util/env.ts` for full details.

5. Run backend

Backend runs on port 3000 by default.

`npm run dev`

6. Run frontend

Frontend runs on port 5173 by defualt.

`npm run dev`

7. Open frontend at `http://localhost:5173`

<a name="env"></a>

## Environment Variables

### Backend

`TWC_URL` - **REQUIRED**: Playwright URL for hourly forcast of The Weather Channel to scrape. In the format `https://weather.com/weather/hourbyhour/l/<long string>`

- Find your local TWC hourly forecast by going to weather.com, navigating to your local weather location, then selecting "Hourly" on the navbar. If this is not specified, weather data will not be fetched from The Weather Channel.

`ACCU_URL` - **REQUIRED**: Playwright URL for hourly forcast of AccuWeather to scrape. In the format `https://www.accuweather.com/en/us/<locale>/<zip code>/hourly-weather-forecast/<some number>`

- Find your local AccuWeather hourly forecast by going to acucweather.com, navigating to your local weather location, then selecting "Hourly" on the navbar. If this is not specified, weather data will not be fetched from AccuWeather.

`NWS_URL` - **REQUIRED**: Axios URL for hourly forcast of National Weather Service to fetch. In the format `https://api.weather.gov/gridpoints/<forecast office code>/<number>,<number>/forecast/hourly`

- Find your local NWS hourly forecast by getting your location's latitude and longitude; usually to two decimal points is plenty. Then, go to `api.weather.gov/points/{lat},{lon}` and in the resulting JSON response, find `properties.forecastHourly`. That URL will be what we need. If this is not specified, weather data will not be fetched from the National Weather Service.

`PORT=3000` - Port number to run the app.

`ENV=dev` - Indicates if the app is running in development mode (proxy calls to `/*` to development frontend server and show browser instance) or production mode (serve built files in `dist/` and run browser in headless mode)

`FRONTEND_PORT=5173` - Port of the development frontend server. Only used when `env` is `dev`. Not required if you navigate directly to the frontend in the browser; only needed if you wish to use the proxy built into the dev server.

`MAX_WEATHER_ENTRIES=24` - The max number of weather entries into the future to gather. Approximately equals how many hours in the future to get. Too high and Playwright routines may fail.

`LOG_VERBOSITY=info` - Indicates the maximum verbosity level of logs that should be printed to stdout.

- Allowed values: `'verbose'`, `'info'`, `'warning'`, `'error'`

`NUM_RETRIES=3` - Total number of attempts to do if a browser function fails.

`RETRY_WAIT_TIME=300000` - How long to wait between browser retries, in ms.

### Frontend

`VITE_ENV=dev`. Affects API base URL - `dev` will use `localhost:3000` while `prod` will retain the same hostname.

## Build Docker Image

```
docker build -t omnitempestas:1.0.0 .
```

## Run in Prod Mode Docker Container

```
docker run -e PORT=8080:8080 -p 8080:8080 -e TWC_URL=<url> -e ACCU_URL=<url> -e NWS_URL=<url> -e LOG_VERBOSITY=verbose omnitempestas:1.0.0
```
