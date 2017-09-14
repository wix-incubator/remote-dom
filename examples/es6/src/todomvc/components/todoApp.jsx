import React from "react";
import TodoItem from "./todoItem.jsx";
import TodoFooter from "./footer.jsx";

const ALL_TODOS = 'all';
const ACTIVE_TODOS =  'active';
const COMPLETED_TODOS = 'completed';
const ENTER_KEY = 13;

export default class TodoApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      nowShowing: ALL_TODOS,
      editing: null,
      newTodo: ''
    };

    this.handleNewTodoKeyDown = this.handleNewTodoKeyDown.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleAll = this.toggleAll.bind(this);
    this.toggle = this.toggle.bind(this);
    this.edit = this.edit.bind(this);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.clearCompleted = this.clearCompleted.bind(this);
  }

  handleChange(event) {
    console.log('handleChange', event);
    this.setState({newTodo: event.target.value});
  }

  handleNewTodoKeyDown(event) {
    console.log('newTodoKeyDown');
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    event.preventDefault();

    var val = this.state.newTodo.trim();

    if (val) {
      this.props.model.addTodo(val);
      this.setState({newTodo: ''});
    }
  }

  toggleAll(event) {
    var checked = event.target.checked;
    this.props.model.toggleAll(checked);
  }

  toggle(todoToToggle) {
    this.props.model.toggle(todoToToggle);
  }

  destroy(todo) {
    this.props.model.destroy(todo);
  }

  edit(todo) {
    this.setState({editing: todo.id});
  }

  save(todoToSave, text) {
    this.props.model.save(todoToSave, text);
    this.setState({editing: null});
  }

  cancel() {
    this.setState({editing: null});
  }

  clearCompleted() {
    this.props.model.clearCompleted();
  }

  render() {
    var footer;
    var main;
    var todos = this.props.model.todos;

    var shownTodos = todos.filter(function (todo) {
      switch (this.state.nowShowing) {
        case ACTIVE_TODOS:
          return !todo.completed;
        case COMPLETED_TODOS:
          return todo.completed;
        default:
          return true;
      }
    }, this);

    var todoItems = shownTodos.map(function (todo) {
      return (
        <TodoItem
        key={todo.id}
        todo={todo}
        onToggle={this.toggle.bind(this, todo)}
        onDestroy={this.destroy.bind(this, todo)}
        onEdit={this.edit.bind(this, todo)}
        editing={this.state.editing === todo.id}
        onSave={this.save.bind(this, todo)}
        onCancel={this.cancel}
        />
        );
    }, this);

    var activeTodoCount = todos.reduce(function (accum, todo) {
      return todo.completed ? accum : accum + 1;
    }, 0);

    var completedCount = todos.length - activeTodoCount;

    if (activeTodoCount || completedCount) {
      footer =
        <TodoFooter
        count={activeTodoCount}
        completedCount={completedCount}
        nowShowing={this.state.nowShowing}
        onClearCompleted={this.clearCompleted}
        onLink={showing => this.setState({nowShowing: showing})}
        />;
    }

    if (todos.length) {
      main = (
        <section className="main">
          <input
          className="toggle-all"
          type="checkbox"
          onChange={this.toggleAll}
          checked={activeTodoCount === 0}
          />
          <ul className="todo-list">
							{todoItems}
          </ul>
        </section>
        );
    }

    return (
      <div>
        <header className="header">
          <h1>todos</h1>
          <input
          className="new-todo"
          placeholder="What needs to be done?"
          value={this.state.newTodo}
          onKeyDown={this.handleNewTodoKeyDown}
          onChange={this.handleChange}
          autoFocus={true}
          />
        </header>
					{main}
					{footer}
      </div>
      );
  }
}
