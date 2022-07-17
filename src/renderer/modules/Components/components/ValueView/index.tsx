import { CircularProgress, Stack, Typography } from '@mui/material';

import { useDeviceChannelValue } from '../../../EngineIntegration';

interface Props {
  device: number;
  channel: number;
}

export const ValueView = ({ device, channel }: Props): JSX.Element => {
  const rawValue = useDeviceChannelValue(device, channel);
  const value = (rawValue / 255) * 100;

  return (
    <Stack spacing={1}>
      <CircularProgress variant="determinate" value={value} />
      <Typography variant="body2" sx={{ fontSize: '12px' }}>
        CH: {channel}
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '12px' }}>
        Val: {rawValue}
      </Typography>
    </Stack>
  );
};
