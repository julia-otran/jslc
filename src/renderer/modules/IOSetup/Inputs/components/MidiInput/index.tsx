import { useFormContext } from 'react-hook-form';
import { FormControl, Select, MenuItem, Box } from '@mui/material';
import { IOStateInfo } from '../../../../EngineIntegration';

interface MidiInputInputProps {
  index: number;
  connectedMidiInputPorts: string[];
}

const MidiInput: React.FC<MidiInputInputProps> = ({
  index,
  connectedMidiInputPorts,
}) => {
  const { register, watch } = useFormContext<IOStateInfo>();
  const currentPort = watch(`inputs.${index}.portName`);

  const isDisconnected =
    currentPort && !connectedMidiInputPorts.includes(currentPort);

  return (
    <Box sx={{ display: 'flex' }}>
      <Select
        sx={{ flex: '1' }}
        label="Device"
        inputProps={register(`inputs.${index}.portName`)}
        defaultValue={currentPort || ''}
      >
        {(isDisconnected && (
          <MenuItem value={currentPort}>{currentPort} (Unavailable)</MenuItem>
        )) ||
          []}
        {connectedMidiInputPorts.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default MidiInput;
