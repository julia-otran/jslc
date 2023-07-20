import * as monaco from 'monaco-editor';

import { List, ListItemButton } from '@mui/material';
import { useCurrentModel, useModelList, useSetCurrentModel } from '../../hooks';

const NavigatorItem: React.FC<{ model: monaco.editor.IModel }> = ({
  model,
}) => {
  const currentModel = useCurrentModel();
  const setCurrentModel = useSetCurrentModel();

  return (
    <ListItemButton
      selected={currentModel === model}
      onClick={() => setCurrentModel(model)}
    >
      {model.uri.path}
    </ListItemButton>
  );
};

const Navigator: React.FC = () => {
  const models = useModelList();

  return (
    <List sx={{ paddingTop: '0' }}>
      {models.map((model) => (
        <NavigatorItem model={model} key={model.uri.toString()} />
      ))}
    </List>
  );
};

export default Navigator;
