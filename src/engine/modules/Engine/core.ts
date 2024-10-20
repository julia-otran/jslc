import {
  ChannelMap,
  ChannelMix,
  ChannelMixMap,
  ChannelMixMapWithDefault,
  ChannelMixWithDefault,
  ChannelMixedMap,
  ChannelOutput,
  ChannelValue,
  ChannelValueMix,
  ChannelValueMixed,
  DMXData,
  DMXValue,
  InputDeviceId,
  MixMode,
  Process,
  ProcessCallbackParams,
  ProcessPriority,
  ProcessStatus,
  Task,
  Token,
  Universe,
} from '../../../engine-types';
import { channelValueToValue, sleep, valueToChannelValue } from './utils';
import { dmxChannels, getInputDeviceIds, readFromInputDevice } from './devices';
import { flatten, groupBy, map, pipe, reduce, sort } from 'ramda';
import { getChannelLSB, getChannelMSB } from './channel-lsb';
import { getDefaultUniverse, writeToUniverse } from './universes';

import { v4 as uuidV4 } from 'uuid';

interface OutputFunction<TReturn = any> {
  token: Token;
  process: Process<TReturn>;
  status: ProcessStatus;
  priority: ProcessPriority;
  lastReturn: TReturn;
  done: boolean;
  gcCount: number;
}

let outputFunctions: OutputFunction[] = [];

export const clearProcesses = () => {
  outputFunctions = [];
};

export const getNextPriority = (): number => {
  const prio = Math.max(...outputFunctions.map((fn) => fn.priority[0]));
  return Number.isFinite(prio) ? prio + 1 : 0;
};

const addProcess = <TReturn>(
  priority: ProcessPriority,
  process: Process<TReturn>
): ProcessCallbackParams => {
  const token = uuidV4();
  const status = { stopped: false, paused: false };

  process.next();

  outputFunctions.push({
    gcCount: 0,
    done: false,
    lastReturn: undefined,
    process,
    status,
    priority,
    token,
  });

  return { token, status, currentPriority: priority };
};

export const addRootProcess = <TReturn>(
  process: Process<TReturn>
): ProcessCallbackParams => {
  return addProcess([getNextPriority()], process);
};

export const pauseProcess = (task: Task): void => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    fn.status.paused = true;
  }
};

export const resumeProcess = (task: Task): void => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    fn.status.paused = false;
  }
};

export const stopProcess = (task: Task): void => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    fn.status.stopped = true;
  }
};

export const cancelProcess = (task: Task): void => {
  outputFunctions
    .filter((fn) => fn.token === task.token)
    .forEach((fn) => {
      fn.done = true;
    });
};

let processingUniverses: Universe[] = [];

export const stopProcessAllUniverses = () => {
  processingUniverses = [];
};

export const startProcessUniverse = (universe: Universe) => {
  console.log('Universe added to process', universe);
  processingUniverses.push(universe);
};

export const stopProcessUniverse = (universe: Universe) => {
  console.log('Universe processing stopped', universe);
  processingUniverses = processingUniverses.filter((u) => u.id !== universe.id);
};

export const isTaskPaused = (task: Task): boolean => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    return fn.status.paused;
  }

  return false;
};

export const isTaskStopped = (task: Task): boolean => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    return fn.status.stopped;
  }

  return true;
};

export const isTaskDone = (task: Task): boolean => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    return fn.done;
  }

  return true;
};

export const getTaskReturn = (task: Task): any => {
  const fn = outputFunctions.find((fn) => fn.token === task.token);

  if (fn) {
    return fn.lastReturn;
  }

  return undefined;
};

let inputDevicesData: Record<InputDeviceId, any> = {};

const consumeInputDevices = (): void => {
  inputDevicesData = {};

  getInputDeviceIds().forEach((inputDeviceId) => {
    inputDevicesData[inputDeviceId] = readFromInputDevice(inputDeviceId);
  });
};

const garbageCollectOutputFunctions = (): void => {
  outputFunctions.forEach((fn) => {
    if (fn.done) {
      fn.gcCount += 1;
    }
  });

  outputFunctions = outputFunctions.filter((fn) => fn.gcCount < 44);
};

type SortByPriority = (outputFunction: OutputFunction[]) => OutputFunction[];

const sortByPriority = (index: number): SortByPriority =>
  pipe(
    groupBy((fn: OutputFunction) => (fn.priority[index] || 0).toString()),
    Object.values,
    sort<OutputFunction[]>(
      (a: OutputFunction[], b: OutputFunction[]) =>
        (a[0].priority[index] || 0) - (b[0].priority[index] || 0)
    ),
    map<OutputFunction[], OutputFunction[]>((arr) =>
      arr[0].priority[index] === undefined
        ? arr
        : sortByPriority(index + 1)(arr)
    ),
    flatten
  );

const valueWeightCalc = (
  current: number,
  previous: number | undefined,
  currentWeight: number | undefined
): number => {
  const weight = currentWeight === undefined ? 1 : currentWeight;
  return current * weight + (previous || 0) * (1 - weight);
};

const channelValueOp = (
  current: ChannelValueMixed,
  previous: ChannelValueMixed | undefined,
  op: (a: number, b: number) => number
): ChannelValue => {
  const currentVal = channelValueToValue(current);
  const previousVal = channelValueToValue(previous);
  const currentWeight = current.weight;
  const opResult =
    previousVal !== undefined ? op(currentVal, previousVal) : currentVal;

  return valueToChannelValue(
    valueWeightCalc(opResult, previousVal, currentWeight)
  );
};

const mixChannelValues = <
  TMixed extends ChannelValueMixed,
  TCurrent extends TMixed & ChannelValueMix
>(
  previous: TMixed | undefined,
  current: TCurrent | undefined
): TMixed | undefined => {
  if (!current) {
    return previous;
  }

  const currentValue = channelValueToValue(current);
  const currentWeight = current.weight === undefined ? 1 : current.weight;

  if (current.mixMode === MixMode.CLEAR) {
    return undefined;
  }

  if (current.mixMode === MixMode.GREATER_PRIORITY) {
    const value = valueWeightCalc(
      currentValue,
      channelValueToValue(previous),
      currentWeight
    );

    return { ...current, ...valueToChannelValue(value), weight: undefined };
  }

  if (current.mixMode === MixMode.MAX) {
    return {
      ...current,
      ...channelValueOp(current, previous, Math.max),
      weight: undefined,
    };
  }

  if (current.mixMode === MixMode.MIN) {
    return {
      ...current,
      ...channelValueOp(current, previous, Math.min),
      weight: undefined,
    };
  }

  if (current.mixMode === MixMode.AVERAGE) {
    if (!previous) {
      return current;
    }

    const prevWeight = previous?.weight === undefined ? 1 : previous.weight;

    const prevVal = channelValueToValue(previous) * prevWeight;
    const weight = prevWeight + currentWeight;

    const value = (prevVal + currentWeight * currentValue) / weight;

    return { ...current, ...valueToChannelValue(value), weight };
  }

  throw new Error('Invalid MixMode.');
};

const fillUniverse = (
  withDefault: ChannelMixWithDefault
): ChannelMix | undefined => {
  const universe = withDefault.output.universe || getDefaultUniverse();

  if (!universe) {
    return undefined;
  }

  const { channelMSB } = withDefault.output;

  return {
    ...withDefault,
    output: { universe, channelMSB },
  };
};

const groupByOutput = <T extends ChannelOutput>(entities: T[]): T[][] =>
  Object.values(
    groupBy<T>(
      ({ output }) => `${output.universe.id}-${output.channelMSB}`,
      entities
    )
  );

const fixChInput = (
  mixMapWithDefault: ChannelMixMapWithDefault
): ChannelMixMap => {
  const mixMap = mixMapWithDefault
    .map(fillUniverse)
    .filter(Boolean) as ChannelMixMap;
  const msbInputs = mixMap.filter(
    (chMix) =>
      getChannelMSB({
        universe: chMix.output.universe,
        channelLSB: chMix.output.channelMSB,
      }) === undefined
  );

  if (msbInputs.length !== mixMap.length) {
    console.error(
      'An LSB Channel was outputed as MSB Channel. The engine will ignore this value. Please, set the valueLSB and valueMSB in a MSB channel.'
    );
  }

  return msbInputs;
};

const reduceFunctions = (
  acc: ChannelMixedMap,
  fn: OutputFunction
): ChannelMixedMap => {
  // First, send current values
  // maybe the process don't care
  let newValues: ChannelMixMap = [];

  const getStackMixedChannels = (): ChannelMixedMap => acc;
  const getValues = (): ChannelMixMap => newValues;
  const setValues = (values: ChannelMixMapWithDefault): void => {
    newValues = fixChInput(values);
  };

  const pushValues = (values: ChannelMixMapWithDefault): void => {
    newValues.push(...fixChInput(values));
  };

  const setReturn = <TReturn>(data: TReturn): void => {
    fn.lastReturn = data;
  };

  const readFromInputDeviceInt = <TData>(
    inputDeviceId: InputDeviceId
  ): TData | undefined => {
    return inputDevicesData[inputDeviceId];
  };

  const processOutput = fn.process.next({
    addProcess,
    stopProcess,
    cancelProcess,
    pauseProcess,
    resumeProcess,
    getStackMixedChannels,
    getValues,
    setValues,
    pushValues,
    isTaskPaused,
    isTaskStopped,
    isTaskDone,
    getReturn: getTaskReturn,
    setReturn,
    readFromInputDevice: readFromInputDeviceInt,
    params: {
      status: fn.status,
      token: fn.token,
      currentPriority: fn.priority,
    },
  });

  if (processOutput.done) {
    fn.done = true;
  }

  if (newValues === undefined || newValues.length <= 0) {
    return acc;
  }

  const mixedChannels = groupByOutput(
    newValues.filter(Boolean) as ChannelMixMap
  )
    .map((mixMap) => {
      const initialMixed = acc
        .filter(
          ({ output }) => output.universe.id === mixMap[0].output.universe.id
        )
        .find(
          ({ output }) => output.channelMSB === mixMap[0].output.channelMSB
        );

      return reduce(mixChannelValues, initialMixed, mixMap);
    })
    .filter(Boolean) as ChannelMixedMap;

  const previousRemainingChannels = acc.filter(
    (remaining) =>
      mixedChannels
        .filter((m) => m.output.universe.id === remaining.output.universe.id)
        .find((m) => m.output.channelMSB === remaining.output.channelMSB) ===
      undefined
  );

  return [...previousRemainingChannels, ...mixedChannels];
};

const sanitizeValue = (data: number | undefined): DMXValue =>
  Math.max(0, Math.min(255, Math.round(data || 0)));

type DmxResults = Array<{ universe: Universe; data: Uint8Array }>;

const processUniverses = (): DmxResults => {
  garbageCollectOutputFunctions();

  const functions = sortByPriority(0)(
    outputFunctions.filter((fn) => fn.done === false)
  );

  const channelMap: ChannelMap = reduce(reduceFunctions, [], functions);

  const results: DmxResults = [];

  processingUniverses.forEach((universe) => {
    const dataNumber: number[] = [];

    dmxChannels().forEach((chNumber) => {
      const val = channelMap
        .filter((m) => m.output.universe.id === universe.id)
        .find((m) => m.output.channelMSB === chNumber);

      const lsbCh = getChannelLSB({ universe, channelMSB: chNumber });

      const i = chNumber - 1;
      const ilsb = lsbCh ? lsbCh - 1 : undefined;

      dataNumber[i] = sanitizeValue(val?.valueMSB);

      if (ilsb) {
        dataNumber[ilsb] = sanitizeValue(val?.valueLSB);
      }
    });

    const data: DMXData = new Uint8Array(dataNumber);

    results.push({ universe, data });
  });

  return results;
};

let writeFrames = 0;
let lastWriteRunDate: Date = new Date();

const writeDmxResults = async (results: DmxResults): Promise<void> => {
  writeFrames += 1;

  if (writeFrames > 100) {
    const current = new Date();
    const deltaSecs = (current.getTime() - lastWriteRunDate.getTime()) / 1000;
    const fps = writeFrames / deltaSecs;

    console.log('DMX Write FPS: ', Math.round(fps * 10) / 10);

    writeFrames = 0;
    lastWriteRunDate = current;
  }

  if (results.length === 0) {
    return sleep(25);
  }

  return Promise.allSettled(
    results.map((r) => writeToUniverse(r.universe, r.data))
  ).then(() => {
    return undefined;
  });
};

type RunFinishCallback = () => void;

let process = false;
let runFinishCallback: RunFinishCallback | undefined;

export const startProcessing = async () => {
  let errorCount = 0;
  process = true;

  let lastRunDate = new Date();
  let frames = 0;
  let writePromise: Promise<void> = Promise.resolve();
  let latency = 0;
  let latencyAvg = 0;

  while (process) {
    try {
      let results: DmxResults = [];

      const beforeTime = new Date().getTime();
      let deltaTime = 0;

      do {
        const currentTime = new Date().getTime();
        deltaTime = currentTime - beforeTime;
      } while (deltaTime <= latencyAvg * 2 && process);

      consumeInputDevices();
      results = processUniverses();

      const writeInit = new Date().getTime();
      // eslint-disable-next-line no-await-in-loop
      await writePromise;
      const writeEnd = new Date().getTime();

      latency = writeEnd - writeInit;

      if (latencyAvg === 0) {
        latencyAvg = latency;
      } else {
        latencyAvg = (latencyAvg + latency) / 2.0;
      }

      writePromise = writeDmxResults(results);

      errorCount = 0;
      frames += 1;

      if (frames > 1000) {
        const current = new Date();
        const deltaSecs = (current.getTime() - lastRunDate.getTime()) / 1000;
        const fps = frames / deltaSecs;

        console.log('DMX Processing FPS: ', Math.round(fps * 10) / 10);

        frames = 0;
        lastRunDate = current;
      }
    } catch (error) {
      errorCount += 1;

      if (errorCount > 50) {
        console.error('Too many errors when processing. Engine will sleep.');
        console.error(error);

        // eslint-disable-next-line no-await-in-loop
        await sleep(100);
      }
    }
  }

  process = false;
  runFinishCallback?.();
};

export const stopProcessing = (): Promise<void> => {
  return new Promise((resolve) => {
    if (process) {
      process = false;
      runFinishCallback = resolve;
    } else {
      resolve();
    }
  });
};

export const isProcessing = (): boolean => process;
