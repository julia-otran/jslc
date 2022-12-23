import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs as MuiTabs, Tab } from '@mui/material';
import { useIntl } from 'react-intl';
import { useNavigate, Outlet } from 'react-router-dom';

import { ROUTER_PATHS_PARAMS } from '../../../Router';

interface Props {
  onChange?(route: string): void;
  pageCount: number;
}

const Tabs = ({ onChange, pageCount }: Props): JSX.Element => {
  const { formatMessage } = useIntl();

  const [tab, setTab] = useState<string>(ROUTER_PATHS_PARAMS.CTRL_PAGE(0));

  const navigate = useNavigate();

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string): void => {
      setTab(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  useEffect(() => {
    navigate(tab);
  }, [tab, navigate]);

  const pages = useMemo(
    () =>
      Array(pageCount + 1)
        .fill(0)
        .map((_, i) => i),
    [pageCount]
  );

  return (
    <>
      <MuiTabs value={tab} onChange={handleChange}>
        {pages.map((pageNumber) => (
          <Tab
            key={pageNumber}
            value={ROUTER_PATHS_PARAMS.CTRL_PAGE(pageNumber)}
            label={
              pageNumber === 0
                ? formatMessage({ id: 'ctrl-page-0' })
                : formatMessage({ id: 'ctrl-page-n' }, { pageNumber })
            }
          />
        ))}
      </MuiTabs>
      <Outlet />
    </>
  );
};

export default Tabs;
