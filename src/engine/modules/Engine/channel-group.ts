import { v4 as uuidV4 } from 'uuid';
import { flatten } from 'ramda';

import { validateDMXChannel } from './devices';
import { UniverseOrDefault, getDefaultUniverse } from './universes';
import {
  GroupOutput,
  ChannelMapWithDefault,
  GroupChannelValue,
  ChannelMap,
} from './channel-group-types';

export const getOutput = (
  universe: UniverseOrDefault,
  channel: number
): GroupOutput => {
  validateDMXChannel(channel);
  return { universe, channelMSB: channel };
};

export class ChannelGroup {
  id: string;
  outputs: GroupOutput[];

  constructor() {
    this.id = uuidV4();
    this.outputs = [];
  }

  getOutputs(): GroupOutput[] {
    return this.outputs;
  }

  addChannel({
    universe,
    start,
    offset,
    offsetLSB,
  }: {
    universe: UniverseOrDefault;
    start: number;
    offset?: number | undefined;
    offsetLSB?: number | undefined;
  }): void {
    const channelMSB = offset ? start + offset : start;
    const channelLSB = offsetLSB ? start + offsetLSB : undefined;

    validateDMXChannel(channelMSB);

    if (channelLSB) {
      validateDMXChannel(channelLSB);
    }

    this.outputs.push({ universe, channelMSB, channelLSB });
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
          const matchMSB = chAndValue.output.channel === output.channelMSB;
          const matchLSB = chAndValue.output.channel === output.channelLSB;
          return matchUniverse && (matchMSB || matchLSB);
        })
    );
  }

  getChannelMapWithValue(groupValue: GroupChannelValue): ChannelMapWithDefault {
    return flatten(
      this.outputs.map((output) => {
        const { universe, channelMSB, channelLSB } = output;
        const { valueLSB, ...value } = groupValue;

        const result: ChannelMapWithDefault = [];

        result.push({ ...value, output: { universe, channel: channelMSB } });

        if (channelLSB && valueLSB) {
          result.push({
            ...value,
            output: { universe, channel: channelLSB },
            value: valueLSB,
          });
        }

        return result;
      })
    );
  }
}
