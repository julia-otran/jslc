import { DmxOutputDeviceId } from './devices-types';

export interface Universe {
  id: number;
  dmxOutputDeviceId: DmxOutputDeviceId;
}

export type UniverseOrDefault = Universe | undefined;
