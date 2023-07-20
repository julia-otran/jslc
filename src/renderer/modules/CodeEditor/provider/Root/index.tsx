import * as monaco from 'monaco-editor';

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import useLocalStorage from '@rehooks/local-storage';
import { CODE_EDITOR_CONTEXT } from '../../constants';
import { CodeEditorContext } from '../../types';
import { ModelActionType } from '../../reducers/models';
import { models as modelsReducer } from '../../reducers';

const ContextProvider = CODE_EDITOR_CONTEXT.Provider;

const CodeEditorProvider: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [editorCode, setEditorCode] =
    useLocalStorage<Record<string, string>>('EDITOR_CODE');

  const [models, dispatchModels] = useReducer(modelsReducer, []);
  const [currentModel, setCurrentModel] = useState<
    monaco.editor.IModel | undefined
  >(undefined);

  useEffect(() => {
    dispatchModels({
      type: ModelActionType.INITIALIZE,
      files: editorCode || {},
    });

    return () => {
      dispatchModels({ type: ModelActionType.DISPOSE });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addModel = useCallback((filename: string) => {
    dispatchModels({
      type: ModelActionType.ADD,
      filename,
      onModelCreated: (model) => setCurrentModel(model),
    });
  }, []);

  const saveCode = useCallback(() => {
    const editorCodeToSave: Record<string, string> = {};

    models.forEach((model) => {
      const filename = model.uri.toString();
      const data = model.getValue();

      editorCodeToSave[filename] = data;
    });

    setEditorCode(editorCodeToSave);
  }, [models, setEditorCode]);

  const runCode = useCallback(() => {
    console.log(
      'Run the code. I really dont know how transform all these files into one'
    );
  }, []);

  const providerValue: CodeEditorContext = useMemo(
    () => ({
      setCurrentModel,
      addModel,
      currentModel,
      models,
      saveCode,
      runCode,
    }),
    [models, runCode, saveCode, currentModel, addModel]
  );

  return <ContextProvider value={providerValue}>{children}</ContextProvider>;
};

export default CodeEditorProvider;
