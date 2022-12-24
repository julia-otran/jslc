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
import { IOState, IOStateInfo } from '../../../../EngineIntegration';

import { useFormContext } from 'react-hook-form';

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
  const { register, watch } = useFormContext<IOStateInfo>();

  const currentSubnet = watch(`inputs.${index}.subnet`);
  const currentUniverse = watch(`inputs.${index}.universe`);

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl sx={{ flex: '1' }}>
        <Select
          label="Subnet"
          inputProps={register(`inputs.${index}.subnet`)}
          defaultValue={currentSubnet}
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
          inputProps={register(`inputs.${index}.universe`)}
          defaultValue={currentUniverse}
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
