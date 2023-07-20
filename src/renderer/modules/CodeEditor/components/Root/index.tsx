import * as monaco from 'monaco-editor';

import { Button, Stack } from '@mui/material';
import React, { useCallback, useState } from 'react';

import AddFileDialog from '../AddFileDialog';
import Editor from '../Editor';
import Navigator from '../Navigator';
import { useEngineCode } from '../../../EngineIntegration';
import { useSaveEditorCode } from '../../hooks';

const CodeEditor: React.FC = () => {
  const [_, setEngineCode] = useEngineCode();

  const saveEditorCode = useSaveEditorCode();

  const handleRunCode = useCallback(() => {
    saveEditorCode();

    monaco.languages.typescript
      .getTypeScriptWorker()
      .then((getWorkerForUri) =>
        getWorkerForUri(monaco.Uri.parse('file:///src/index.ts'))
      )
      .then((proxy) => proxy.getEmitOutput('file:///src/index.ts'))
      .then((outputs) => setEngineCode(outputs.outputFiles[0].text))
      .catch((e) => console.error('Failed getting transpiled code!', e));
  }, [setEngineCode, saveEditorCode]);

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
