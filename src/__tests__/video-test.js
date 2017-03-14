const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');
const testUtils = require('./testUtils');

let domContainer, remoteContainer, localContainer;
let counter = 0;

beforeEach(() => {
    domContainer = testUtils.jsdomDefaultView.document.createElement('div');
    const id = 'container_' + counter++;
    testUtils.jsdomDefaultView.document.body.appendChild(domContainer);
    localContainer = localDOM.createContainer(testUtils.localQueue, domContainer, id);
    remoteContainer = remoteDOM.createContainer(id);
});


it('should support get src', () => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm'
    const statelessComp = (props) => (<video src={props.vidSrc}></video>);
    ReactDOM.render(React.createElement(statelessComp, {vidSrc}), remoteContainer)
    const localVideoElement = domContainer.firstChild
    expect(localVideoElement.src).toBe(vidSrc)
});

it('should support set src', () => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm'
    const statelessComp = (props) => (<video src={props.vidSrc}></video>);
    ReactDOM.render(React.createElement(statelessComp, {vidSrc}), remoteContainer)
    const localVideoElement = domContainer.firstChild
    expect(localVideoElement.src).toBe(vidSrc)
});


it('should implement pause on the remote side', () => {
    const statelessComp = (props) => (<video src={props.vidSrc}></video>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer)
    const remoteVideoElement = remoteContainer.firstChild
    expect('pause' in remoteVideoElement).toBeTruthy()
});
