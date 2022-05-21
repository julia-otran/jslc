const data: Array<number> = [];

for (let i = 0; i < 512; i++) {
  data[i] = 0;
}

data[0] = 255;
data[1] = 255;

window.electron.ipcRenderer.on('devices-found', (...args: unknown[]) => {
  const devices = args[0] as Array<number>;

  console.log(devices);

  window.electron.ipcRenderer.writeDMX(
    'teste',
    devices[0],
    new Uint8Array(data)
  );
});

window.electron.ipcRenderer.requestDevices();

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('dmx-data-done', (...args) => {
  const requestId = args[0] as string;
  const success = args[1] as boolean;

  // eslint-disable-next-line no-console
  console.log('DMX Data writed', { requestId, success });
});
