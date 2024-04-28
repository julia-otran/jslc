import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { IOStateInfo } from '../../../../EngineIntegration';

interface LinuxDMXProps {
  index: number;
  connectedLinuxDmxOutputs: string[];
}

const LinuxDMX: React.FC<LinuxDMXProps> = ({
  index,
  connectedLinuxDmxOutputs,
}) => {
  const { watch, register } = useFormContext<IOStateInfo>();

  const linuxDmxSelectedDevice = watch(`outputs.${index}.device`);

  const isLinuxDmxDeviceOffline = !connectedLinuxDmxOutputs.includes(
    linuxDmxSelectedDevice
  );

  return (
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
          <MenuItem key={`linux-dmx-${deviceNumber}`} value={deviceNumber}>
            {deviceNumber}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LinuxDMX;
