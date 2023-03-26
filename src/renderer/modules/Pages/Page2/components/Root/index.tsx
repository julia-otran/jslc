import { BPMTapper, ValueFader } from '../../../../Components';
import { Grid, Stack } from '@mui/material';

export const Page2 = (): JSX.Element => {
  return (
    <Stack sx={{ height: '100%' }}>
      <Grid
        container
        spacing={2}
        sx={{ width: '100%', flex: 1, padding: '24px' }}
      >
        <Grid item>
          <ValueFader connectorKey="par-led-dimmer" title="Dimm" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-strobe" title="Strb" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-red-only" title="R/O" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-blue-only" title="B/O" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-colored-weight" title="Colored" />
        </Grid>
        <Grid item>
          <BPMTapper connectorKey="par-led-colored-velocity" title="Col BPM" />
        </Grid>
        <Grid item>
          <BPMTapper connectorKey="par-led-colored-fade" title="Col Fade" />
        </Grid>
      </Grid>
    </Stack>
  );
};
