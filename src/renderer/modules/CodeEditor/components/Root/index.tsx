import * as monaco from 'monaco-editor';

import React, { useEffect, useRef } from 'react';

import { Stack } from '@mui/material';

const CodeEditor: React.FC = () => {
  const divEl = useRef<HTMLDivElement>(null);

  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (divEl.current) {
      editor.current = monaco.editor.create(divEl.current, {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join(
          '\n'
        ),
        language: 'typescript',
      });
    }

    return () => {
      editor.current?.dispose();
    };
  }, []);

  return <Stack sx={{ height: '100%' }} ref={divEl} />;
};

export default CodeEditor;
