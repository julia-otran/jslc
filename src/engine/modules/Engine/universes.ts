import {
  DMXData,
  DmxOutputDeviceId,
  Universe,
  UniverseOrDefault,
} from '../../../engine-types';

import { writeToDmxDevice } from './devices';

export type UniverseCreatedCallback = (universe: Universe) => void;
export type UniverseRemovedCallback = (universe: Universe) => void;

let defaultUniverse: Universe | undefined;
let universes: Record<number, Universe> = {};
let universeCreatedCallbacks: UniverseCreatedCallback[] = [];
let universeRemovedCallbacks: UniverseRemovedCallback[] = [];

export const clearUniverses = () => {
  defaultUniverse = undefined;
  universes = {};
  universeCreatedCallbacks = [];
  universeRemovedCallbacks = [];
};

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
  dmxOutputDeviceId: DmxOutputDeviceId
): Universe => {
  if (universes[id]) {
    throw new Error('Universe ID already exists');
  }

  if (
    Object.values(universes)
      .map((u) => u.dmxOutputDeviceId)
      .find((d) => d === dmxOutputDeviceId)
  ) {
    throw new Error('Output Device already attached to other universe');
  }

  universes[id] = {
    id,
    dmxOutputDeviceId,
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

  return writeToDmxDevice(universe.dmxOutputDeviceId, data);
};
