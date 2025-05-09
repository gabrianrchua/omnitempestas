/**
 * Which major weather source is used.
 */
export const WeatherSource = {
  TheWeatherChannel: 0,
  AccuWeather: 1,
  NationalWeatherService: 2,
} as const;

export type WeatherSourceType =
  (typeof WeatherSource)[keyof typeof WeatherSource];

export const WeatherSourceFriendlyString = {
  0: 'The Weather Channel',
  1: 'AccuWeather',
  2: 'National Weather Service',
};

/**
 * Short forecast status.
 */
export const SkyStatus = {
  Sunny: 0,
  Cloudy: 1,
  Rain: 2,
  Storm: 3,
} as const;

export type SkyStatusType = (typeof SkyStatus)[keyof typeof SkyStatus];

export const SkyStatusFriendlyString = {
  0: 'Sunny',
  1: 'Cloudy',
  2: 'Rain',
  3: 'Storm',
};
