import { v4 as uuidV4 } from 'uuid';

import { validateDMXChannel } from './devices';
import { UniverseOrDefault, getDefaultUniverse } from './universes';
import {
  GroupOutputDefault,
  ChannelMap,
  ChannelMixMapWithDefault,
  ChannelValueMix,
} from './channel-group-types';

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
