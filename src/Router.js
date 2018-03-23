import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Router } from 'react-router-dom';
import { castArray } from './utils';
import { createRoutes, RoutePropType } from './Route';

class Router4Compat extends React.Component {
  getChildContext() {
    return {
      routes: this.props.routes,
    };
  }
  componentDidCatch(error, info) {
    const { onError } = this.props;
    if (onError) {
      onError(error);
    }
  }
  render() {
    const { routes, history, onError } = this.props;
    const root = castArray(routes);
    return (
      <Router history={history}>
        <Switch>
          { createRoutes(castArray(routes), onError, root) }
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
  routes: PropTypes.object,
};

Router4Compat.childContextTypes = {
  routes: PropTypes.object,
};

export default Router4Compat;
