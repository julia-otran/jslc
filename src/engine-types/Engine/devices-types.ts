export type DMXChannel = number;
export type DMXValue = number;

export type DMXData = Uint8Array;

export type DmxOutputDeviceId = string;
export type InputDeviceId = string;

export const validateDMXChannel = (n: DMXChannel): void => {
  if (n < 1) {
    throw new Error(`Channel ${n} is less than 1.`);
  }

  if (n > 512) {
    throw new Error(`Channel ${n} is greater than 512.`);
  }

  if (parseInt(n.toString()) !== n) {
    throw new Error(`Channel ${n} is not integer.`);
  }
};

export const validateDMXValue = (v: DMXValue): void => {
  if (v < 0) {
    throw new Error(`Value ${v} is less than 0.`);
  }

  if (v > 255) {
    throw new Error(`Value ${v} is greater than 255.`);
  }

  if (parseInt(v.toString()) !== v) {
    throw new Error(`Value ${v} is not integer.`);
  }
};
