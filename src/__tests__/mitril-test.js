import testUtils from './testUtils';

const localDOM = require('../local');
const remoteDOM = require('../remote');

const windowOverrides = {};

let domContainer, remoteContainer, id;
let counter = 0;
let env;

const m = require('mithril');

beforeAll(() => {
  env = testUtils.setup(windowOverrides, localDOM, remoteDOM);
});

beforeEach(() => {
  domContainer = env.jsdomDefaultView.document.createElement('div');
  id = 'container_' + counter++;
  env.jsdomDefaultView.document.body.appendChild(domContainer);
  localDOM.createContainer(env.localQueue, domContainer, id);
  remoteContainer = remoteDOM.createContainer(id);
});

it('mithril basics', () => {
  const Hello = {
    view: function() {
      return m('h1', { class: 'title' }, 'Hi from:mitril');
    }
  };
  m.mount(remoteContainer, Hello);
  expect(domContainer.innerHTML).toEqual('<h1 class="title">Hi from:mitril</h1>');
});

it('mitril basics - events', done => {
  let count = 0;
  const Hello = {
    view: function() {
      return m('div', [
        m('h1', { class: 'title' }, 'My first app'),
        m(
          'button',
          {
            onclick: function() {
              count++;
            }
          },
          count + ' clicks'
        )
      ]);
    }
  };
  m.mount(remoteContainer, Hello);
  setTimeout(() => {
    domContainer.children[0].children[1].click();
    expect(domContainer.innerHTML).toEqual('<div><h1 class="title">My first app</h1><button>1 clicks</button></div>');
    done();
  }, 100);
});
