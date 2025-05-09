import { Typography, Box } from '@mui/material';

export const RainDisplay = (props: {
  rainPercent: number;
  rainAmount: number;
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant='body1'>{props.rainPercent}%</Typography>
      <Typography variant='body1'>{props.rainAmount} in</Typography>
    </Box>
  );
};
