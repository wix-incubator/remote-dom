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

  it('should set attributes', done => {
    
    const expectFunc = (svgNode) => {
      const value = "200";
      const attribute = "width";
      const localSvgNode = domContainer.firstChild;
      svgNode.setAttribute(attribute, value);

      expect(localSvgNode.getAttribute(attribute)).toBe(value);      
      done();
    };
    const statelessComp = () => (<svg ref={expectFunc}><path d="M150 0 L75 200 L225 200 Z" /></svg>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });

  it('should set add children', done => {
    
    const expectFunc = (svgNode) => {
            
      expect(svgNode.tagName).toBe("svg");
      expect(svgNode.children[0].tagName).toBe("path");
      expect(svgNode.children[1].tagName).toBe("circle");
      done();
    };
    const statelessComp = () => (<svg ref={expectFunc}><path d="M150 0 L75 200 L225 200 Z" /><circle/></svg>);
    ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  });
});
