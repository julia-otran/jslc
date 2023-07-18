import {
  EngineInputMessageNames,
  EngineLocalConnInputMessage,
  EngineLocalConnOutputMessage,
  EngineLocalConnRequestValueInputMessage,
  EngineOutputMessageNames,
  LocalConnMessage,
} from '../../../engine-types';
import {
  getValueProvider,
  receiveLocalConnMessage,
  registerLocalConnSender,
} from '../Engine';
import { registerMessageListener, sendMessage } from './messaging';

// eslint-disable-next-line import/prefer-default-export
export const initLocalConn = () => {
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
};
