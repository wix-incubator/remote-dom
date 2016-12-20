define(['react'], function (React) {
  "use strict";

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var getData = function getData(rows) {
    // generate some dummy data
    var data = {
      start_at: new Date().getTime() / 1000,
      databases: {}
    };

    for (var i = 1; i <= rows; i++) {
      data.databases["cluster" + i] = {
        queries: []
      };

      data.databases["cluster" + i + "slave"] = {
        queries: []
      };
    }

    Object.keys(data.databases).forEach(function (dbname) {
      var info = data.databases[dbname];

      var r = Math.floor(Math.random() * 10 + 1);
      for (var i = 0; i < r; i++) {
        var q = {
          canvas_action: null,
          canvas_context_id: null,
          canvas_controller: null,
          canvas_hostname: null,
          canvas_job_tag: null,
          canvas_pid: null,
          elapsed: Math.random() * 15,
          query: "SELECT blah FROM something",
          waiting: Math.random() < 0.5
        };

        if (Math.random() < 0.2) {
          q.query = "<IDLE> in transaction";
        }

        if (Math.random() < 0.1) {
          q.query = "vacuum";
        }

        info.queries.push(q);
      }

      info.queries = info.queries.sort(function (a, b) {
        return b.elapsed - a.elapsed;
      });
    });

    return data;
  };

  var Query = function (_React$Component) {
    _inherits(Query, _React$Component);

    function Query() {
      _classCallCheck(this, Query);

      return _possibleConstructorReturn(this, (Query.__proto__ || Object.getPrototypeOf(Query)).apply(this, arguments));
    }

    _createClass(Query, [{
      key: "lpad",
      value: function lpad(padding, toLength, str) {
        return padding.repeat((toLength - str.length) / padding.length).concat(str);
      }
    }, {
      key: "formatElapsed",
      value: function formatElapsed(value) {
        var str = parseFloat(value).toFixed(2);
        if (value > 60) {
          minutes = Math.floor(value / 60);
          comps = (value % 60).toFixed(2).split('.');
          seconds = this.lpad('0', 2, comps[0]);
          ms = comps[1];
          str = minutes + ":" + seconds + "." + ms;
        }
        return str;
      }
    }, {
      key: "render",
      value: function render() {
        var className = "elapsed short";
        if (this.props.elapsed >= 10.0) {
          className = "elapsed warn_long";
        } else if (this.props.elapsed >= 1.0) {
          className = "elapsed warn";
        }

        return React.createElement(
          "td",
          { className: "Query " + className },
          this.props.elapsed ? this.formatElapsed(this.props.elapsed) : '-',
          React.createElement(
            "div",
            { className: "popover left" },
            React.createElement(
              "div",
              { className: "popover-content" },
              this.props.query
            ),
            React.createElement("div", { className: "arrow" })
          )
        );
      }
    }]);

    return Query;
  }(React.Component);

  var Database = function (_React$Component2) {
    _inherits(Database, _React$Component2);

    function Database() {
      _classCallCheck(this, Database);

      return _possibleConstructorReturn(this, (Database.__proto__ || Object.getPrototypeOf(Database)).apply(this, arguments));
    }

    _createClass(Database, [{
      key: "sample",
      value: function sample(queries, time) {
        var topFiveQueries = queries.slice(0, 5);
        while (topFiveQueries.length < 5) {
          topFiveQueries.push({ query: "" });
        }

        var _queries = [];
        topFiveQueries.forEach(function (query, index) {
          _queries.push(React.createElement(Query, {
            key: index,
            query: query.query,
            elapsed: query.elapsed
          }));
        });

        var countClassName = "label";
        if (queries.length >= 20) {
          countClassName += " label-important";
        } else if (queries.length >= 10) {
          countClassName += " label-warning";
        } else {
          countClassName += " label-success";
        }

        return [React.createElement(
          "td",
          { className: "query-count", key: "1" },
          React.createElement(
            "span",
            { className: countClassName },
            queries.length
          )
        ), _queries];
      }
    }, {
      key: "render",
      value: function render() {
        var lastSample = this.props.samples[this.props.samples.length - 1];

        return React.createElement(
          "tr",
          { key: this.props.dbname },
          React.createElement(
            "td",
            { className: "dbname" },
            this.props.dbname
          ),
          this.sample(lastSample.queries, lastSample.time)
        );
      }
    }]);

    return Database;
  }(React.Component);

  ;

  var DBMon = React.createClass({
    displayName: "DBMon",

    getInitialState: function getInitialState() {
      return { databases: [] };
    },
    loadSamples: function loadSamples() {
      var newData = getData(this.props.rows || 50);
      Object.keys(newData.databases).forEach(function (dbname) {
        var sampleInfo = newData.databases[dbname];
        if (!this.state.databases[dbname]) {
          this.state.databases[dbname] = {
            name: dbname,
            samples: []
          };
        }

        var samples = this.state.databases[dbname].samples;
        samples.push({
          time: newData.start_at,
          queries: sampleInfo.queries
        });
        if (samples.length > 5) {
          samples.splice(0, samples.length - 5);
        }
      }.bind(this));

      this.setState(this.state);
      //setTimeout(function(){this.setState(this.state)}.bind(this), 100);
      setTimeout(this.loadSamples); //this.props.timeout|| 20);
    },

    componentDidMount: function componentDidMount() {
      this.loadSamples();
    },

    render: function render() {
      var databases = [];
      Object.keys(this.state.databases).forEach(function (dbname) {
        databases.push(React.createElement(Database, { key: dbname,
          dbname: dbname,
          samples: this.state.databases[dbname].samples }));
        }.bind(this));

        return React.createElement(
          "div",
          null,
          React.createElement(
            "table",
            { className: "table table-striped latest-data" },
            React.createElement(
              "tbody",
              null,
              databases
            )
          )
        );
      }
    });
    return DBMon;
  });
