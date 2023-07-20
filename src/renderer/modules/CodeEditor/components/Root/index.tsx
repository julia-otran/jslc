import { Button, Stack } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useRunCode, useSaveEditorCode } from '../../hooks';

import AddFileDialog from '../AddFileDialog';
import Editor from '../Editor';
import Navigator from '../Navigator';

const CodeEditor: React.FC = () => {
  const saveEditorCode = useSaveEditorCode();
  const runCode = useRunCode();

  const handleRunCode = useCallback(() => {
    saveEditorCode();
    runCode();
  }, [runCode, saveEditorCode]);

  const [addModelOpen, setAddModelOpen] = useState(false);

  const addModel = useCallback(() => {
    setAddModelOpen(true);
  }, []);

  return (
    <Stack gap={2} sx={{ flex: '0.99', padding: '16px' }}>
      <AddFileDialog
        open={addModelOpen}
        onClose={() => setAddModelOpen(false)}
      />
      <Stack direction="row" sx={{ height: '100%' }} gap={2}>
        <Navigator />
        <Editor />
      </Stack>
      <Stack direction="row" gap={2}>
        <Button onClick={addModel}>Add File</Button>
        <Button onClick={handleRunCode}>Run Code</Button>
      </Stack>
    </Stack>
  );
};

export default CodeEditor;
