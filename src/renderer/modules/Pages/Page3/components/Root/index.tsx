import { Grid, Stack } from '@mui/material';

import { ValueFader } from '../../../../Components';

export const Page3 = (): JSX.Element => {
  return (
    <Stack sx={{ height: '100%' }}>
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
