import { useIOSetup } from '../../EngineIntegration';

// eslint-disable-next-line import/prefer-default-export
export const useIsIOConfigured = (): boolean | undefined => {
  const [io] = useIOSetup();

  return io
    ? io.status.hasOutput && io.status.missingDevices.length === 0
    : undefined;
};

export { useIOSetup };
