import * as monaco from 'monaco-editor';

import { PropsWithChildren, useEffect, useState } from 'react';

import { useEngineTypes } from '../../../EngineIntegration';

const ENGINE_TYPES_PATH = 'file:///node_modules/@types/engine/index.d.ts';

const ENGINE_HELPER_D_TS = `
import { Engine, EngineAdapter } from 'engine';

declare global {
  const engine: Engine;
  const engineAdapter: EngineAdapter;
}
`;

const ENGINE_HELPER_D_TS_PATH = `file:///global.d.ts`;

const CodeEditorTypesRegister: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const engineTypes = useEngineTypes();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (engineTypes) {
      const typescriptCompilerOptions =
        monaco.languages.typescript.typescriptDefaults.getCompilerOptions();

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        ...typescriptCompilerOptions,
        lib: ['es6', 'es2020'],
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ES2015,
        allowNonTsExtensions: true,
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        engineTypes,
        ENGINE_TYPES_PATH
      );

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        ENGINE_HELPER_D_TS,
        ENGINE_HELPER_D_TS_PATH
      );

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `module.exports = { Engine: engine, EngineAdapter: engineAdapter, EngineTypes: engineTypes };`,
        'file:///node_modules/engine/index.ts'
      );

      setInitialized(true);
    }
  }, [engineTypes]);

  if (initialized) {
    return <>{children}</>;
  }

  return null;
};

export default CodeEditorTypesRegister;
