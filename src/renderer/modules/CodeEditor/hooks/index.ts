import * as monaco from 'monaco-editor';

import { useCallback, useContext } from 'react';

import { CODE_EDITOR_CONTEXT } from '../constants';
import { CodeEditorContext } from '../types';

export const useCodeEditorContext = (): CodeEditorContext => {
  const ctx = useContext(CODE_EDITOR_CONTEXT);

  if (ctx === undefined) {
    throw new Error('Cannot use code editor context outside provider');
  }

  return ctx;
};

export const useSaveEditorCode = (): CodeEditorContext['saveCode'] => {
  return useCodeEditorContext().saveCode;
};

export const useModelList = (): CodeEditorContext['models'] => {
  return useCodeEditorContext().models;
};

export const useAddModel = (): CodeEditorContext['addModel'] => {
  return useCodeEditorContext().addModel;
};

export const useSetCurrentModel = (): CodeEditorContext['setCurrentModel'] => {
  return useCodeEditorContext().setCurrentModel;
};

export type UseModelExistsCallback = (name: string) => boolean;

export const useModelExists = (): UseModelExistsCallback => {
  const models = useModelList();
  const cb: UseModelExistsCallback = useCallback(
    (name) => {
      return models.find((m) => m.uri.toString() === name) !== undefined;
    },
    [models]
  );

  return cb;
};

export const useCurrentModel = (): monaco.editor.IModel | undefined => {
  const ctx = useCodeEditorContext();

  if (ctx.currentModel) {
    return ctx.currentModel;
  }

  const indexModel = ctx.models.find(
    (model) => model.uri.toString() === 'file:///index.ts'
  );

  return indexModel;
};
