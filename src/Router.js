import React from 'react';
import PropTypes from 'prop-types';
import Switch from 'react-router/Switch';
import Router from 'react-router/Router';
import { castArray } from './utils';
import { createRoutes, RoutePropType } from './Route';

class Router4Compat extends React.Component {
  constructor(props, context) {
    // noinspection JSCheckFunctionSignatures
    super(props, context);
    this.state = {
      routes: [],
    };
  }
  getChildContext() {
    return {
      routesCompat: this.state.routes,
      routesUpdater: this.routesUpdater,
    };
  }
  routesUpdater = (routes) => {
    this.setState({
      routes,
    });
  };
  render() {
    const { routes, history, onError } = this.props;
    return (
      <Router history={history}>
        <Switch>
          { createRoutes(castArray(routes), onError, []) }
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

Router4Compat.childContextTypes = {
  routesCompat: PropTypes.arrayOf(RoutePropType),
  routesUpdater: PropTypes.func,
};

export default Router4Compat;
