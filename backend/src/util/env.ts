import { LogVerbosityLevel } from '../types/enums';

/**
 * Port number to run the app.
 *
 * Default: `3000`
 */
export const port: number = parseInt(process.env.PORT || '3000');

/**
 * Indicates if the app is running in development mode (proxy calls to `/*` to
 * development frontend server and show browser instance) or production mode
 * (serve built files in `dist/` and run browser in headless mode)
 *
 * Default: `dev`
 */
export const env: 'prod' | 'dev' = process.env.ENV === 'prod' ? 'prod' : 'dev';

/**
 * Port of the development frontend server. Only used when `env` is `dev`.
 *
 * Default: `5173`
 */
export const frontendPort: number = parseInt(
  process.env.FRONTEND_PORT || '5173'
);

/**
 * The max number of weather entries into the future to gather. Approximately
 * equals how many hours in the future to get. Too high and Playwright calls
 * may fail.
 *
 * Default: `24`
 */
export const maxWeatherEntries: number = parseInt(
  process.env.MAX_WEATHER_ENTRIES || '24'
);

/**
 * Helper function to parse verbosity level into `LogVerbosityLevel`
 */
const parseLogVerbosity = (
  verbosity: string | undefined
): LogVerbosityLevel => {
  if (!verbosity) return LogVerbosityLevel.Info;

  const lowerVerbosity = verbosity.toLowerCase().trim();

  switch (lowerVerbosity) {
    case 'verbose':
      return LogVerbosityLevel.Verbose;
    case 'info':
      return LogVerbosityLevel.Info;
    case 'warning':
      return LogVerbosityLevel.Warning;
    case 'error':
      return LogVerbosityLevel.Error;
    default:
      return LogVerbosityLevel.Info;
  }
};

/**
 * Indicates the maximum verbosity level of logs that should be printed to
 * stdout.
 *
 * Allowed values: `'verbose'`, `'info'`, `'warning'`, `'error'`
 *
 * Default: `LogVerbosityLevel.Info`
 */
export const logVerbosity: LogVerbosityLevel = parseLogVerbosity(
  process.env.LOG_VERBOSITY
);

/**
 * Total number of attempts to do if a browser function fails.
 *
 * Default: `3`
 */
export const numRetries: number = parseInt(process.env.NUM_RETRIES ?? '3');

/**
 * How long to wait between browser retries, in ms.
 *
 * Default: `300000`
 */
export const retryWaitTime: number = parseInt(
  process.env.RETRY_WAIT_TIME ?? '300000'
);

/**
 * REQUIRED: Playwright URL for hourly forcast of The Weather Channel to scrape.
 * In the format `https://weather.com/weather/hourbyhour/l/<long string>`
 *
 * Find your local TWC hourly forecast by going to weather.com, navigating to
 * your local weather location, then selecting "Hourly" on the navbar.
 *
 * If this is not specified, weather data will not be fetched from The Weather
 * Channel.
 *
 * Default: `''`
 */
export const twcUrl: string = process.env.TWC_URL ?? '';

/**
 * REQUIRED: Playwright URL for hourly forcast of AccuWeather to scrape.
 * In the format `https://www.accuweather.com/en/us/<locale>/<zip code>/hourly-weather-forecast/<some number>`
 *
 * Find your local AccuWeather hourly forecast by going to acucweather.com,
 * navigating to your local weather location, then selecting "Hourly" on the
 * navbar.
 *
 * If this is not specified, weather data will not be fetched from AccuWeather.
 *
 * Default: `''`
 */
export const accuUrl: string = process.env.ACCU_URL ?? '';

/**
 * REQUIRED: Axios URL for hourly forcast of National Weather Service to fetch.
 * In the format `https://api.weather.gov/gridpoints/<forecast office code>/<number>,<number>/forecast/hourly`
 *
 * Find your local NWS hourly forecast by getting your location's latitude and
 * longitude; usually to two decimal points is plenty. Then, go to
 * `api.weather.gov/points/{lat},{lon}` and in the resulting JSON response, find
 * `properties.forecastHourly`. That URL will be what we need.
 *
 * If this is not specified, weather data will not be fetched from the National
 * Weather Service.
 *
 * Default: `''`
 */
export const nwsUrl: string = process.env.NWS_URL ?? '';
