import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, matchPath } from 'react-router-dom';
import { AsyncComponent } from 'react-async-wrapper';
import { mapValues, assignWith, some } from './utils';
import { createRoutes, RoutePropType } from './Router4Compat';

const makePath = (base, path) => `${base === '/' ? '' : base}/${path || ''}`;

class Route4Compat extends React.Component {
  render() {
    const {
      route,
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
          <Route4Compat state={state} onError={onError} />
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
      <Comp {...rest} {...comps}>
        <Switch>
          { createRoutes(routes, onError) }
        </Switch>
      </Comp>
    ) : <Comp {...rest} {...comps} />;
  }
}

Route4Compat.propTypes = {
  route: RoutePropType,
  onError: PropTypes.func,
  state: PropTypes.object,
};

Route4Compat.defaultProps = {
  route: {},
  onError: () => null,
  state: {},
};

export default Route4Compat;
