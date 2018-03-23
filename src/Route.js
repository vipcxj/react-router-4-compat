import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, matchPath } from 'react-router-dom';
import { AsyncComponent } from 'react-async-wrapper';
import { mapValues, assignWith, some } from './utils';

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

export const createRoutes = (routes, onError, root) => routes.map((route) => {
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
            return <Route4Compat {...props} state={routeState} route={route} routes={root} onError={onError} />;
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
              <Route4Compat {...props} state={routeState} routes={root} onError={onError} />
            </AsyncComponent>
          );
        }
      }
    />
  );
}).filter(v => v);

const makePath = (base, path) => `${base === '/' ? '' : base}/${path || ''}`;

class Route4Compat extends React.Component {
  render() {
    const {
      route,
      routes: root,
      state,
      onError,
      ...rest
    } = this.props;
    const {
      path,
      component: Comp,
      indexRoute,
    } = route;
    if (!Comp) {
      return null;
    }
    let { childRoutes } = route;
    if (some(childRoutes, childRoute => !childRoute.components && childRoute.getComponents)) {
      // noinspection RequiredAttributes
      return (
        <AsyncComponent
          onError={onError}
          asyncProps={{
            route: async () => Promise.all((childRoutes || [])
                .map((childRoute) => {
                  if (childRoute.components || !childRoute.getComponents) {
                    return { childRoute };
                  } else {
                    return new Promise((resolve, reject) => childRoute.getComponents(state, (err, res) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({
                          childRoute,
                          components: res,
                        });
                      }
                    }));
                  }
                }))
              .then(subComponents => ({
                ...route,
                childRoutes: subComponents.map(({ childRoute, components }) => ({
                  ...childRoute,
                  components,
                })),
              })),
          }}
        >
          <Route4Compat routes={root} state={state} onError={onError} {...rest} />
        </AsyncComponent>
      );
    }
    const components = {};
    if (childRoutes) {
      childRoutes = childRoutes.map((childRoute) => {
        const { path: childPath } = childRoute;
        if (!childPath.startsWith('/')) {
          return {
            ...childRoute,
            path: makePath(path, childPath),
          };
        }
        return childRoute;
      });
      for (let i = 0; i < childRoutes.length; ++i) {
        const childRoute = childRoutes[i];
        const { components: childComponents } = childRoute;
        if (childComponents) {
          assignWith(components, childComponents, (objValue, srcValue) => {
            if (!objValue) {
              return [{
                path: childRoute.path,
                component: srcValue,
              }];
            } else {
              objValue.push({
                path: childRoute.path,
                component: srcValue,
              });
              return objValue;
            }
          });
        }
      }
    }
    let routes;
    if (indexRoute) {
      routes = [{ ...indexRoute, path: makePath(path, indexRoute.path), exact: true }, ...(childRoutes || [])];
    } else {
      routes = [...(childRoutes || [])];
    }
    const comps = mapValues(components, compRoutes => (props) => {
      if (compRoutes.length === 1) {
        return <Route {...props} path={compRoutes[0].path} component={compRoutes[0].component} />;
      } else {
        return (
          <Switch>
            { compRoutes.map(compRoute => <Route {...props} path={compRoute.path} component={compRoute.component} />) }
          </Switch>
        );
      }
    });
    const hasChildren = some(routes, r => !!matchPath(state.location.pathname, r, state.match));
    return (hasChildren && routes && routes.length > 0) ? (
      <Comp {...rest} router={this.context.router} params={state.match.params} location={state.location} routes={root} {...comps}>
        <Switch>
          { createRoutes(routes, onError, root) }
        </Switch>
      </Comp>
    ) : <Comp {...rest} router={this.context.router} params={state.match.params} location={state.location} routes={root} {...comps} />;
  }
}

Route4Compat.contextTypes = {
  router: PropTypes.object,
};

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

Route4Compat.propTypes = {
  route: RoutePropType,
  routes: PropTypes.arrayOf(RoutePropType),
  onError: PropTypes.func,
  state: PropTypes.object,
};

Route4Compat.defaultProps = {
  route: {},
  routes: [],
  onError: () => null,
  state: {},
};

export default Route4Compat;
