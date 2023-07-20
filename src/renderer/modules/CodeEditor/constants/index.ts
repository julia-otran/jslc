import { createContext } from 'react';
import { CodeEditorContext } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const CODE_EDITOR_CONTEXT = createContext<CodeEditorContext | undefined>(
  undefined
);
