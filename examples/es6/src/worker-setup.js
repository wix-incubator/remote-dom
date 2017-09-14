// This file must be loaded *before* React.
// Otherwise React will not know we have a proper DOM API, which
// will cause weird behaviour (e.g. onChange not using input events).

import { window, document, setChannel } from '../../../src/remote.js';

self.document = document;
self.window = window;
setChannel(self);
