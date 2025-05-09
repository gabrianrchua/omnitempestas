import { Typography } from '@mui/material'

export const TimeDisplay = (props: {hours: number, minutes: number}) => {
  const hours = props.hours % 12 || 12;
  const ampm = props.hours >= 12 ? 'pm' : 'am';
  return (
    <Typography variant="body1">
      {hours}:{props.minutes.toString().padStart(2, '0')} {ampm}
    </Typography>
  )
}