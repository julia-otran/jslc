import * as monaco from 'monaco-editor';

export enum ModelActionType {
  INITIALIZE = 'INITIALIZE',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  DISPOSE = 'DISPOSE',
}

interface ModelActionBase {
  type: ModelActionType;
}

export interface ModelInitializeAction extends ModelActionBase {
  type: ModelActionType.INITIALIZE;
  files: Record<string, string>;
}

export interface ModelAddAction extends ModelActionBase {
  type: ModelActionType.ADD;
  filename: string;
  onModelCreated(model: monaco.editor.IModel): void;
}

export interface ModelRemoveAction extends ModelActionBase {
  type: ModelActionType.REMOVE;
  filename: string;
}

export interface ModelDisposeAction extends ModelActionBase {
  type: ModelActionType.DISPOSE;
}

export type ModelAction =
  | ModelInitializeAction
  | ModelAddAction
  | ModelRemoveAction
  | ModelDisposeAction;

export default (state: monaco.editor.IModel[] = [], action: ModelAction) => {
  switch (action.type) {
    case ModelActionType.INITIALIZE:
      const result = [...state];

      Object.keys(action.files).forEach((filename) => {
        result.push(
          monaco.editor.createModel(
            action.files[filename],
            'typescript',
            monaco.Uri.parse(filename)
          )
        );
      });

      if (!Object.keys(action.files).includes('file:///index.ts')) {
        result.push(
          monaco.editor.createModel(
            '',
            'typescript',
            monaco.Uri.parse('file:///index.ts')
          )
        );
      }

      return result;
    case ModelActionType.ADD:
      const add = [...state];

      const modelAdd = monaco.editor.createModel(
        '',
        'typescript',
        monaco.Uri.parse(action.filename)
      );

      add.push(modelAdd);

      action.onModelCreated(modelAdd);

      return add;
    case ModelActionType.REMOVE:
      return state.filter((model) => model.uri.toString() !== action.filename);
    case ModelActionType.DISPOSE:
      state.forEach((model) => model.dispose());
      return [];
    default:
      return state;
  }
};
