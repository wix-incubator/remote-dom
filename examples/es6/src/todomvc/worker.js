
import '../worker-setup';
import { createContainer } from '../../../../src/remote.js';
import React from 'react';
import ReactDOM from 'react-dom';
import TodoModel from "./components/todoModel";
import TodoApp from "./components/todoApp.jsx";

console.log('loading worker...');

var model = new TodoModel('react-todos');
const props = {model: model};

let renderElement;
let container = createContainer();
renderElement = props => ReactDOM.render(React.createElement(TodoApp, props), container)
model.subscribe(function() {
  renderElement(props);
});
renderElement(props);

console.log('loaded worker!');

