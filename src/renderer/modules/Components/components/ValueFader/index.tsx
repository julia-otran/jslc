import { useCallback } from 'react';
import { Stack, Slider, Typography } from '@mui/material';

import { useLocalConn } from '../../../EngineIntegration';

export interface ValueFaderProps {
  connectorKey: string;
  title?: string | undefined;
}

export const ValueFader = ({
  connectorKey,
  title,
}: ValueFaderProps): JSX.Element => {
  const [value, setValue] = useLocalConn(connectorKey);

  const handleChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        setValue(newValue);
      }
    },
    [setValue]
  );

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
        }}
      >
        {title || ' '}
      </Typography>

      <Slider
        value={value ?? 0}
        disabled={value === undefined}
        onChange={handleChange}
        min={0}
        max={255}
        step={1}
        sx={{
          '& input[type="range"]': {
            WebkitAppearance: 'slider-vertical',
          },
        }}
        orientation="vertical"
      />

      <Typography variant="body2" sx={{ fontSize: '12px' }}>
        Val: {value ?? ''}
      </Typography>
    </Stack>
  );
};
