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
import { IOStateInfo, IOState } from '../../../../EngineIntegration';

interface ArtNetInputProps {
  index: number;
}

const ART_NET_SUBNETS = Array(16)
  .fill(0)
  .map((_, index) => index);

const ART_NET_UNIVERSES = Array(16)
  .fill(0)
  .map((_, index) => index);

const ArtNetInput: React.FC<ArtNetInputProps> = ({ index }) => {
  const { register } = useFormContext<IOStateInfo>();

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl sx={{ flex: '1' }}>
        <Select
          label="Subnet"
          inputProps={register(`inputs.${index}.subnet`)}
          defaultValue={0}
        >
          {ART_NET_SUBNETS.map((subnet) => (
            <MenuItem key={`subnet-${subnet}`} value={subnet}>
              {subnet}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ flex: '1', marginLeft: '16px' }}>
        <TextField
          label="Net"
          type="number"
          defaultValue={0}
          inputProps={register(`inputs.${index}.net`, { min: 0, max: 127 })}
        />
      </FormControl>
      <FormControl sx={{ flex: '1', marginLeft: '16px' }}>
        <Select
          label="Universe"
          inputProps={register(`outputs.${index}.device`)}
          defaultValue={0}
        >
          {ART_NET_UNIVERSES.map((universe) => (
            <MenuItem key={`universe-${universe}`} value={universe}>
              {universe}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ArtNetInput;
