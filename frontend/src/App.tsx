import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SvgIcon,
  Toolbar,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import './App.css';
import { WeatherDisplay } from './components/WeatherDisplay';
import type { WeatherEntry, WeatherReport } from './types/interfaces';
import {
  WeatherSource,
  type WeatherSourceType,
  type SkyStatusType,
  WeatherSourceFriendlyString,
} from './types/enums';
import { WeatherCarousel } from './components/WeatherCarousel';
import { useEffect, useRef, useState } from 'react';
import { PageSkeleton } from './components/PageSkeleton';
import { Error, Refresh } from '@mui/icons-material';
import { TimeDisplay } from './components/TimeDisplay';
import { NetworkService } from './util/NetworkService';
import OmnitempestasIcon from './assets/omnitempestas.svg?react';

const App = () => {
  const [rawReport, setRawReport] = useState<WeatherReport | undefined>(
    undefined
  );
  const [filteredReport, setFilteredReport] = useState<
    WeatherReport | undefined
  >(undefined);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const availableSources: WeatherSourceType[] = Object.values(WeatherSource);
  const [selectedSources, setSelectedSources] =
    useState<WeatherSourceType[]>(availableSources);
  const timeoutRef = useRef<number>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  useEffect(() => {
    if (!rawReport) return;
    const filtered = { ...rawReport };
    filtered.entries = aggregateWeatherData(filtered.entries);
    setFilteredReport(filtered);
  }, [selectedSources]);

  const fetchWeatherData = async () => {
    setRawReport(undefined);
    setFilteredReport(undefined);
    try {
      const report: WeatherReport = await NetworkService.getWeather();
      // if timestamp is the same, the report hasn't finished updating; wait
      // another 5 minutes
      if (report.timestamp === rawReport?.timestamp) {
        scheduleNextFetch(new Date(new Date().getTime() - 60 * 60 * 1000));
        return;
      }
      setRawReport(report);
      const filtered = { ...report };
      filtered.entries = aggregateWeatherData(report.entries);
      setFilteredReport(filtered);
      scheduleNextFetch(report.timestamp);
    } catch (error) {
      setIsErrorDialogOpen(true);
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        setErrorText(
          `There was a problem fetching the weather data: "${error.code}: ${error.message}". Please try again in a few minutes.`
        );
      } else {
        setErrorText(
          'There was an unknown problem fetching the weather data, see the console for more details. Please try again in a few minutes.'
        );
      }
      console.error('Failed to fetch weather data:', error);
    }
  };

  const aggregateWeatherData = (entries: WeatherEntry[]): WeatherEntry[] => {
    // filter to remove unwanted sources and duplicate time values
    const seenKeys: Set<string> = new Set<string>();
    const originalEntries: WeatherEntry[] = entries
      .filter((entry) => selectedSources.includes(entry.source))
      .filter((entry) => {
        const key = `${entry.timeHours}:${entry.timeMinutes}:${entry.source}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          return true;
        }
        return false;
      });

    const finalEntries: WeatherEntry[] = [];

    while (originalEntries.length) {
      const searchItem: WeatherEntry = originalEntries[0];

      let rainPercentSum: number = searchItem.rainPercent;
      let rainPercentCount: number = searchItem.rainPercent !== -1 ? 1 : 0;

      let rainAmountSum: number = searchItem.rainAmount;
      let rainAmountCount: number = searchItem.rainAmount !== -1 ? 1 : 0;

      let temperatureSum: number = searchItem.temperature;
      let temperatureCount: number = searchItem.temperature !== -1 ? 1 : 0;

      let skyStatusSum: number = searchItem.skyStatus;
      let skyStatusCount: number = 1;

      originalEntries.splice(0, 1);
      let index = originalEntries.findIndex(
        (item) =>
          searchItem.timeHours === item.timeHours &&
          searchItem.timeMinutes === item.timeMinutes
      );
      while (index !== -1) {
        const foundItem: WeatherEntry = originalEntries[index];

        if (foundItem.rainPercent !== -1) {
          rainPercentSum += foundItem.rainPercent;
          rainPercentCount++;
        }
        if (foundItem.rainAmount !== -1) {
          rainAmountSum += foundItem.rainAmount;
          rainAmountCount++;
        }
        if (foundItem.temperature !== -1) {
          temperatureSum += foundItem.temperature;
          temperatureCount++;
        }
        skyStatusSum += foundItem.skyStatus;
        skyStatusCount++;

        originalEntries.splice(index, 1);
        index = originalEntries.findIndex(
          (item) =>
            searchItem.timeHours === item.timeHours &&
            searchItem.timeMinutes === item.timeMinutes
        );
      }

      finalEntries.push({
        source: WeatherSource.TheWeatherChannel, // this field does not matter anymore
        timeHours: searchItem.timeHours,
        timeMinutes: searchItem.timeMinutes,
        rainPercent: Math.round(rainPercentSum / rainPercentCount),
        rainAmount: Math.round(rainAmountSum / rainAmountCount),
        temperature: Math.round(temperatureSum / temperatureCount),
        skyStatus: Math.round(skyStatusSum / skyStatusCount) as SkyStatusType,
      });
    }

    return finalEntries;
  };

  const scheduleNextFetch = (timestamp: Date) => {
    // clear any old timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 65 minutes past last fetch
    const nextFetchTime = new Date(timestamp.getTime() + 65 * 60 * 1000);
    const delay = nextFetchTime.getTime() - new Date().getTime();

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        fetchWeatherData();
      }, delay);
    } else {
      // if the delay is negative or zero, fetch immediately
      fetchWeatherData();
    }
  };

  return (
    <>
      <Dialog open={isErrorDialogOpen}>
        <DialogTitle>Failed to fetch weather data</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'row', gap: '12px' }}
        >
          <Error color='error' />
          <Typography variant='body1'>{errorText}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setErrorText('');
              setIsErrorDialogOpen(false);
              fetchWeatherData();
            }}
          >
            <Refresh />
            Reload
          </Button>
        </DialogActions>
      </Dialog>
      {filteredReport ? (
        <>
          <AppBar position='static'>
            <Toolbar sx={{ gap: '12px' }}>
              <SvgIcon component={OmnitempestasIcon} inheritViewBox />
              <Typography variant='h6' sx={{ flexGrow: 1 }}>
                omnitempestas
              </Typography>
              <Box>
                <FormControl variant='outlined' sx={{ minWidth: '200px' }}>
                  <InputLabel>Weather Sources</InputLabel>
                  <Select
                    multiple
                    input={<OutlinedInput label='Weather Sources' />}
                    value={selectedSources.map((source) => String(source))}
                    onChange={(event: SelectChangeEvent<string[]>) => {
                      const {
                        target: { value },
                      } = event;
                      setSelectedSources(
                        // On autofill we get a stringified value.
                        typeof value === 'string'
                          ? value
                              .split(',')
                              .map(
                                (item) => parseInt(item) as WeatherSourceType
                              )
                          : value.map(
                              (item) => parseInt(item) as WeatherSourceType
                            )
                      );
                    }}
                    renderValue={(selected: string[]) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value: string) => (
                          <Chip
                            key={value}
                            label={
                              WeatherSourceFriendlyString[
                                parseInt(value) as WeatherSourceType
                              ]
                            }
                          />
                        ))}
                      </Box>
                    )}
                    size='small'
                  >
                    {availableSources.map((source: WeatherSourceType) => (
                      <MenuItem key={source} value={String(source)}>
                        <Checkbox checked={selectedSources.includes(source)} />
                        <ListItemText
                          primary={WeatherSourceFriendlyString[source]}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <Typography variant='body1'>Last updated&nbsp;</Typography>
                  <TimeDisplay
                    hours={filteredReport.timestamp.getHours()}
                    minutes={filteredReport.timestamp.getMinutes()}
                  />
                </Box>
                <IconButton onClick={fetchWeatherData}>
                  <Refresh />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ margin: '8px' }}>
            {filteredReport.entries.length ? (
              <>
                <WeatherDisplay
                  entry={filteredReport.entries[0]}
                  highTemperature={Math.max(
                    ...filteredReport.entries.map((entry) => entry.temperature)
                  )}
                  lowTemperature={Math.min(
                    ...filteredReport.entries.map((entry) => entry.temperature)
                  )}
                />
                <WeatherCarousel entries={filteredReport.entries} />
              </>
            ) : (
              <Box
                sx={{ width: '100%', textAlign: 'center', marginTop: '20vh' }}
              >
                <Typography>No weather entries to show</Typography>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <PageSkeleton />
      )}
    </>
  );
};

export default App;
