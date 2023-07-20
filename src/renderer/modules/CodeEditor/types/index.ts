import * as monaco from 'monaco-editor';

export interface CodeEditorContext {
  models: monaco.editor.IModel[];
  addModel(name: string): void;
  currentModel: monaco.editor.IModel | undefined;
  setCurrentModel(model: monaco.editor.IModel | undefined): void;
  saveCode(): void;
  runCode(): void;
}
