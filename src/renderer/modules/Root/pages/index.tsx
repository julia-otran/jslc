import { Navigate } from 'react-router-dom';
import { CircularProgress, Stack } from '@mui/material';

import { ROUTER_PATHS } from '../../Router';
import { useIsIOConfigured } from '../../IOSetup';

const Root = (): JSX.Element => {
  const isIOConfigured = useIsIOConfigured();

  return (
    <>
      {isIOConfigured === true && <Navigate to={ROUTER_PATHS.CTRL_ROOT} />}
      {isIOConfigured === false && <Navigate to={ROUTER_PATHS.IO_SETUP} />}
      {isIOConfigured === undefined && (
        <Stack
          sx={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Stack>
      )}
    </>
  );
};

export default Root;
