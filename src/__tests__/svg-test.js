import testUtils from './testUtils';
import React from 'react';
import ReactDOM from 'react-dom';
import * as remoteDOM from '../remote';
import * as localDOM from '../local';

let domContainer, remoteContainer;
let counter = 0;
let env;

describe('svg tests', () => {
  beforeEach(() => {
    env = testUtils.setup();
    domContainer = env.jsdomDefaultView.document.createElement('div');
    const id = 'container_' + counter++;
    env.jsdomDefaultView.document.body.appendChild(domContainer);
    localDOM.createContainer(env.localQueue, domContainer, id);
    remoteContainer = remoteDOM.createContainer(id);
  });

  it('should support get height', done => {
    
    const expectFunc = (imgNode) => {
      const h = 1;
      imgNode.height = h;
      expect(imgNode.height).toBe(h);      
      done();
    };
    const statelessComp = () => (<svg ref={expectFunc}><path d="M150 0 L75 200 L225 200 Z" /></svg>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });

 
});
