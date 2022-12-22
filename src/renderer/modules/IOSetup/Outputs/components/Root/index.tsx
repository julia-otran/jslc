import { Stack, Button, CircularProgress } from '@mui/material';
import { useCallback } from 'react';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { v4 as uuidV4 } from 'uuid';

import { IOStateInfo } from '../../../../EngineIntegration';
import { useIOSetup } from '../../../hooks';
import OutputSetup from '../OutputSetup';

const IOSetupOutputs = (): JSX.Element => {
  const [ioState, setIoStateInfo] = useIOSetup();

  const form = useForm({
    defaultValues: ioState?.info,
  });

  const { control, handleSubmit } = form;

  const { fields, prepend, remove } = useFieldArray({
    control,
    name: 'outputs',
  });

  const onSubmit = useCallback(
    (data: IOStateInfo) => {
      console.log(data);
      setIoStateInfo(data);
    },
    [setIoStateInfo]
  );

  if (ioState === undefined) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3} sx={{ margin: '16px' }}>
          <Button
            onClick={() =>
              prepend({ name: uuidV4(), type: 'LINUX_DMX', device: '0' })
            }
          >
            <FormattedMessage id="add-output" />
          </Button>

          {fields.map((field, index) => (
            <OutputSetup
              remove={remove}
              key={field.id}
              index={index}
              connectedLinuxDmxOutputs={
                ioState.connectedDevices.outputs.linuxDMX
              }
            />
          ))}
        </Stack>
      </form>
    </FormProvider>
  );
};

export default IOSetupOutputs;
