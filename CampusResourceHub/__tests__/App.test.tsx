/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-webview', () => {
  const ReactMock = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: ReactMock.forwardRef((props, ref) => (
      <View {...props} ref={ref} />
    )),
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
