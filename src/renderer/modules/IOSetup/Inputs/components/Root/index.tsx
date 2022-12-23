import { Stack, Button } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { v4 as uuidV4 } from 'uuid';

import { IOStateInfo, IOState } from '../../../../EngineIntegration';
import InputSetup from '../InputSetup';

interface IOSetupInputsProps {
  connectedInputs: IOState['connectedDevices']['inputs'];
}

const IOSetupInputs: React.FC<IOSetupInputsProps> = ({ connectedInputs }) => {
  const { control } = useFormContext<IOStateInfo>();

  const { fields, prepend, remove } = useFieldArray({
    control,
    name: 'inputs',
  });

  return (
    <Stack spacing={3} sx={{ margin: '16px' }}>
      <Button
        onClick={() => prepend({ name: uuidV4(), type: 'MIDI', portName: '' })}
      >
        <FormattedMessage id="add-input" />
      </Button>

      {fields.map((field, index) => (
        <InputSetup
          remove={remove}
          key={field.id}
          index={index}
          connectedInputs={connectedInputs}
        />
      ))}
    </Stack>
  );
};

export default IOSetupInputs;
