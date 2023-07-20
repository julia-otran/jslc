import * as monaco from 'monaco-editor';

import { OutputOptions, Plugin, RollupOptions, rollup } from '@rollup/browser';

const ENGINE_CODE = `
export const Engine = depInjection.Engine;
export const EngineAdapter = depInjection.EngineAdapter;
export const EngineTypes = depInjection.EngineTypes;

`;

export const compileCode = async (
  models: monaco.editor.IModel[]
): Promise<string> => {
  const modelsCode = models.map(async (model) => {
    const getWorkerForUri =
      await monaco.languages.typescript.getTypeScriptWorker();

    const proxy = await getWorkerForUri(monaco.Uri.parse(model.uri.toString()));
    const outputs = await proxy.getEmitOutput(model.uri.toString());

    return outputs.outputFiles[0];
  });

  const fileList = await Promise.all(modelsCode);
  const filesObject: Record<string, string> = {};

  fileList.forEach((file) => {
    filesObject[file.name.replace('file://', '.').replaceAll(/\.ts$/g, '.js')] =
      file.text;
  });

  const rollupResolvePlugin: Plugin = {
    name: 'CustomFS',
    resolveId(source) {
      if (filesObject[`${source}.js`]) {
        return `${source}.js`;
      }

      const sourceHandled = source.replaceAll(/\.ts$/g, '.js');

      if (filesObject[sourceHandled]) {
        return sourceHandled;
      }

      if (filesObject[`${source}/index.js`]) {
        return `${source}/index.js`;
      }

      if (source === 'engine') {
        return source;
      }

      return undefined;
    },
    load(id) {
      if (id === 'engine') {
        return ENGINE_CODE;
      }

      return filesObject[id];
    },
  };

  const rollupInputOptions: RollupOptions = {
    input: './index.js',
    plugins: [rollupResolvePlugin],
    external: 'depInjection',
  };

  const rollupOutputOptions: OutputOptions = {
    format: 'cjs',
    file: 'bundle.js',
    sourcemap: false,
    inlineDynamicImports: true,
    minifyInternalExports: true,
    dynamicImportInCjs: true,
  };

  const bundle = await rollup(rollupInputOptions);
  const { output } = await bundle.generate(rollupOutputOptions);

  return output[0].code;
};
