import type { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import '../src/styles.css';

initialize({ onUnhandledRequest: 'bypass', quiet: true });

export default {
  parameters: { layout: 'fullscreen' },
  loaders: [mswLoader],
} satisfies Preview;
