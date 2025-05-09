import { Box } from '@mui/material';
import type { WeatherEntry } from '../../types/interfaces';
import { WeatherDisplay } from '../WeatherDisplay';

export const WeatherCarousel = (props: { entries: WeatherEntry[] }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto' }}>
      {props.entries.map((entry, index) => (
        <WeatherDisplay key={index} size='md' entry={entry} />
      ))}
    </Box>
  );
};
