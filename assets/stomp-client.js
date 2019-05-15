'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _sockjsClient = require('sockjs-client');

var _sockjsClient2 = _interopRequireDefault(_sockjsClient);

var _stompjs = require('stompjs');

var _stompjs2 = _interopRequireDefault(_stompjs);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * React component for SockJS-client with STOMP messaging protocol.
 *
 * @version 4.0.0
 * @author [lahsivjar] (https://github.com/lahsivjar)
 * @see {@link https://stomp.github.io/|STOMP}
 * @see {@link https://github.com/sockjs/sockjs-client|StompJS}
 */
var SockJsClient = function (_React$Component) {
  _inherits(SockJsClient, _React$Component);

  function SockJsClient(props) {
    _classCallCheck(this, SockJsClient);

    var _this = _possibleConstructorReturn(this, (SockJsClient.__proto__ || Object.getPrototypeOf(SockJsClient)).call(this, props));

    _this._initStompClient = function () {
      // Websocket held by stompjs can be opened only once
      _this.client = _stompjs2.default.over(new _sockjsClient2.default(_this.props.url, null, _this.props.options));

      _this.client.heartbeat.outgoing = _this.props.heartbeat;
      _this.client.heartbeat.incoming = _this.props.heartbeat;

      if (Object.keys(_this.props).includes('heartbeatIncoming')) {
        _this.client.heartbeat.incoming = _this.props.heartbeatIncoming;
      }
      if (Object.keys(_this.props).includes('heartbeatOutgoing')) {
        _this.client.heartbeat.outgoing = _this.props.heartbeatOutgoing;
      }
      if (!_this.props.debug) {
        _this.client.debug = function () {};
      }
    };

    _this._cleanUp = function () {
      _this.setState({ connected: false });
      _this.retryCount = 0;
      _this.subscriptions.clear();
    };

    _this._log = function (msg) {
      if (_this.props.debug) {
        console.log(msg);
      }
    };

    _this._subscribe = function (topic) {
      if (!_this.subscriptions.has(topic)) {
        var sub = _this.client.subscribe(topic, function (msg) {
          _this.props.onMessage(_this._processMessage(msg.body), topic);
        }, _lodash2.default.slice(_this.props.subscribeHeaders));
        _this.subscriptions.set(topic, sub);
      }
    };

    _this._processMessage = function (msgBody) {
      try {
        return JSON.parse(msgBody);
      } catch (e) {
        return msgBody;
      }
    };

    _this._unsubscribe = function (topic) {
      var sub = _this.subscriptions.get(topic);
      sub.unsubscribe();
      _this.subscriptions.delete(topic);
    };

    _this._connect = function () {
      _this._initStompClient();
      _this.client.connect(_this.props.headers, function (frame) {
        _this.setState({ connected: true });
        localStorage.setItem("connectionId", frame.headers['user-name']);
        _this.props.topics.forEach(function (topic) {
          _this._subscribe(topic);
        });
        _this.props.onConnect();
      }, function (error) {
        if (error) {
          _this._log(error.stack);
        }
        if (_this.state.connected) {
          _this._cleanUp();
          // onDisconnect should be called only once per connect
          _this.props.onDisconnect();
        }
        if (_this.props.autoReconnect && !_this.state.explicitDisconnect) {
          _this._timeoutId = setTimeout(_this._connect, _this.props.getRetryInterval(_this.retryCount++));
        }
      });
    };

    _this.connect = function () {
      _this.setState({ explicitDisconnect: false });
      if (!_this.state.connected) {
        _this._connect();
      }
    };

    _this.disconnect = function () {
      // On calling disconnect explicitly no effort will be made to reconnect
      // Clear timeoutId in case the component is trying to reconnect
      if (_this._timeoutId) {
        clearTimeout(_this._timeoutId);
        _this._timeoutId = null;
      }
      _this.setState({ explicitDisconnect: true });
      if (_this.state.connected) {
        _this.subscriptions.forEach(function (subid, topic) {
          _this._unsubscribe(topic);
        });
        _this.client.disconnect(function () {
          _this._cleanUp();
          _this.props.onDisconnect();
          _this._log('Stomp client is successfully disconnected!');
        });
      }
    };

    _this.sendMessage = function (topic, msg) {
      var opt_headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (_this.state.connected) {
        _this.client.send(topic, opt_headers, msg);
      } else {
        throw new Error('Send error: SockJsClient is disconnected');
      }
    };

    _this.state = {
      connected: false,
      // False if disconnect method is called without a subsequent connect
      explicitDisconnect: false
    };

    _this.subscriptions = new Map();
    _this.retryCount = 0;
    return _this;
  }

  _createClass(SockJsClient, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._connect();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.disconnect();
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      return false;
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _this2 = this;

      if (this.state.connected) {
        // Subscribe to new topics
        _lodash2.default.difference(nextProps.topics, this.props.topics).forEach(function (newTopic) {
          _this2._log('Subscribing to topic: ' + newTopic);
          _this2._subscribe(newTopic);
        });

        // Unsubscribe from old topics
        _lodash2.default.difference(this.props.topics, nextProps.topics).forEach(function (oldTopic) {
          _this2._log('Unsubscribing from topic: ' + oldTopic);
          _this2._unsubscribe(oldTopic);
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      return null;
    }

    /**
     * Connect to the server if not connected. Under normal circumstances component
     * will automatically try to connect to server. This method is mostly useful
     * after component is explicitly disconnected via {@link SockJsClient#disconnect}.
     *
     * @public
     */


    /**
     * Disconnect STOMP client and disable all reconnect.
     *
     * @public
     */


    /**
     * Send message to the specified topic.
     *
     * @param {string} topic target topic to send message
     * @param {string} msg message to send
     * @param {Object} [opt_headers={}] additional headers for underlying STOMP client
     * @public
     */

  }]);

  return SockJsClient;
}(_react2.default.Component);

SockJsClient.defaultProps = {
  onConnect: function onConnect() {},
  onDisconnect: function onDisconnect() {},
  getRetryInterval: function getRetryInterval(count) {
    return 1000 * count;
  },
  options: {},
  headers: {},
  subscribeHeaders: {},
  autoReconnect: true,
  debug: false,
  heartbeat: 10000
};
SockJsClient.propTypes = {
  /**
   * HTTP URL of the endpoint to connect.
   */
  url: _propTypes2.default.string.isRequired,
  /**
   * Additional options to pass to the underlying SockJS constructor.
   *
   * @see [SockJS-options](https://github.com/sockjs/sockjs-client#sockjs-client-api)
   */
  options: _propTypes2.default.object,
  /**
   * Array of topics to subscribe to.
   */
  topics: _propTypes2.default.array.isRequired,
  /**
   * Callback after connection is established.
   */
  onConnect: _propTypes2.default.func,
  /**
   * Callback after connection is lost.
   */
  onDisconnect: _propTypes2.default.func,
  /**
   * Gets called to find the time interval for next retry. Defaults to a function returing retryCount seconds.
   *
   * @param {number} retryCount number of retries for the current disconnect
   */
  getRetryInterval: _propTypes2.default.func,
  /**
   * Callback when a message is recieved.
   *
   * @param {(string|Object)} msg message received from server, if JSON format then object
   * @param {string} topic the topic on which the message was received
   */
  onMessage: _propTypes2.default.func.isRequired,
  /**
   * Headers that will be passed to the server or broker with STOMP's connection frame.
   */
  headers: _propTypes2.default.object,
  /**
   * Headers that will be passed when subscribing to a destination.
   */
  subscribeHeaders: _propTypes2.default.object,
  /**
   * Should the client try to automatically connect in an event of disconnection.
   */
  autoReconnect: _propTypes2.default.bool,
  /**
   * Enable debugging mode.
   */
  debug: _propTypes2.default.bool,
  /**
   * Number of milliseconds to send and expect heartbeat messages.
   */
  heartbeat: _propTypes2.default.number,
  /**
   * Number of milliseconds to expect heartbeat messages
   */
  heartbeatIncoming: _propTypes2.default.number,
  /**
   * Number of milliseconds to send heartbeat messages
   */
  heartbeatOutgoing: _propTypes2.default.number
};
exports.default = SockJsClient;