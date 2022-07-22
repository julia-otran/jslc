import {
  receiveLocalConnMessage,
  registerLocalConnSender,
  LocalConnMessage,
  getValueProvider,
} from '../Engine';
import {
  EngineLocalConnInputMessage,
  EngineLocalConnRequestValueInputMessage,
  EngineLocalConnOutputMessage,
  EngineInputMessageNames,
  EngineOutputMessageNames,
} from '../EngineMessaging';

import { registerMessageListener, sendMessage } from './messaging';

registerMessageListener<EngineLocalConnInputMessage>(
  EngineInputMessageNames.LOCAL_CONN,
  (data) => {
    receiveLocalConnMessage(data);
  }
);

registerMessageListener<EngineLocalConnRequestValueInputMessage>(
  EngineInputMessageNames.LOCAL_CONN_REQUEST_VALUE,
  (data) => {
    const getVal = getValueProvider(data.connectorKey, 0, 255);

    sendMessage<EngineLocalConnOutputMessage>({
      message: EngineOutputMessageNames.LOCAL_CONN,
      data: { connectorKey: data.connectorKey, value: getVal() },
    });
  }
);

registerLocalConnSender((data: LocalConnMessage) => {
  sendMessage<EngineLocalConnOutputMessage>({
    message: EngineOutputMessageNames.LOCAL_CONN,
    data,
  });
});
