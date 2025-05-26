import {
  Browser,
  BrowserContext,
  chromium,
  devices,
  Locator,
  Page,
} from 'playwright';

import {
  env,
  maxWeatherEntries,
  retryWaitTime,
  numRetries,
  twcUrl,
  accuUrl,
  nwsUrl,
} from './env';
import { NWSData, WeatherEntry } from '../types/interfaces';
import { SkyStatus, WeatherSource } from '../types/enums';
import axios from 'axios';
import { Log } from './log';

/**
 * Used to manage state of the Playwright browser instance
 */
export class BrowserManager {
  private static instance: BrowserManager | null = null;
  private browser: Browser | undefined = undefined;
  private context: BrowserContext | undefined = undefined;
  private page: Page | undefined = undefined;
  private isFetching: boolean = false;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Returns if a browser function is currently running. If not, it is safe to
   * start up another.
   */
  public getIsFetching(): boolean {
    return this.isFetching;
  }

  /**
   * Set if a browser call is currently running. Should only be set internally.
   */
  public setIsFetching(value: boolean) {
    this.isFetching = value;
  }

  /**
   * Checks if the browser is open and connected and that a page has been opened.
   * If not, launches the browser and opens a new page.
   */
  public async launchBrowser(): Promise<void> {
    if (this.isBrowserLoaded()) return;

    this.browser = await chromium.launch({ headless: env !== 'dev' });
    this.context = await this.browser.newContext(devices['Desktop Chrome']);
    await this.context.route(/(\.png$)|(\.jpg$)|(\.jpeg$)|(\.webp$)/, (route) =>
      route.abort()
    );
    this.page = await this.context.newPage();

    Log.info('Browser launched and page created');
  }

  /**
   * Returns if the browser is loaded and connected.
   */
  public isBrowserLoaded(): boolean {
    return (
      this.browser !== undefined &&
      this.browser.isConnected() &&
      this.context !== undefined &&
      this.page !== undefined
    );
  }

  /**
   * Gracefully clean up page, context, and browser on exit
   */
  public async cleanUpBrowser(): Promise<void> {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }

  /**
   * Get the currently open page, or undefined if the browser hasn't been
   * intialized yet.
   */
  public getPage(): Page | undefined {
    return this.page;
  }
}

/**
 * Fetch current weather data from The Weather Channel (weather.com), launching
 * browser if not already open.
 */
export const fetchTWCData = async (): Promise<WeatherEntry[]> => {
  Log.verbose('Fetching TWC data');

  if (!twcUrl) {
    Log.warning('TWC URL was not specified in environment variables; skipping');
    return [];
  }

  const manager = BrowserManager.getInstance();
  await manager.launchBrowser();
  const page = manager.getPage();

  if (!page) {
    throw new Error('Browser was launched but page was still undefined');
  }

  // helper function to convert TWC format from HH pm --> hours, minutes
  const convertTo24HourFormat = (time: string): [number, number] => {
    // Regular expression to match the time format "12 PM"
    const timeRegex = /^(\d{1,2})\s?(AM|PM)$/i;
    const match = time.match(timeRegex);

    if (!match) {
      throw new Error(`Invalid time format "${time}"`);
    }

    // Extract hours, minutes, and period from the matched groups
    let hours = parseInt(match[1], 10);
    const period = match[2].toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return [hours, 0];
  };

  // helper function to convert TWC written sky status to SkyStatus type
  const parseSkyStatus = (rawStatus: string): SkyStatus => {
    const lowerRawStatus = rawStatus.toLowerCase();

    if (lowerRawStatus.includes('storm')) {
      return SkyStatus.Storm;
    }

    if (lowerRawStatus.includes('rain') || lowerRawStatus.includes('shower')) {
      return SkyStatus.Rain;
    }

    if (lowerRawStatus.includes('cloud')) {
      return SkyStatus.Cloudy;
    }

    if (lowerRawStatus.includes('sun') || lowerRawStatus.includes('clear')) {
      return SkyStatus.Sunny;
    }

    throw new Error(`Could not parse sky status "${rawStatus}"`);
  };

  for (let attempt = 1; attempt <= numRetries; attempt++) {
    try {
      manager.setIsFetching(true);

      await page.goto(twcUrl);

      await page.waitForSelector('[data-testid=ExpandedDetailsCard-0]');

      Log.verbose('TWC page loaded');

      const cards: Locator[] = [...Array(maxWeatherEntries).keys()].map((x) => page
        .getByTestId(`ExpandedDetailsCard-${x}`));
      const entries: WeatherEntry[] = [];

      for (const card of cards) {
        // failsafe: do not continue past configured max weather entries
        if (entries.length >= maxWeatherEntries) {
          break;
        }

        await card.click();
        const rawTime = await (
          await card.getByTestId('daypartName').all()
        )[0].textContent();
        const temperature = await (
          await card.getByTestId('TemperatureValue').all()
        )[0].textContent();
        const rainPercent = await (await card.getByTestId('Precip').all())[0]
          .getByTestId('PercentageValue')
          .textContent();
        const rainAmount = await card
          .getByTestId('AccumulationValue')
          .textContent();
        const rawSkyStatus = await (
          await card.getByTestId('wxIcon').all()
        )[0].textContent();

        if (
          !rawTime ||
          !rainPercent ||
          !rainAmount ||
          !temperature ||
          !rawSkyStatus
        ) {
          continue;
        }

        const [hours, minutes] = convertTo24HourFormat(rawTime);

        entries.push({
          source: WeatherSource.TheWeatherChannel,
          timeHours: hours,
          timeMinutes: minutes,
          rainPercent: parseFloat(rainPercent.replaceAll('%', '')),
          rainAmount: parseFloat(rainAmount.replaceAll(' in', '')),
          temperature: parseFloat(temperature.replaceAll('°', '')),
          skyStatus: parseSkyStatus(rawSkyStatus),
        });
      }

      Log.verbose(`Fetched ${entries.length} entries from TWS`);

      return entries;
    } catch (error) {
      if (attempt < numRetries) {
        // retry with wait time
        Log.warning(`Attempt ${attempt}/${numRetries} failed:`, error);
        Log.warning(`Waiting ${retryWaitTime / 60000} minutes before retrying`);
        await new Promise((resolve) => setTimeout(resolve, retryWaitTime));
        Log.info('Retrying browser call');
      } else {
        Log.error(`Final attempt ${attempt}/${numRetries} failed:`, error);
        throw error;
      }
    } finally {
      manager.setIsFetching(false);
    }
  }

  // this should not happen
  Log.error('fetchTWCData reached the end but should not have!');
  return [];
};

/**
 * Fetch current weather data from AccuWeather (accuweather.com), launching
 * browser if not already open.
 */
export const fetchAccuData = async (): Promise<WeatherEntry[]> => {
  Log.verbose('Fetching Accu data');

  if (!accuUrl) {
    Log.warning(
      'Accu URL was not specified in environment variables; skipping'
    );
    return [];
  }

  const manager = BrowserManager.getInstance();
  await manager.launchBrowser();
  const page = manager.getPage();

  if (!page) {
    throw new Error('Browser was launched but page was still undefined');
  }

  // helper function to convert AccuWeather format from HH PM --> hours, minutes
  const convertTo24HourFormat = (time: string): [number, number] => {
    // Regular expression to match the time format "12 PM"
    const timeRegex = /^(\d{1,2})\s?(AM|PM)$/i;
    const match = time.match(timeRegex);

    if (!match) {
      throw new Error(`Invalid time format "${time}"`);
    }

    // Extract hours, minutes, and period from the matched groups
    let hours = parseInt(match[1], 10);
    const period = match[2].toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return [hours, 0];
  };

  // helper function to convert AccuWeather written sky status to SkyStatus type
  const parseSkyStatus = (rawStatus: string): SkyStatus => {
    const lowerRawStatus = rawStatus.toLowerCase();

    if (lowerRawStatus.includes('storm')) {
      return SkyStatus.Storm;
    }

    if (lowerRawStatus.includes('rain') || lowerRawStatus.includes('shower')) {
      return SkyStatus.Rain;
    }

    if (lowerRawStatus.includes('cloud')) {
      return SkyStatus.Cloudy;
    }

    if (lowerRawStatus.includes('sun') || lowerRawStatus.includes('clear')) {
      return SkyStatus.Sunny;
    }

    throw new Error(`Could not parse sky status "${rawStatus}"`);
  };

  // helper function for accuweather since it requires 2 page loads
  const getAccuData = async (url: string): Promise<WeatherEntry[]> => {
    if (!page) {
      throw new Error('Browser was launched but page was still undefined');
    }

    await page.goto(url);

    await page.waitForSelector('div.hourly-detailed-card-header');

    Log.verbose('Accu page loaded');

    const entries: WeatherEntry[] = [];
    const cards: Locator[] = await page
      .locator('div.accordion-item.hour')
      .all();

    let isFirstCard: boolean = true;
    for (const card of cards) {
      // get header and click to expand
      const header = card.locator('div.hourly-detailed-card-header');
      
      // first card does not need to be clicked to expand
      if (!isFirstCard) {
        await header.click();
      } else {
        isFirstCard = false;
      }

      const details = card.locator('div.hourly-detailed-card-content');

      const rawTime = await header.locator('h2.date > div').textContent();
      const rawRainPercent = await header.locator('div.precip').textContent();
      if (!rawRainPercent) {
        continue;
      }
      const rainPercent = parseFloat(rawRainPercent.replaceAll('%', ''));
      let rainAmount: string = '0 in';
      if (rainPercent >= 50) {
        try {
          rainAmount = await details
                .locator('div.hourly-content-container > div > p')
                .getByText('Rain')
                .textContent() ?? '0 in';
        } catch (_) {
          // continue anyway; rain amount not displayed despite being >= 50%
        }
      }
      const temperature = await header.locator('div.temp').textContent();
      const rawSkyStatus = await header.locator('div.phrase').textContent();

      if (!rawTime || !rainAmount || !temperature || !rawSkyStatus) {
        continue;
      }

      const [hours, minutes] = convertTo24HourFormat(rawTime);

      entries.push({
        source: WeatherSource.AccuWeather,
        timeHours: hours,
        timeMinutes: minutes,
        rainPercent: rainPercent,
        rainAmount: parseFloat(rainAmount.replaceAll(' in', '')),
        temperature: parseFloat(temperature.replaceAll('°', '')),
        skyStatus: parseSkyStatus(rawSkyStatus),
      });
    }
    return entries;
  };

  for (let attempt = 1; attempt <= numRetries; attempt++) {
    try {
      manager.setIsFetching(true);

      const entries: WeatherEntry[] = (await getAccuData(accuUrl))
        .concat(await getAccuData(`${accuUrl}?day=2`))
        .slice(0, maxWeatherEntries);

      Log.verbose(`Fetched ${entries.length} entries from Accu`);

      return entries;
    } catch (error) {
      if (attempt < numRetries) {
        // retry with wait time
        Log.warning(`Attempt ${attempt}/${numRetries} failed:`, error);
        Log.warning(`Waiting ${retryWaitTime / 60000} minutes before retrying`);
        await new Promise((resolve) => setTimeout(resolve, retryWaitTime));
        Log.info('Retrying browser call');
      } else {
        Log.error(`Final attempt ${attempt}/${numRetries} failed:`, error);
        throw error;
      }
    } finally {
      manager.setIsFetching(false);
    }
  }

  // this should not happen
  Log.error('fetchAccuData reached the end but should not have!');
  return [];
};

/**
 * Fetch current weather data from National Weather Service (weather.gov)
 * using an API call.
 *
 * Note: NWS does not provide the precipitation forecast per hour! Ignore
 * `rainAmount` field in any aggregates; this is always set to `-1`
 */
export const fetchNWSData = async (): Promise<WeatherEntry[]> => {
  Log.verbose('Fetching NWS data');

  if (!nwsUrl) {
    Log.warning('NWS URL was not specified in environment variables; skipping');
    return [];
  }

  const manager = BrowserManager.getInstance();

  // helper function to convert NWS written short forecast to SkyStatus type
  const parseSkyStatus = (rawStatus: string): SkyStatus => {
    const lowerRawStatus = rawStatus.toLowerCase();

    if (lowerRawStatus.includes('storm')) {
      return SkyStatus.Storm;
    }

    if (lowerRawStatus.includes('rain') || lowerRawStatus.includes('shower')) {
      return SkyStatus.Rain;
    }

    if (lowerRawStatus.includes('cloud')) {
      return SkyStatus.Cloudy;
    }

    if (lowerRawStatus.includes('sun') || lowerRawStatus.includes('clear')) {
      return SkyStatus.Sunny;
    }

    throw new Error(`Could not parse sky status "${rawStatus}"`);
  };

  for (let attempt = 1; attempt <= numRetries; attempt++) {
    try {
      manager.setIsFetching(true);

      const response = await axios.get(nwsUrl);
      const nwsData: NWSData = response.data;

      Log.verbose('NWS API call complete');

      const entries: WeatherEntry[] = [];

      for (const period of nwsData.properties.periods) {
        if (entries.length >= maxWeatherEntries) {
          break;
        }

        const time: Date = new Date(period.startTime);

        entries.push({
          source: WeatherSource.NationalWeatherService,
          timeHours: time.getHours(),
          timeMinutes: time.getMinutes(),
          rainPercent: period.probabilityOfPrecipitation.value,
          rainAmount: -1, // NWS does not provide this
          temperature: period.temperature,
          skyStatus: parseSkyStatus(period.shortForecast),
        });
      }

      Log.verbose(`Fetched ${entries.length} entries from NWS`);

      return entries;
    } catch (error) {
      // retry with wait time
      Log.warning(`Attempt ${attempt}/${numRetries} failed:`, error);
      Log.warning(`Waiting ${retryWaitTime / 60000} minutes before retrying`);
      await new Promise((resolve) => setTimeout(resolve, retryWaitTime));
      Log.info('Retrying API call');
    } finally {
      manager.setIsFetching(false);
    }
  }

  // this should not happen
  Log.error('fetchNWSData reached the end but should not have!');
  return [];
};

/**
 * Gracefully clean up page, context, and browser on exit
 */
export const cleanUpBrowser = async () => {
  const manager = BrowserManager.getInstance();
  await manager.cleanUpBrowser();
};

/**
 * Fetch data from all available weather sources.
 */
export const fetchAllData = async (): Promise<WeatherEntry[]> => {
  const entries: WeatherEntry[] = (await fetchTWCData())
    .concat(await fetchAccuData())
    .concat(await fetchNWSData());

  return entries;
};
