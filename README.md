[![Build Status](https://travis-ci.org/wix/remote-dom.svg?branch=master)](https://travis-ci.org/wix/remote-dom)
[![Coverage Status](https://coveralls.io/repos/github/wix/remote-dom/badge.svg?branch=master)](https://coveralls.io/github/wix/remote-dom?branch=master)

# remote-dom AKA Virtual Virtual DOM

#LocalDOM
A simple library that applies DOM manipulations it is fed via a channel on specific containers + sends events back
#RemoteDOM
A minimal implementation of the write APIs DOM (createElement/createTextNode/addEventListeners etc...) which serializes the imperative commands invoked on it and sends it over a channel

Together they let you write to a DOM that isn't local to your execution context in a way that should be mostly transparent to you as long as you never read from the DOM
For example this currently supports React rendering from WebWorkers, by simply providing a mounting point i.e., a RemoteDOM container.

