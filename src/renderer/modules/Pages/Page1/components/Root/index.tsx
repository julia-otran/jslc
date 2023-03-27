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
      </Grid>
    </Stack>
  );
};
