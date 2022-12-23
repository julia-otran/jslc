import { Stack, Button } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { v4 as uuidV4 } from 'uuid';

import { IOStateInfo, IOState } from '../../../../EngineIntegration';
import OutputSetup from '../OutputSetup';

interface IOSetupOutputsProps {
  connectedOutputs: IOState['connectedDevices']['outputs'];
}

const IOSetupOutputs: React.FC<IOSetupOutputsProps> = ({
  connectedOutputs,
}) => {
  const { control } = useFormContext<IOStateInfo>();

  const { fields, prepend, remove } = useFieldArray({
    control,
    name: 'outputs',
  });

  return (
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
          connectedLinuxDmxOutputs={connectedOutputs.linuxDMX}
        />
      ))}
    </Stack>
  );
};

export default IOSetupOutputs;
