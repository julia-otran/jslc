import * as monaco from 'monaco-editor';

import { Button, Stack } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';

import { useLocalStorage } from '@rehooks/local-storage';
import { useEngineCode } from '../../../EngineIntegration';

const CodeEditor: React.FC = () => {
  const divEl = useRef<HTMLDivElement>(null);

  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [_, setEngineCode] = useEngineCode();
  const [editorCode, setEditorCode] = useLocalStorage('EDITOR_CODE');

  const indexModelRef = useRef<monaco.editor.IModel | null>(null);

  useEffect(() => {
    if (divEl.current) {
      indexModelRef.current = monaco.editor.createModel(
        editorCode || '',
        'typescript',
        monaco.Uri.parse('file:///src/index.ts')
      );

      editor.current = monaco.editor.create(divEl.current, {
        model: indexModelRef.current,
        language: 'typescript',
      });
    }

    return () => {
      indexModelRef.current?.dispose();
      editor.current?.dispose();
    };

    // don't initialize again entire editor every time code changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorCode && editor.current?.getValue() !== editorCode) {
      editor.current?.setValue(editorCode);
    }
  }, [editorCode]);

  const handleRunCode = useCallback(() => {
    const current = editor.current?.getValue();

    if (current) {
      setEditorCode(current);

      monaco.languages.typescript
        .getTypeScriptWorker()
        .then((getWorkerForUri) =>
          getWorkerForUri(monaco.Uri.parse('file:///src/index.ts'))
        )
        .then((proxy) => proxy.getEmitOutput('file:///src/index.ts'))
        .then((outputs) => setEngineCode(outputs.outputFiles[0].text))
        .catch((e) => console.error('Failed getting transpiled code!', e));
    }
  }, [setEditorCode, setEngineCode]);

  return (
    <Stack gap={2} sx={{ flex: '0.99', padding: '16px' }}>
      <Stack sx={{ flex: 1 }} ref={divEl} />
      <Button onClick={handleRunCode}>Run Code</Button>
    </Stack>
  );
};

export default CodeEditor;
