import * as monaco from 'monaco-editor';

import { Button, Stack } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';

import { useEngineCode } from '../../../EngineIntegration';

const CodeEditor: React.FC = () => {
  const divEl = useRef<HTMLDivElement>(null);

  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [code, setCode] = useEngineCode();

  useEffect(() => {
    if (divEl.current) {
      editor.current = monaco.editor.create(divEl.current, {
        value: '',
        language: 'typescript',
      });
    }

    return () => {
      editor.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (code && editor.current?.getValue() !== code) {
      editor.current?.setValue(code);
    }
  }, [code]);

  const handleRunCode = useCallback(() => {
    const current = editor.current?.getValue();

    if (current) {
      setCode(current);
    }
  }, [setCode]);

  return (
    <Stack gap={2} sx={{ flex: '0.99', padding: '16px' }}>
      <Stack sx={{ flex: 1 }} ref={divEl} />
      <Button onClick={handleRunCode}>Run Code</Button>
    </Stack>
  );
};

export default CodeEditor;
