/* eslint-disable react/require-default-props,react/no-children-prop */
import invariant from 'invariant';
import React from 'react';
import PropTypes from 'prop-types';
import Route from 'react-router/Route';
import hoistStatics from 'hoist-non-react-statics';

const isStateless = Component => !Component.prototype.render;

const withRouter4Compat = (Component, { withRef = false } = {}) => {
  class C extends React.Component {
    // noinspection JSUnusedGlobalSymbols
    getWrappedInstance() {
      invariant(
        withRef,
        'To access the wrapped instance, you need to specify ' +
        '`{ withRef: true}` as the second argument of the withRouter() call.',
      );
      return this.wrappedInstance;
    }
    render() {
      const { wrappedComponentRef, ...remainingProps } = this.props;
      const wrappedComponentRefCompat = wrappedComponentRef ? (c) => {
        this.wrappedInstance = c;
        return wrappedComponentRef(c);
      } : (c) => {
        this.wrappedInstance = c;
      };
      return (
        <Route
          children={(routeComponentProps) => {
            const { match, location } = routeComponentProps;
            return isStateless(Component) ? (<Component
              {...remainingProps}
              {...routeComponentProps}
              router={this.context.router}
              routes={this.context.routes}
              params={match.params}
              location={location}
            />) : (<Component
              {...remainingProps}
              {...routeComponentProps}
              router={this.context.router}
              routes={this.context.routes}
              params={match.params}
              location={location}
              ref={wrappedComponentRefCompat}
            />);
          }}
        />
      );
    }
  }
  C.displayName = `withRouter(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func,
  };
  C.contextTypes = {
    routes: PropTypes.array,
    router: PropTypes.object,
  };

  return hoistStatics(C, Component);
};

export default withRouter4Compat;
