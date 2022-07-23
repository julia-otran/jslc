import { Grid, Stack } from '@mui/material';

import { ValueFader } from '../../../../Components';

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
          <ValueFader connectorKey="par-led-velocity" title="Velocity" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-red-only" title="R/O" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-blue-only" title="B/O" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-colored-weight" title="Color W" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="par-led-colored-velocity" title="Color V" />
        </Grid>
      </Grid>

      <Grid
        container
        spacing={2}
        sx={{ width: '100%', flex: 1, padding: '24px' }}
      >
        <Grid item>
          <ValueFader connectorKey="laser-1" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-2" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-3" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-4" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-5" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-6" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-7" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-8" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-9" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-10" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-11" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-12" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-13" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-14" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-15" />
        </Grid>
        <Grid item>
          <ValueFader connectorKey="laser-16" />
        </Grid>
      </Grid>
    </Stack>
  );
};
