import { transpile } from 'typescript';
import * as engine from '../Engine';
import * as engineAdapter from '../EngineAdapter';
import * as engineTypes from '../../../engine-types';

import {
  EngineInputMessageNames,
  EngineLoadCodeInputMessage,
} from '../../../engine-types';

import { registerMessageListener } from '../EngineAdapter/messaging';

let previousRunningCode: string | undefined;

class CodeLoadingFailed extends Error {}

const loadCode = async (codeString: string): Promise<void> => {
  try {
    // TODO: Transpile this thing on the UI, or inside a UI worker or anywhere outside engine or main thread.
    const jsCode = transpile(codeString);

    // eslint-disable-next-line no-eval
    eval(`\
          function externalCode(engine) {
            var Module = require('module');
            var originalRequire = Module.prototype.require;

            Module.prototype.require = function(){
              if (arguments[0] === "engine") {
                return engine;
              }

              return originalRequire.apply(this, arguments);
            };

            ${jsCode}
          }; global.externalCode = externalCode;`);

    try {
      await engineAdapter.stopEngine();
    } catch (err) {
      console.error('Stopping engine failed! However it may be harmless.');
      console.error(err);
    }

    try {
      // That will be most complex part, cleanup previous code execution things
      engineAdapter.clearDeviceChangeCallbacks();
      engine.clearProcesses();
      engine.stopProcessAllUniverses();
      engine.clearGeneratorQueues();
      engine.clearDevicesChangeCallbacks();

      engine.addUniverseCreatedCallback(engine.startProcessUniverse);
      engine.addUniverseRemovedCallback(engine.stopProcessUniverse);
    } catch (err) {
      console.error("Engine cleanup failed! That's not expected");
      console.error(err);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      global.externalCode({
        EngineAdapter: engineAdapter,
        Engine: engine,
        EngineTypes: engineTypes,
      });
      previousRunningCode = codeString;
    } catch (err) {
      console.log('Code execution error');
      console.error(err);
      throw new CodeLoadingFailed('FNFAIL');
    }
  } catch (err) {
    if (err instanceof CodeLoadingFailed) {
      throw err;
    }

    console.log('Code eval error');
    console.error(err);
  }
};

// eslint-disable-next-line import/prefer-default-export
export const initEngineLoader = () => {
  registerMessageListener<EngineLoadCodeInputMessage>(
    EngineInputMessageNames.LOAD_CODE,
    (codeString) => {
      loadCode(codeString).catch(() => {
        if (previousRunningCode) {
          return loadCode(previousRunningCode);
        }

        return undefined;
      });
    }
  );
};
