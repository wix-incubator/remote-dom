import testUtils from './testUtils';

import * as remoteDOM from '../remote';
import * as localDOM from '../local';

const windowOverrides = {
  screen: {
    width: 100,
    height: 200,
    orientation: {
      angle: 0,
      type: 'test-type'
    }
  },
  devicePixelRatio: 2,
  innerWidth: 50,
  innerHeight: 60,
  addEventListener: jest.fn()
};

const documentOverrides = {
  body: {
    clientWidth: 0
  }
};

let domContainer,remoteContainer;
let counter = 0;
let env;
let cb;

function asyncTimeout (cb) {
  setTimeout(cb, 3000);
}

function flushQueue() {
  jest.runAllTimers();
}

beforeEach(() => {
  cb = jest.fn();
  env = testUtils.setup(windowOverrides, documentOverrides, asyncTimeout);
  domContainer = env.jsdomDefaultView.document.createElement('div');
  const id = 'container_' + counter++;
  env.jsdomDefaultView.document.body.appendChild(domContainer);
  localDOM.createContainer(env.localQueue, domContainer, id, cb);
  remoteContainer = remoteDOM.createContainer(id);
});

describe('create container callback', () => {

  jest.useFakeTimers();

  it('should trigger local callback upon append child', () => {
    const div = remoteDOM.document.createElement('div');
    remoteContainer.appendChild(div);
    flushQueue();

    expect(cb).toHaveBeenCalled();
  });

  it('should trigger container callback once upon multiple changes', () => {
    const div = remoteDOM.document.createElement('div');
    const img = remoteDOM.document.createElement('img');

    remoteContainer.appendChild(div);
    div.setAttribute('id', 'some_id');
    remoteContainer.appendChild(img);
    img.setAttribute('src', 'src');
    flushQueue();

    expect(cb.mock.calls.length).toBe(1);
  });

  it('should trigger container callback once on every flush with changes on the container', () => {
    const div = remoteDOM.document.createElement('div');
    const img = remoteDOM.document.createElement('img');

    remoteContainer.appendChild(div);
    flushQueue();

    div.setAttribute('id', 'some_id');
    flushQueue();

    remoteContainer.appendChild(img);
    img.setAttribute('src', 'src');
    flushQueue();

    expect(cb.mock.calls.length).toBe(3);
  });

  it('should trigger only relevant container callback', () => {
    const secondCb = jest.fn();
    const anotherDomContainer = env.jsdomDefaultView.document.createElement('div');
    env.jsdomDefaultView.document.body.appendChild(anotherDomContainer);
    localDOM.createContainer(env.localQueue, anotherDomContainer, 'second_container', secondCb);
    const secondContainer = remoteDOM.createContainer('second_container');

    flushQueue();
    secondCb.mockReset();
    cb.mockReset();

    const div = remoteDOM.document.createElement('div');
    remoteContainer.appendChild(div);
    flushQueue();

    expect(cb).toHaveBeenCalled();
    expect(secondCb).not.toHaveBeenCalled();

    cb.mockReset();

    const div2 = remoteDOM.document.createElement('div');
    secondContainer.appendChild(div2);
    flushQueue();

    expect(cb).not.toHaveBeenCalled();
    expect(secondCb).toHaveBeenCalled();
  });

  it('should trigger container callback upon change on child of child (which means the host id is passed recursively down the DOM)', () => {
    const div = remoteDOM.document.createElement('div');
    const div1 = remoteDOM.document.createElement('div');
    const div2 = remoteDOM.document.createElement('div');

    div1.appendChild(div2);
    div.appendChild(div1);
    remoteContainer.appendChild(div);
    flushQueue();

    cb.mockReset();
    expect(cb.mock.calls.length).toBe(0);

    div2.setAttribute('id', 'some_id');
    flushQueue();

    expect(cb).toHaveBeenCalled();
  });
});