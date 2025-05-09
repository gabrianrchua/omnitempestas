import {
  Cloud,
  HelpCenter,
  ModeNight,
  Sunny,
  Thunderstorm,
  WaterDrop,
} from '@mui/icons-material';
import {
  SkyStatus,
  SkyStatusFriendlyString,
  type SkyStatusType,
} from '../../types/enums';
import type { JSX } from 'react';
import { Box, Typography } from '@mui/material';

export const SkyStatusDisplay = (props: {
  timeHours: number;
  skyStatus: SkyStatusType;
}) => {
  // default case: unknown weather (should not happen)
  let icon: JSX.Element = <HelpCenter />;
  let text: string = SkyStatusFriendlyString[props.skyStatus];

  if (props.skyStatus === SkyStatus.Cloudy) {
    icon = <Cloud />;
  }
  if (props.skyStatus === SkyStatus.Rain) {
    icon = <WaterDrop />;
  }
  if (props.skyStatus === SkyStatus.Storm) {
    icon = <Thunderstorm />;
  }
  if (props.skyStatus === SkyStatus.Sunny) {
    if (props.timeHours <= 7 || props.timeHours >= 20) {
      // special case: on night and sunny, instead show clear sky
      icon = <ModeNight />;
      text = 'Clear';
    } else {
      icon = <Sunny />;
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
      {icon}
      <Typography variant='body1'>{text}</Typography>
    </Box>
  );
};
