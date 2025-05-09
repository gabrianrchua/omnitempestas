import { Box, Typography } from '@mui/material';
import type { WeatherEntry } from '../../types/interfaces';
import { TimeDisplay } from '../TimeDisplay';
import { SkyStatusDisplay } from '../SkyStatusDisplay';
import { RainDisplay } from '../RainDisplay';

export const WeatherDisplay = (props: {
  entry: WeatherEntry;
  size?: 'sm' | 'md' | 'lg';
}) => {
  // default: lg
  let temperatureVariant: 'h1' | 'body1' | 'h4' = 'h1';
  switch (props.size) {
    case 'sm':
      temperatureVariant = 'body1';
      break;
    case 'md':
      temperatureVariant = 'h4';
      break;
    case 'lg':
      temperatureVariant = 'h1';
      break;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
      }}
    >
      <Typography variant={temperatureVariant}>
        {props.entry.temperature}&deg;
      </Typography>
      <SkyStatusDisplay
        timeHours={props.entry.timeHours}
        skyStatus={props.entry.skyStatus}
      />
      <RainDisplay
        rainPercent={props.entry.rainPercent}
        rainAmount={props.entry.rainAmount}
      />
      <TimeDisplay
        hours={props.entry.timeHours}
        minutes={props.entry.timeMinutes}
      />
    </Box>
  );
};
