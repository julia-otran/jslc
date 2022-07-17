import { useMemo } from 'react';
import { Grid, Stack, Typography } from '@mui/material';

import { useDevices } from '../../../EngineIntegration';
import { ValueView } from '../../../Components';

const IndexRoot = (): JSX.Element => {
  const devices = useDevices();
  const channels = useMemo(
    () =>
      Array(512)
        .fill(0)
        .map((_, i) => i + 1),
    []
  );

  console.log('Render index root', devices);

  return (
    <Stack spacing={2}>
      {devices.map((device) => (
        <>
          <Typography mt={1}>Device: {device}</Typography>

          <Grid
            container
            spacing={2}
            key={`device-${device}`}
            sx={{ width: '100%' }}
          >
            {channels.map((channel) => (
              <Grid item sx={{ width: '6.25%' }}>
                <ValueView
                  key={`dev-${device}-ch-${channel}`}
                  device={device}
                  channel={channel}
                />
              </Grid>
            ))}
          </Grid>
        </>
      ))}
    </Stack>
  );
};

export default IndexRoot;
