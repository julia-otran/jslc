import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { IOState, IOStateInfo } from '../../../../EngineIntegration';

import ArtNetOutput from '../ArtNet';
import LinuxDMX from '../LinuxDMX';

interface OutputSetupProps {
  index: number;
  connectedOutputs: IOState['connectedDevices']['outputs'];
  remove(index: number): void;
}

const OutputSetup: React.FC<OutputSetupProps> = ({
  index,
  connectedOutputs,
  remove,
}) => {
  const { watch, register } = useFormContext<IOStateInfo>();

  const outputType = watch(`outputs.${index}.type`);

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
            <MenuItem value="ART_NET">Art Net DMX Output</MenuItem>
          </Select>
        </FormControl>

        {outputType === 'LINUX_DMX' && (
          <LinuxDMX
            index={index}
            connectedLinuxDmxOutputs={connectedOutputs.linuxDMX}
          />
        )}

        {outputType === 'ART_NET' && (
          <ArtNetOutput
            index={index}
            artNetNetworkInterfaces={connectedOutputs.artNetNetworkInterfaces}
          />
        )}
      </Box>
    </Stack>
  );
};

export default OutputSetup;
