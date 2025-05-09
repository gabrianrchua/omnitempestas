import { Box, Skeleton } from '@mui/material';

export const PageSkeleton = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
        }}
      >
        <Skeleton variant='text' width={200} />
        <Skeleton variant='circular' width={24} height={24} />
      </Box>
      <Skeleton variant='text' width={150} />
      <Skeleton variant='rounded' width={200} height={230} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          overflowX: 'auto',
        }}
      >
        {Array.from({ length: 15 }, (_, i) => i + 1).map((index) => (
          <Skeleton variant='rounded' width={100} height={160} key={index} />
        ))}
      </Box>
    </Box>
  );
};
