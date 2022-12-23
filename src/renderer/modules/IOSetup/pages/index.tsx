import { useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import { useNavigate, useLocation, To } from 'react-router-dom';

import { useIOSetup } from '../hooks';
import { IOStateInfo } from '../../EngineIntegration';
import IOSetupForm from '../components/Form';

const IOSetup = (): JSX.Element => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { backUrl } = (locationState as { backUrl: string } | undefined) || {
    backUrl: -1,
  };

  const [ioState, setIoStateInfo, refreshIO] = useIOSetup();

  const navigateBack = useCallback(() => {
    if (typeof backUrl === 'number') {
      navigate(backUrl as number);
    } else {
      navigate(backUrl as To);
    }
  }, [navigate, backUrl]);

  const onSubmit = useCallback(
    (data: IOStateInfo) => {
      setIoStateInfo(data);
      navigateBack();
    },
    [setIoStateInfo, navigateBack]
  );

  if (ioState === undefined) {
    return <CircularProgress />;
  }

  return (
    <IOSetupForm
      onSubmit={onSubmit}
      onCancel={navigateBack}
      onRefresh={refreshIO}
      ioState={ioState}
    />
  );
};

export default IOSetup;
