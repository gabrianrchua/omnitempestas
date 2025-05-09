import axios from 'axios';
import type { WeatherReport } from '../types/interfaces';

const API_BASE_URL =
  import.meta.env.VITE_ENV === 'prod' ? '' : 'http://localhost:3000';

export const NetworkService = {
  getWeather: async (): Promise<WeatherReport> => {
    const response = await axios.get(API_BASE_URL + '/api/weather');
    // timestamp comes in as string, must turn into Date object
    response.data.timestamp = new Date(response.data.timestamp);
    return response.data;
  },
};
