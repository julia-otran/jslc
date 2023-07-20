import * as monaco from 'monaco-editor';

import React, { useEffect, useRef } from 'react';

import { Stack } from '@mui/material';
import { useCurrentModel } from '../../hooks';

const Editor: React.FC = () => {
  const divEl = useRef<HTMLDivElement>(null);

  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const currentModel = useCurrentModel();

  useEffect(() => {
    if (divEl.current) {
      editor.current = monaco.editor.create(divEl.current, {
        model: currentModel,
        language: 'typescript',
      });
    }

    return () => {
      editor.current?.dispose();
    };

    // don't initialize again entire editor every time currentModel changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentModel) {
      editor.current?.setModel(currentModel);
    }
  }, [currentModel]);

  return <Stack sx={{ flex: 1 }} ref={divEl} />;
};

export default Editor;
