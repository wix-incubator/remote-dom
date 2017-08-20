import testUtils from './testUtils';

const Vue = require('vue/dist/vue');

const localDOM = require('../local');
const remoteDOM = require('../remote');

const windowOverrides = {};

let domContainer, remoteContainer, id;
let counter = 0;
let env;

  beforeEach(() => {
    env = testUtils.setup(windowOverrides, localDOM, remoteDOM);
    domContainer = env.jsdomDefaultView.document.createElement('div');
    id = 'container_' + counter++;
    env.jsdomDefaultView.document.body.appendChild(domContainer);
    localDOM.createContainer(env.localQueue, domContainer, id);
    remoteContainer = remoteDOM.createContainer(id);
  });

it('vue basics', () => {
  const insideContainer = remoteDOM.document.createElement('div');
  remoteContainer.appendChild(insideContainer);
  const inst = new Vue({
    el: insideContainer,
    data: {name: 'Vue.js'},
    render: function (h) {
      return h('h1',{}, ['Hi from:', this.name]);
    }
  });
  inst.$mount(insideContainer);
  expect(domContainer.innerHTML).toEqual('<h1>Hi from:Vue.js</h1>');
});

it('vue basics - update data', (done) => {
  const insideContainer = remoteDOM.document.createElement('div');
  remoteContainer.appendChild(insideContainer);
  const data = {name: 'Vue.js'};
  const inst = new Vue({
    el: insideContainer,
    data: data,
    render: function (h) {
      return h('h1',{}, ['Hi from:', this.name]);
    }
  });
  inst.$mount(insideContainer);
  expect(domContainer.innerHTML).toEqual('<h1>Hi from:Vue.js</h1>');
  data.name = 'Vue.js inside remoteDOM';
  Vue.nextTick(() => {
    expect(domContainer.innerHTML).toEqual('<h1>Hi from:Vue.js inside remoteDOM</h1>');
    done();
  });
});

it('vue basics - events', (done) => {
  const insideContainer = remoteDOM.document.createElement('div');
  remoteContainer.appendChild(insideContainer);
  const data = {counter: 0};
  const inst = new Vue({
    el: insideContainer,
    data: data,
    render: function (h) {
      return h('h1',{on :{click: this.clickHandler}}, ['Clicked ', this.counter]);
    },
    methods: {
      clickHandler: function clickHandler() {
        this.counter++;
      }
    }
  });
  inst.$mount(insideContainer);
  domContainer.children[0].click();
  Vue.nextTick(() => {
    expect(domContainer.innerHTML).toEqual('<h1>Clicked 1</h1>');
    done();
  });
});
