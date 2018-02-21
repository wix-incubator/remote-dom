import testUtils from './testUtils';
import React from 'react';
import ReactDOM from 'react-dom';
import * as remoteDOM from '../remote';
import * as localDOM from '../local';

let domContainer, remoteContainer;
let counter = 0;
let env;

describe('image tests', () => {
  beforeEach(() => {
    env = testUtils.setup();
    domContainer = env.jsdomDefaultView.document.createElement('div');
    const id = 'container_' + counter++;
    env.jsdomDefaultView.document.body.appendChild(domContainer);
    localDOM.createContainer(env.localQueue, domContainer, id);
    remoteContainer = remoteDOM.createContainer(id);
  });

  it('should support get src', done => {
    const src = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (imgNode) => {
      imgNode.src = src;
      expect(imgNode.src).toBe(src);
      done();
    };
    const statelessComp = () => (<img ref={expectFunc}></img>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });

  it('should support set src', done => {
    const sec = 'http://video.webmfiles.org/big-buck-bunny_trailer.webm';
    const expectFunc = (imgNode) => {
      const localImgNode = domContainer.firstChild;
      imgNode.src = sec;
      expect(localImgNode.src).toBe(sec);
      done();
    };
    const statelessComp = () => (<img ref={expectFunc}></img>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });
});
