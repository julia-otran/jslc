import * as React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useAddModel, useModelExists } from '../../hooks';

const FILENAME_REGEX = /^\/([\w\-_]+\/)*[\w\-_]+\.ts$/g;

const AddFileDialog: React.FC<{ open: boolean; onClose(): void }> = ({
  open,
  onClose,
}) => {
  const [filename, setFilename] = React.useState('');
  const [error, setError] = React.useState<string | undefined>(undefined);

  const checkExists = useModelExists();
  const addModel = useAddModel();

  const handleTextFieldChange: React.ChangeEventHandler<HTMLInputElement> =
    React.useCallback(
      (event) => {
        setFilename(event.target.value);

        if (!FILENAME_REGEX.test(event.target.value)) {
          setError('Invalid Name');
        } else if (checkExists(`file://${event.target.value}`)) {
          setError('Already exists');
        } else {
          setError(undefined);
        }
      },
      [checkExists]
    );

  const handleCreateFile = React.useCallback(() => {
    if (!FILENAME_REGEX.test(filename)) {
      return;
    }

    if (checkExists(`file://${filename}`)) {
      return;
    }

    addModel(`file://${filename}`);
    onClose();
  }, [filename, onClose, checkExists, addModel]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create File</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Type the new file name.
          <br />
          Cannot have spaces or some reserved chars.
          <br />
          Must start with `/`
        </DialogContentText>

        <TextField
          onChange={handleTextFieldChange}
          error={!!error}
          helperText={error}
          autoFocus
          margin="dense"
          id="filename"
          label="New File Name"
          type="text"
          fullWidth
          variant="standard"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreateFile}>Add File</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFileDialog;
