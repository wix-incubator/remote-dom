define(['react'], function (React) {
  "use strict";

  var App = React.createClass({
    displayName: "App",

    getInitialState: function getInitialState() {
      return {
        items: []
      };
    },

    addItem: function addItem(item) {
      this.setState({
        items: this.state.items.concat({
          text: item,
          done: false
        })
      });
    },
    
    deleteItem: function deleteItem(i) {
      var a = this.state.items;
      this.setState({
        items: a.slice(0, i).concat(a.slice(i + 1, a.length))
      });
    },

    toggleItem: function toggleItem(i, checked) {
      var a = this.state.items;
      var items = a.slice(0, i).concat({
        text: this.state.items[i].text,
        done: checked
      }).concat(a.slice(i + 1, a.length));

      this.setState({
        items: items
      });
    },

    moveItem: function moveItem(i, direction) {
      var items = this.state.items.slice(0);
      var swap = items[i + direction];
      if (swap) {
        items[i + direction] = items[i];
        items[i] = swap;
        this.setState({ items: items });
      }
    },

    renderList: function renderList(items) {
      var _this = this;

      if (items.length === 0) {
        return React.createElement(
          "blockquote",
          { className: "small" },
          "Add some todo items"
        );
      } else {
        return React.createElement(
          "ol",
          { className: "list-group" },
          items.map(function (item, i) {
            return React.createElement(TodoItem, {
              onToggle: _this.toggleItem,
              onDelete: _this.deleteItem,
              onMove: _this.moveItem,
              key: i, item: item, index: i });
            })
          );
        }
      },
      render: function render() {
        return React.createElement(
          "div",
          { className: "well" },
          React.createElement(
            "h3",
            { className: "text-center" },
            "TODO"
          ),
          this.renderList(this.state.items),
          React.createElement(TodoForm, { onAddItem: this.addItem }),
          React.createElement("hr", null),
          React.createElement(Clock, null)
        );
      }
    });

    var TodoForm = React.createClass({
      displayName: "TodoForm",

      getInitialState: function getInitialState() {
        return { text: '' };
      },
      onChange: function onChange(e) {
        this.setState({ text: e.target.value });
      },
      handleSubmit: function handleSubmit(e) {
        this.props.onAddItem(this.state.text || '<empty>');
        this.setState({
          text: ''
        });
        e.preventDefault();
      },
      render: function render() {
        return React.createElement(
          "form",
          { onSubmit: this.handleSubmit },
          React.createElement(
            "div",
            { className: "input-group" },
            React.createElement("input", { onChange: this.onChange, value: this.state.text, className: "form-control" }),
            React.createElement(
              "span",
              { className: "input-group-btn" },
              React.createElement(
                "button",
                { className: "btn btn-primary" },
                React.createElement("span", { className: "glyphicon glyphicon-plus" })
              )
            )
          ),
          React.createElement(
            "span",
            { className: "help-block text-right" },
            this.state.text ? this.state.text : '<empty>',
            "\xA0will be added to the list"
          )
        );
      }
    });
    var TodoItem = React.createClass({
      displayName: "TodoItem",

      onDelete: function onDelete() {
        this.props.onDelete(this.props.index);
      },

      onToggle: function onToggle(e) {
        this.props.onToggle(this.props.index, e.target.checked);
      },

      moveUp: function moveUp(e) {
        this.props.onMove(this.props.index, -1);
      },

      moveDown: function moveDown() {
        this.props.onMove(this.props.index, 1);
      },

      render: function render() {
        return React.createElement(
          "li",
          { className: "clearfix list-group-item" },
          React.createElement(
            "div",
            { className: "pull-right" },
            React.createElement("span", { onClick: this.moveUp, className: "glyphicon glyphicon-collapse-up" }),
            React.createElement("span", { onClick: this.moveDown, className: "glyphicon glyphicon-collapse-down" }),
            "\xA0\xA0",
            React.createElement("span", { onClick: this.onDelete, className: "glyphicon glyphicon-trash" })
          ),
          React.createElement("input", { type: "checkbox", onChange: this.onToggle, checked: this.props.item.done }),
          "\xA0\xA0",
          React.createElement(
            "span",
            { style: { textDecoration: this.props.item.done ? 'line-through' : '' } },
            this.props.item.text
          )
        );
      }
    });

    var Clock = React.createClass({
      displayName: "Clock",
      getInitialState: function getInitialState() {
        return {
          time: new Date(),
          closed: false
        };
      },
      componentDidMount: function componentDidMount() {
        var _this2 = this;

        this.timerHandle = setInterval(function () {
          _this2.setState({
            time: new Date()
          });
        }, 1000);
      },
      componentWillUnmount: function componentWillUnmount() {
        if (this.timerHandle) {
          clearInterval(this.timerHandle);
          delete this.timerHandle;
        }
      },

      closeTime: function closeTime() {
        this.setState({ closed: true });
        this.componentWillUnmount();
      },
      render: function render() {
        if (this.state.closed) {
          return React.createElement("div", null);
        } else {
          return React.createElement(
            "div",
            null,
            React.createElement(
              "span",
              null,
              "Current time: \xA0",
              React.createElement(
                "b",
                null,
                React.createElement(
                  "span",
                  null,
                  this.state.time.toString()
                )
              ),
              React.createElement(
                "button",
                { className: "close pull-right", onClick: this.closeTime },
                React.createElement(
                  "span",
                  null,
                  "\xD7"
                )
              )
            )
          );
        }
      }
    });

    return App;
  });
