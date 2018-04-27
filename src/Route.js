import React from 'react';
import PropTypes from 'prop-types';
import Switch from 'react-router/Switch';
import Route from 'react-router/Route';
import matchPath from 'react-router/matchPath';
import { AsyncComponent } from 'react-async-wrapper';
import { mapValues, assignWith, some } from './utils';
import withRouter4Compat from './withRouter';

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

export const createRoutes = (routes, onError, routeStack = []) => routes.map((route) => {
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
            && !onEnter) {
            return <Route4Compat {...props} state={routeState} route={route} routeStack={routeStack} onError={onError} />;
          }
          const asyncJobs = [];
          if (onEnter) {
            asyncJobs.push(() => new Promise((resolve, reject) => {
              if (onEnter.length >= 3) {
                onEnter(routeState, history.replace, (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              } else {
                onEnter(routeState, history.replace);
                resolve();
              }
            }));
          }
          return (
            <AsyncComponent
              batch
              onError={onError}
              asyncJobs={asyncJobs}
              asyncProps={{
                route: () => createRoutePromise(routeState, route),
              }}
              loadingComponent={() => null}
              reloadOnUpdate={false}
            >
              <Route4Compat {...props} routeStack={routeStack} state={routeState} onError={onError} />
            </AsyncComponent>
          );
        }
      }
    />
  );
}).filter(v => v);

export const makePath = (base, path) => {
  if (!path) {
    return base || '/';
  }
  if (path.startsWith('/')) {
    return path;
  }
  return `${base === '/' ? '' : base}/${path}`;
};

const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true;
  }
  if (!obj1 || !obj2) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; ++i) {
    const key = keys1[i];
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
};

class Route4Compat extends React.Component {
  componentWillMount() {
    this.context.routesCompat = [...this.props.routeStack, this.props.route];
    this.context.routesUpdater(this.context.routesCompat);
  }
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    // noinspection JSUnusedLocalSymbols
    const {
      match: nextMatch,
      params: nextParams,
      state: nState,
      route: nextRoute,
      routeStack: nextRouteStack,
      ...nextRest
    } = nextProps;
    // noinspection JSUnusedLocalSymbols
    const {
      match: thisMatch,
      params: thisParams,
      state: tState,
      route: thisRoute,
      routeStack: thisRouteStack,
      ...thisRest
    } = this.props;
    const { params: nextMatchParams, ...nextMatchRest } = nextMatch || {};
    const { params: thisMatchParams, ...thisMatchRest } = thisMatch || {};
    return !shallowEqual(this.state, nextState)
      || !shallowEqual(this.context, nextContext)
      || !shallowEqual(thisMatchParams, nextMatchParams)
      || !shallowEqual(thisMatchRest, nextMatchRest)
      || !shallowEqual(thisRoute, nextRoute)
      || !shallowEqual(thisRouteStack, nextRouteStack)
      || !shallowEqual(thisRest, nextRest);
  }
  render() {
    const {
      route,
      routeStack,
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
          batch
          onError={onError}
          loadingComponent={() => null}
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
          reloadOnUpdate={false}
        >
          <Route4Compat routeStack={routeStack} state={state} onError={onError} {...rest} />
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
    const { routesCompat } = this.context;
    if (indexRoute) {
      routes = [{ ...indexRoute, path: makePath(path, indexRoute.path), exact: true }, ...(childRoutes || [])];
    } else {
      routes = [...(childRoutes || [])];
    }
    const comps = mapValues(components, compRoutes => (props) => {
      if (compRoutes.length === 1) {
        return (
          <Route
            {...props}
            path={compRoutes[0].path}
            component={withRouter4Compat(compRoutes[0].component)}
          />);
      } else {
        return (
          <Switch>
            {
              compRoutes.map(compRoute =>
                <Route {...props} path={compRoute.path} component={withRouter4Compat(compRoute.component)} />)
            }
          </Switch>
        );
      }
    });
    const validRoutes = routes.filter(r => !!matchPath(state.location.pathname, r, state.match));
    return (validRoutes.length > 0) ? (
      <Comp {...rest} router={state.history} params={state.match.params} location={state.location} routes={routesCompat} {...comps}>
        { createRoutes([validRoutes[0]], onError, [...routeStack, route]) }
      </Comp>
    ) : <Comp {...rest} router={state.history} params={state.match.params} location={state.location} routes={routesCompat} {...comps} />;
  }
}

Route4Compat.contextTypes = {
  router: PropTypes.object,
};

export const RoutePropType = PropTypes.shape({
  path: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
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
  routeStack: PropTypes.arrayOf(RoutePropType),
  onError: PropTypes.func,
  state: PropTypes.object,
};

Route4Compat.defaultProps = {
  route: {},
  routeStack: [],
  onError: () => null,
  state: {},
};

Route4Compat.contextTypes = {
  routesCompat: PropTypes.arrayOf(RoutePropType),
  routesUpdater: PropTypes.func,
};

export default Route4Compat;
