import {
  ChannelMap,
  ChannelMixMapWithDefault,
  ChannelValueMix,
  GroupOutputDefault,
  UniverseOrDefault,
  validateDMXChannel,
} from '../../../engine-types';

import { getDefaultUniverse } from './universes';
import { v4 as uuidV4 } from 'uuid';

export const getOutput = (
  universe: UniverseOrDefault,
  channel: number
): GroupOutputDefault => {
  validateDMXChannel(channel);
  return { universe, channelMSB: channel };
};

export class ChannelGroup {
  id: string;

  outputs: GroupOutputDefault[];

  constructor() {
    this.id = uuidV4();
    this.outputs = [];
  }

  getOutputs(): GroupOutputDefault[] {
    return this.outputs;
  }

  addChannel({
    universe,
    start,
    offset,
  }: {
    universe: UniverseOrDefault;
    start: number;
    offset?: number | undefined;
  }): void {
    const channelMSB = offset ? start + offset : start;

    validateDMXChannel(channelMSB);

    this.outputs.push({ universe, channelMSB });
  }

  addChannels({
    universe,
    starts,
    offset,
  }: {
    universe: UniverseOrDefault;
    starts: number[];
    offset?: number | undefined;
  }): void {
    starts.forEach((start) => {
      this.addChannel({ universe, start, offset });
    });
  }

  removeChannel({
    universe,
    start,
    offset,
  }: {
    universe: UniverseOrDefault;
    start: number;
    offset: number | undefined;
  }) {
    const channelMSB = offset ? start + offset : start;

    this.outputs = this.outputs.filter(
      (out) =>
        out.universe?.id === universe?.id && out.channelMSB === channelMSB
    );
  }

  getFilteredChannelMap(allChannels: ChannelMap): ChannelMap {
    return allChannels.filter(
      (chAndValue) =>
        !!this.outputs.find((output) => {
          const matchUniverse =
            chAndValue.output.universe.id ===
            (output.universe || getDefaultUniverse())?.id;
          const matchMSB = chAndValue.output.channelMSB === output.channelMSB;
          return matchUniverse && matchMSB;
        })
    );
  }

  getChannelsMixWithValue(
    groupValue: ChannelValueMix
  ): ChannelMixMapWithDefault {
    return this.outputs.map((output) => {
      return { ...groupValue, output };
    });
  }
}
