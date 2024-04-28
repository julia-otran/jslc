import {
  Autocomplete,
  Box,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { IOState, IOStateInfo } from '../../../../EngineIntegration';

interface ArtNetOutputProps {
  index: number;
  artNetNetworkInterfaces: IOState['connectedDevices']['outputs']['artNetNetworkInterfaces'];
}

const ART_NET_SUBNETS = Array(16)
  .fill(0)
  .map((_, index) => index);

const ART_NET_UNIVERSES = Array(16)
  .fill(0)
  .map((_, index) => index);

const ArtNetOutput: React.FC<ArtNetOutputProps> = ({
  index,
  artNetNetworkInterfaces,
}) => {
  const { register, watch, control } = useFormContext<IOStateInfo>();

  const currentPort = watch(`outputs.${index}.port`);
  const currentIP = watch(`outputs.${index}.ip`);
  const currentNet = watch(`outputs.${index}.net`);
  const currentSubnet = watch(`outputs.${index}.subnet`);
  const currentUniverse = watch(`outputs.${index}.universe`);

  const broadcastAddresses = useMemo(
    () => artNetNetworkInterfaces.map((i) => i.broadcast),
    [artNetNetworkInterfaces]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}>
        <FormControl sx={{ flex: '1' }}>
          <Controller
            control={control}
            name={`outputs.${index}.ip`}
            render={({ field }) => (
              <Autocomplete
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...field}
                onChange={(_, value) => field.onChange(value)}
                value={currentIP || ''}
                disablePortal
                freeSolo
                options={broadcastAddresses}
                renderInput={(params) => (
                  <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...params}
                    label="Destination IP"
                    type="string"
                    defaultValue={currentIP || '255.255.255.255'}
                  />
                )}
              />
            )}
          />
        </FormControl>

        <FormControl sx={{ flex: '1', marginLeft: '16px' }}>
          <TextField
            label="UDP Port"
            type="number"
            defaultValue={currentPort || 6454}
            inputProps={register(`outputs.${index}.port`, {
              min: 1,
              max: 65535,
            })}
          />
        </FormControl>

        <FormControl sx={{ flex: '1', marginLeft: '16px' }}>
          <TextField
            label="MAX Resend Interval (MS)"
            type="number"
            defaultValue={1000}
            inputProps={register(`outputs.${index}.resendIntervalMs`, {
              min: 1,
              max: 3000,
            })}
          />
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex' }}>
        <FormControl sx={{ flex: '1' }}>
          <TextField
            label="Net"
            type="number"
            defaultValue={currentNet || 0}
            inputProps={register(`outputs.${index}.net`, { min: 0, max: 127 })}
          />
        </FormControl>
        <FormControl sx={{ flex: '1', marginLeft: '16px' }}>
          <Select
            label="Subnet"
            inputProps={register(`outputs.${index}.subnet`)}
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
          <Select
            label="Universe"
            inputProps={register(`outputs.${index}.universe`)}
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
    </Box>
  );
};

export default ArtNetOutput;
