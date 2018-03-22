import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Router } from 'react-router-dom';
import { castArray } from './utils';
import { createRoutes, RoutePropType } from './Route4Compat';

class Router4Compat extends React.Component {
  componentDidCatch(error, info) {
    const { onError } = this.props;
    if (onError) {
      onError(error);
    }
  }
  render() {
    const { routes, history, onError } = this.props;
    return (
      <Router history={history}>
        <Switch>
          { createRoutes(castArray(routes), onError) }
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

export default Router4Compat;
