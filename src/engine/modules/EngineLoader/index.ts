import * as engine from '../Engine';
import * as engineAdapter from '../EngineAdapter';

import {
  EngineInputMessageNames,
  EngineLoadCodeInputMessage,
} from '../../../engine-types';

import { registerMessageListener } from '../EngineAdapter/messaging';
import { transpile } from 'typescript';

let previousRunningCode: string | undefined;

class CodeLoadingFailed extends Error {}

const loadCode = async (codeString: string): Promise<void> => {
  try {
    // TODO: Transpile this thing on the UI, or inside a UI worker or anywhere outside engine or main thread.
    const jsCode = transpile(codeString);

    // eslint-disable-next-line no-eval
    eval(`\
          function externalCode(depInjections) {
            const { engine, engineAdapter } = depInjections;

            ${jsCode}
          };`);

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
      externalCode({ engineAdapter, engine });
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
