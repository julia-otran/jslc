import { Navigate } from 'react-router-dom';

import { ROUTER_PATHS } from '../../Router';
import { useIsIOConfigured } from '../../IOSetup';

const Root = (): JSX.Element => {
  const isIOConfigured = useIsIOConfigured();

  return (
    <>
      {isIOConfigured && <Navigate to={ROUTER_PATHS.CTRL_ROOT} />}
      {!isIOConfigured && <Navigate to={ROUTER_PATHS.IO_SETUP} />}
    </>
  );
};

export default Root;
