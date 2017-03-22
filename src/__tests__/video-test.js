import React from 'react';
import ReactDOM from 'react-dom';
import * as remoteDOM from '../remote';
import * as localDOM from '../local';
import testUtils from './testUtils';

let domContainer, remoteContainer;
let counter = 0;
let env;

describe('video tests', () => {
  beforeEach((done) => {
    env = testUtils.setup();
    domContainer = env.jsdomDefaultView.document.createElement('div');
    const id = 'container_' + counter++;
    env.jsdomDefaultView.document.body.appendChild(domContainer);
    localDOM.createContainer(env.localQueue, domContainer, id);
    remoteDOM.createContainer(id).then(container => {
      remoteContainer = container;
      done();
    });
  });

  it('should support get src', done => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (videoNode) => {
      videoNode.src = vidSrc;
      expect(videoNode.src).toBe(vidSrc);
      done();
    };
    const statelessComp = () => (<video ref={expectFunc}></video>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });

  it('should support set src', done => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (videoNode) => {
      const localVideoElement = domContainer.firstChild;
      videoNode.src = vidSrc;
      expect(localVideoElement.src).toBe(vidSrc);
      done();
    };
    const statelessComp = () => (<video ref={expectFunc}></video>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });

  it('should support pause', done => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (videoNode) => {
      const localVideoElement = domContainer.firstChild;
      localVideoElement.pause = jest.fn();
      videoNode.pause();
      expect(localVideoElement.pause).toHaveBeenCalled();
      done();
    };
    const statelessComp = (props) => (<video src={props.src} ref={expectFunc}></video>);
    ReactDOM.render(React.createElement(statelessComp, {src: vidSrc}), remoteContainer);
  });

  it('should support play', done => {
    const vidSrc = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (videoNode) => {
      const localVideoElement = domContainer.firstChild;
      localVideoElement.play = jest.fn();
      videoNode.play();
      expect(localVideoElement.play).toHaveBeenCalled();
      done();
    };
    const statelessComp = (props) => (<video src={props.src} ref={expectFunc}></video>);
    ReactDOM.render(React.createElement(statelessComp, {src: vidSrc}), remoteContainer);
  });
});
