import { Grid, Stack } from '@mui/material';

import { ValueFader, BPMTapper } from '../../../../Components';

export const Page1 = (): JSX.Element => {
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
          <ValueFader connectorKey="par-led-red" title="R" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-green" title="G" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-blue" title="B" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-white" title="W" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-ambar" title="A" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-uv" title="UV" />
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

      <Grid
        container
        spacing={2}
        sx={{ width: '100%', flex: 1, padding: '24px' }}
      >
        <Grid item>
          <ValueFader connectorKey="laser-1" title="Mode" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-2" title="Shape" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-3" title="Size" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-4" title="Rotate" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-5" title="L/R" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-6" title="Up/Dw" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-7" title="Sc Hor" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-8" title="Sc Vert" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-9" title="Color" />
        </Grid>
      </Grid>
    </Stack>
  );
};
