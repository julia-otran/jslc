import { DmxOutputDevice, DMXData, writeToDmxDevice } from './devices';

export interface Universe {
  id: number;
  outputDevice: DmxOutputDevice;
}

export type UniverseOrDefault = Universe | undefined;

export type UniverseCreatedCallback = (universe: Universe) => void;
export type UniverseRemovedCallback = (universe: Universe) => void;

let defaultUniverse: Universe | undefined = undefined;
let universes: Record<number, Universe> = {};
let universeCreatedCallbacks: UniverseCreatedCallback[] = [];
let universeRemovedCallbacks: UniverseRemovedCallback[] = [];

export const addUniverseCreatedCallback = (
  cb: UniverseCreatedCallback
): void => {
  universeCreatedCallbacks.push(cb);
};

export const removeUniverseCreaatedCallback = (
  cb: UniverseCreatedCallback
): void => {
  universeCreatedCallbacks = universeCreatedCallbacks.filter((c) => c !== cb);
};

export const addUniverseRemovedCallback = (
  cb: UniverseRemovedCallback
): void => {
  universeRemovedCallbacks.push(cb);
};

export const removeUniverseRemovedCallback = (
  cb: UniverseRemovedCallback
): void => {
  universeRemovedCallbacks = universeRemovedCallbacks.filter((c) => c !== cb);
};

export const createUniverse = (
  id: number,
  outputDevice: DmxOutputDevice
): Universe => {
  if (universes[id]) {
    throw new Error('Universe ID already exists');
  }

  if (
    Object.values(universes)
      .map((u) => u.outputDevice.id)
      .find((d) => d === outputDevice.id)
  ) {
    throw new Error('Output Device already attached to other universe');
  }

  universes[id] = {
    id,
    outputDevice,
  };

  universeCreatedCallbacks.forEach((cb) => cb(universes[id]));

  return universes[id];
};

export const getUniverses = (): Record<number, Universe> => universes;

export const removeUniverse = (universe: Universe): void => {
  delete universes[universe.id];
  universeRemovedCallbacks.forEach((cb) => cb(universe));
};

export const setDefaultUniverse = (universe: Universe | undefined): void => {
  defaultUniverse = universe;
};

export const getDefaultUniverse = (): Universe | undefined => defaultUniverse;

export const writeToUniverse = (
  universeIn: UniverseOrDefault,
  data: DMXData
): Promise<void> => {
  const universe = universeIn ? universes[universeIn.id] : defaultUniverse;

  if (!universe) {
    throw new Error('Failed to find universe or default not set.');
  }

  return writeToDmxDevice(universe.outputDevice.id, data);
};
