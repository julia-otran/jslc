import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  TextField,
  Stack,
  Select,
  MenuItem,
  Button,
  Box,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

import { IOStateInfo } from '../../../../EngineIntegration';

interface OutputSetupProps {
  index: number;
  connectedLinuxDmxOutputs: string[];
  remove(index: number): void;
}

const OutputSetup: React.FC<OutputSetupProps> = ({
  index,
  connectedLinuxDmxOutputs,
  remove,
}) => {
  const { watch, register } = useFormContext<IOStateInfo>();

  const outputType = watch(`outputs.${index}.type`);
  const linuxDmxSelectedDevice = watch(`outputs.${index}.device`);

  const isLinuxDmxDeviceOffline =
    outputType === 'LINUX_DMX' &&
    !connectedLinuxDmxOutputs.includes(linuxDmxSelectedDevice);

  return (
    <Stack spacing={3}>
      <Box sx={{ width: '100%', display: 'flex' }}>
        <TextField
          label="Output ID"
          inputProps={register(`outputs.${index}.name`)}
          sx={{ flex: '1' }}
        />

        <Button onClick={() => remove(index)}>
          <DeleteIcon />
        </Button>
      </Box>

      <Box sx={{ width: '100%', display: 'flex' }}>
        <FormControl sx={{ flex: '0.5' }}>
          <InputLabel id={`output-${index}-type`}>Type</InputLabel>
          <Select
            labelId={`output-${index}-type`}
            inputProps={register(`outputs.${index}.type`)}
            defaultValue={outputType}
          >
            <MenuItem value="LINUX_DMX">Linux DMX</MenuItem>
            <MenuItem value="MOCK_DMX">Fake DMX Output</MenuItem>
          </Select>
        </FormControl>

        {outputType === 'LINUX_DMX' && (
          <FormControl sx={{ flex: '0.5', marginLeft: '16px' }}>
            <InputLabel id={`output-${index}-linux-dmx-device`}>
              Device Number
            </InputLabel>
            <Select
              labelId={`output-${index}-linux-dmx-device`}
              inputProps={register(`outputs.${index}.device`)}
              defaultValue={linuxDmxSelectedDevice || ''}
            >
              {isLinuxDmxDeviceOffline && (
                <MenuItem value={linuxDmxSelectedDevice}>
                  {linuxDmxSelectedDevice} (Offline)
                </MenuItem>
              )}
              {connectedLinuxDmxOutputs.map((deviceNumber) => (
                <MenuItem
                  key={`linux-dmx-${deviceNumber}`}
                  value={deviceNumber}
                >
                  {deviceNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Stack>
  );
};

export default OutputSetup;
