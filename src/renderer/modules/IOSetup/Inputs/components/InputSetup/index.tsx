import React from 'react';
import { useFormContext } from 'react-hook-form';
import { TextField, Stack, Select, MenuItem, Button, Box } from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

import { IOStateInfo, IOState } from '../../../../EngineIntegration';
import ArtNetInput from '../ArtNetInput';
import MidiInput from '../MidiInput';

interface InputSetupProps {
  index: number;
  connectedInputs: IOState['connectedDevices']['inputs'];
  remove(index: number): void;
}

const InputSetup: React.FC<InputSetupProps> = ({
  index,
  connectedInputs,
  remove,
}) => {
  const { watch, register } = useFormContext<IOStateInfo>();

  const inputType = watch(`inputs.${index}.type`);

  return (
    <Stack spacing={3}>
      <Box sx={{ width: '100%', display: 'flex' }}>
        <TextField
          label="Input ID"
          inputProps={register(`inputs.${index}.name`)}
          sx={{ flex: '1' }}
        />

        <Button onClick={() => remove(index)}>
          <DeleteIcon />
        </Button>
      </Box>

      <Box sx={{ width: '100%', display: 'flex' }}>
        <Select
          sx={{ flex: '1' }}
          label="Type"
          inputProps={register(`inputs.${index}.type`)}
          defaultValue={inputType}
        >
          <MenuItem value="ART_NET">Art Net</MenuItem>
          <MenuItem value="MIDI">Midi</MenuItem>
        </Select>
      </Box>

      {inputType === 'ART_NET' && <ArtNetInput index={index} />}
      {inputType === 'MIDI' && (
        <MidiInput
          index={index}
          connectedMidiInputPorts={connectedInputs.midi}
        />
      )}
    </Stack>
  );
};

export default InputSetup;
