# remote-dom AKA Virtual Virtual DOM

A tale of a library in two parts
LocalDOM - a very simple library that applies DOM manipulations it is fed via a channel on specific containers + sends events back
RemoteDOM - a minimal implementation of the write APIs DOM (createElement/createTextNode/addEventListeners etc...) which serializes the imperative commands invoked on it and sends it over a channel

Together they let you write to the a DOM that isn't local to your execution context in a way that should be mostly transparent to you so long as you don't actaully ever read from the DOM
This currently supports React rendering from WebWorkers for example, by simply providing a mounting point that is RemoteDOM container

