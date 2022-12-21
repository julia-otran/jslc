import React, { useState, useCallback } from 'react';
import { Tabs as MuiTabs, Tab } from '@mui/material';
import { useIntl } from 'react-intl';

import { Inputs } from '../Inputs';
import { Outputs } from '../Outputs';

const IOSetup = (): JSX.Element => {
  const { formatMessage } = useIntl();

  const [tab, setTab] = useState<string>('outputs');

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string): void => {
      setTab(newValue);
    },
    []
  );

  return (
    <>
      <MuiTabs value={tab} onChange={handleChange}>
        <Tab value="outputs" label={formatMessage({ id: 'outputs' })} />
        <Tab value="inputs" label={formatMessage({ id: 'inputs' })} />
      </MuiTabs>

      {tab === 'outputs' && <Outputs />}
      {tab === 'inputs' && <Inputs />}
    </>
  );
};

export default IOSetup;
