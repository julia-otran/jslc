import { useCallback } from 'react';
import { Stack, Slider, Typography } from '@mui/material';

import { useLocalConn } from '../../../EngineIntegration';

export interface ValueFaderProps {
  connectorKey: string;
}

export const ValueFader = ({ connectorKey }: ValueFaderProps): JSX.Element => {
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
