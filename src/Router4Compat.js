/* eslint-disable no-param-reassign */
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Router, Route } from 'react-router-dom';
import { AsyncComponent } from 'react-async-wrapper';
import { castArray } from './utils';
import Route4Compat from './Route4Compat';

const createState = (match, location, history) => ({
  match,
  location,
  history,
  ...location,
});

const createPromiseFromCallback = (state, callbackFunc) => new Promise((resolve, reject) => {
  callbackFunc(state, (err, result) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  });
});

const createRoutePropertyPromise = (state, staticValue, dynamicValue) => {
  if (staticValue) {
    return staticValue;
  }
  if (dynamicValue) {
    return createPromiseFromCallback(state, dynamicValue);
  }
  return null;
};

const createRoutePromise = (state, route) => {
  const {
    component,
    getComponent,
    indexRoute,
    getIndexRoute,
    childRoutes,
    getChildRoutes,
  } = route;
  return Promise.all([
    createRoutePropertyPromise(state, component, getComponent),
    createRoutePropertyPromise(state, indexRoute, getIndexRoute),
    createRoutePropertyPromise(state, childRoutes, getChildRoutes),
  ]).then(([comp, ir, cr]) => ({
    ...route,
    component: comp,
    indexRoute: ir,
    childRoutes: cr,
  }));
};

export const createRoutes = (routes, onError) => routes.map((route) => {
  const {
    path,
    component,
    getComponent,
    indexRoute,
    getIndexRoute,
    childRoutes,
    getChildRoutes,
    onEnter,
    exact,
  } = route;
  if (!component && !getComponent && !onEnter) {
    return null;
  }
  return (
    <Route
      key={path || 0}
      path={path}
      exact={!!exact}
      // eslint-disable-next-line react/no-children-prop
      children={
        (props) => {
          const { match, location, history } = props;
          const routeState = createState(match, location, history);
          if (component
            && (indexRoute || !getIndexRoute)
            && (childRoutes || !getChildRoutes)
            && (!onEnter || onEnter.length < 3)) {
            if (onEnter) {
              onEnter(routeState, history.replace);
            }
            return <Route4Compat {...props} state={routeState} route={route} onError={onError} />;
          }
          const asyncJobs = [];
          if (onEnter) {
            if (onEnter.length >= 3) {
              asyncJobs.push(() => new Promise((resolve, reject) => {
                onEnter(routeState, history.replace, (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              }));
            } else {
              onEnter(routeState, history.replace);
            }
          }
          return (
            <AsyncComponent
              onError={onError}
              asyncJobs={asyncJobs}
              asyncProps={{
                route: () => createRoutePromise(routeState, route),
              }}
            >
              <Route4Compat {...props} state={routeState} onError={onError} />
            </AsyncComponent>
          );
        }
      }
    />
  );
}).filter(v => v);

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

export const RoutePropType = PropTypes.shape({
  path: PropTypes.string,
  component: PropTypes.func,
  getComponent: PropTypes.func,
  indexRoute: PropTypes.object,
  getIndexRoute: PropTypes.func,
  childRoutes: PropTypes.arrayOf(PropTypes.object),
  getChildRoutes: PropTypes.func,
  exact: PropTypes.bool,
  strict: PropTypes.bool,
  sensitive: PropTypes.bool,
});

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
