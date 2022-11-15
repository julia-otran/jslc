import { useCallback, useRef } from 'react';
import { Stack, Slider, Button, Typography } from '@mui/material';

import { useLocalConn } from '../../../EngineIntegration';

const MIN_BPM = 35;
const MAX_MS_PER_BEAT = (1 / MIN_BPM) * 60 * 1000;

const msToBpm = (ms: number) => 1 / (ms / (60 * 1000));
const bpmToMs = (bpm: number) => (1 / bpm) * 60 * 1000;

const getBPM = (times: number[]): number => {
  if (times.length <= 1) {
    return 0;
  }

  let bpmSum = 0;

  for (let i = 0; i < times.length - 1; i++) {
    const bpm = msToBpm(times[i + 1] - times[i]);
    const roundedBPM = Math.round(bpm * 2) / 2;
    bpmSum += roundedBPM;
  }

  const bpmAverage = bpmSum / (times.length - 1);
  const roundedBPM = Math.round(bpmAverage * 2) / 2;

  return bpmToMs(roundedBPM);
};

export interface BPMTapperProps {
  connectorKey: string;
  title?: string | undefined;
}

export const BPMTapper = ({
  connectorKey,
  title,
}: BPMTapperProps): JSX.Element => {
  const [value, setValue] = useLocalConn(connectorKey);
  const lastTapsRef = useRef<number[]>([]);

  const handleChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        setValue(newValue);
      }
    },
    [setValue]
  );

  const handleTap = useCallback(() => {
    const now = new Date().getTime();

    if (lastTapsRef.current.length === 0) {
      lastTapsRef.current.push(now);
    } else if (
      now - lastTapsRef.current[lastTapsRef.current.length - 1] <=
      MAX_MS_PER_BEAT
    ) {
      lastTapsRef.current.push(now);

      if (lastTapsRef.current.length > 8) {
        const [_, ...pluck] = lastTapsRef.current;
        lastTapsRef.current = pluck;
      }

      setValue(getBPM(lastTapsRef.current));
    } else {
      lastTapsRef.current = [now];
    }
  }, [lastTapsRef, setValue]);

  return (
    <Stack
      spacing={2}
      sx={{ height: '100%', width: '45px', alignItems: 'center' }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: '12px',
          height: '18px',
          whitespace: 'nowrap',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {title || ' '}
      </Typography>

      <Slider
        value={value ?? 0}
        disabled={value === undefined}
        onChange={handleChange}
        min={0}
        max={MAX_MS_PER_BEAT}
        step={1}
        sx={{
          '& input[type="range"]': {
            WebkitAppearance: 'slider-vertical',
          },
        }}
        orientation="vertical"
      />

      <Button onClick={handleTap}>TAP</Button>

      <Typography variant="body2" sx={{ fontSize: '12px', minHeight: '35px' }}>
        {(value || null) && (
          <>BPM: {Math.round(msToBpm(value ?? 0) * 100) / 100}</>
        )}

        {!value && <>MAX</>}
      </Typography>
    </Stack>
  );
};
