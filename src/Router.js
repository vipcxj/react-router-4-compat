import React from 'react';
import PropTypes from 'prop-types';
import Switch from 'react-router/Switch';
import Router from 'react-router/Router';
import { castArray } from './utils';
import { createRoutes, RoutePropType } from './Route';

class Router4Compat extends React.Component {
  constructor(props, ...args) {
    // noinspection JSCheckFunctionSignatures
    super(props, ...args);
    this.routes = castArray(props.routes);
  }
  getChildContext() {
    return {
      routes: this.routes,
    };
  }
  componentWillReceiveProps(nextProps, nextContext) {
    this.routes = nextProps.routes;
  }
  componentDidCatch(error, info) {
    const { onError } = this.props;
    if (onError) {
      onError(error);
    }
  }
  render() {
    const { history, onError } = this.props;
    const root = this.routes;
    return (
      <Router history={history}>
        <Switch>
          { createRoutes(this.routes, onError, root) }
        </Switch>
      </Router>
    );
  }
}

Router4Compat.propTypes = {
  history: PropTypes.object.isRequired,
  routes: PropTypes.oneOfType([RoutePropType, PropTypes.arrayOf(RoutePropType)]),
  onError: PropTypes.func,
};

Router4Compat.defaultProps = {
  routes: [],
  onError: () => null,
};

Router4Compat.contextTypes = {
  routes: PropTypes.array,
};

Router4Compat.childContextTypes = {
  routes: PropTypes.array,
};

export default Router4Compat;
