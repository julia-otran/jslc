import { Grid } from '@mui/material';

import { ValueFader } from '../../../../Components';

export const Page1 = (): JSX.Element => {
  return (
    <Grid
      container
      spacing={2}
      sx={{ width: '100%', flex: 1, padding: '24px' }}
    >
      <Grid item>
        <ValueFader connectorKey="par-led-dimmer-1" />
      </Grid>

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
  );
};
