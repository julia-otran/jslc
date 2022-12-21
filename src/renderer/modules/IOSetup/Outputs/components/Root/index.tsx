import { Stack, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';

const IOSetupOutputs = (): JSX.Element => {
  
  return (
    <Stack>
      <Button>
        <FormattedMessage id="add-input" />
      </Button>
    </Stack>
  );
};

export default IOSetupOutputs;
