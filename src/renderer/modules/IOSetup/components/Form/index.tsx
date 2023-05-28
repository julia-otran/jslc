import { Box, Button, Tabs as MuiTabs, Tab } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { IOState, IOStateInfo } from '../../../EngineIntegration';
import React, { useCallback, useState } from 'react';

import { Inputs } from '../../Inputs';
import { Outputs } from '../../Outputs';
import { useIntl } from 'react-intl';

interface IOSetupFormProps {
  onSubmit(data: IOStateInfo): void;
  onCancel(): void;
  onRefresh(): void;
  ioState: IOState;
}

const IOSetupForm: React.FC<IOSetupFormProps> = ({
  onSubmit,
  onCancel,
  onRefresh,
  ioState,
}) => {
  const { formatMessage } = useIntl();

  const form = useForm({
    defaultValues: ioState.info,
  });

  const { handleSubmit } = form;

  const [tab, setTab] = useState('outputs');
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: string) => {
      setTab(value);
    },
    []
  );

  return (
    <>
      <MuiTabs value={tab} onChange={handleTabChange}>
        <Tab value="outputs" label={formatMessage({ id: 'outputs' })} />
        <Tab value="inputs" label={formatMessage({ id: 'inputs' })} />
      </MuiTabs>

      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {tab === 'outputs' && (
            <Outputs connectedOutputs={ioState.connectedDevices.outputs} />
          )}
          {tab === 'inputs' && (
            <Inputs connectedInputs={ioState.connectedDevices.inputs} />
          )}

          <Box>
            <Button onClick={onCancel}>Discard changes</Button>
            <Button onClick={onRefresh}>Refresh Devices</Button>
            <Button type="submit">Apply changes</Button>
          </Box>
        </form>
      </FormProvider>
    </>
  );
};

export default IOSetupForm;
