import { Button, Slider, Stack, Typography } from '@mui/material';
import {
  MAX_MS_PER_BEAT,
  createBPMTapper,
  msToBpm,
} from '../../../../../engine-types';
import { useCallback, useRef } from 'react';

import { useLocalConn } from '../../../EngineIntegration';

export interface BPMTapperProps {
  connectorKey: string;
  title?: string;
}

export const BPMTapper = ({
  connectorKey,
  title = undefined,
}: BPMTapperProps): JSX.Element => {
  const [value, setValue] = useLocalConn(connectorKey);
  const bpmTapRef = useRef(createBPMTapper());

  const handleChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        setValue(newValue);
      }
    },
    [setValue]
  );

  const handleTap = useCallback(() => {
    const result = bpmTapRef.current.onTap();

    if (result !== undefined) {
      setValue(result);
    }
  }, [bpmTapRef, setValue]);

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
