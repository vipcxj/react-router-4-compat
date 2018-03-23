/* eslint-disable react/require-default-props,react/no-children-prop */
import React from 'react';
import PropTypes from 'prop-types';
import Route from 'react-router-dom/Route';
import hoistStatics from 'hoist-non-react-statics';

const withRouter4Compat = (Component) => {
  const C = (props) => {
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <Route
        children={(routeComponentProps) => {
          const { match, location } = routeComponentProps;
          return (<Component
            {...remainingProps}
            {...routeComponentProps}
            router={this.context.router}
            routes={this.context.routes}
            params={match.params}
            location={location}
            ref={wrappedComponentRef}
          />);
        }}
      />
    );
  };
  C.displayName = `withRouter(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func,
  };
  C.contextTypes = {
    routes: PropTypes.object,
    router: PropTypes.object,
  };

  return hoistStatics(C, Component);
};

export default withRouter4Compat;
