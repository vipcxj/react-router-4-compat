/* eslint-disable import/no-extraneous-dependencies,jsx-a11y/anchor-is-valid,no-console */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { createBrowserHistory } from 'history';
import { Link } from 'react-router-dom';
import { Router4Compat as Router, withRouter4Compat as withRouter } from '../src';

const addLifeCycle = (render, {
  preRen, cwm, cdm, cwu, cdu, cwum,
}) => {
  class C extends React.PureComponent {
    componentWillMount() {
      return cwm && cwm(this.props, this.state, this.context);
    }
    componentDidMount() {
      return cdm && cdm(this.props, this.state, this.context);
    }
    componentWillUpdate(nextProps, nextState, nextContext) {
      return cwu && cwu(this.props, nextProps, this.state, nextState, this.context, nextContext);
    }
    componentDidUpdate(prevProps, prevState, prevContext) {
      return cdu && cdu(prevProps, this.props, prevState, this.state, prevContext, this.context);
    }
    componentWillUnmount() {
      return cwum && cwum(this.props, this.state, this.context);
    }
    render() {
      // eslint-disable-next-line no-unused-expressions
      preRen && preRen(this.props, this.state, this.context);
      return render(this.props, this.state, this.context);
    }
  }
  return C;
};

storiesOf('react router 4 compact', module)
  .add('basic usage', () => {
    const App = ({ children }) => (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
          <li><Link to="/inbox/messages/a">Message a</Link></li>
          <li><Link to="/inbox/messages/b">Message b</Link></li>
          <li><Link to="/inbox/messages/c">Message c</Link></li>
        </ul>
        {children}
      </div>
    );
    const About = () => <h3>About</h3>;
    // const About = addLifeCycle(
    //   () => <h3>About</h3>,
    //   ({ routes }) => console.log(routes),
    //   () => console.log('About: cwm'),
    //   () => console.log('About: cdm'),
    //   () => console.log('About: cwu'),
    //   () => console.log('About: cdu'),
    //   () => console.log('About: cwum'),
    // );
    const Inbox = ({ children }) => (
      <div>
        <h2>Inbox</h2>
        {children || 'Welcome to your Inbox'}
      </div>
    );
    // const Inbox = addLifeCycle(
    //   ({ children }) => (
    //     <div>
    //       <h2>Inbox</h2>
    //       {children || 'Welcome to your Inbox'}
    //     </div>
    //   ),
    //   ({ routes }) => console.log(routes),
    //   () => console.log('Inbox: cwm'),
    //   () => console.log('Inbox: cdm'),
    //   () => console.log('Inbox: cwu'),
    //   () => console.log('Inbox: cdu'),
    //   () => console.log('Inbox: cwum'),
    // );
    const Message = ({ params }) => <h3>Message {params.id}</h3>;
    // const Message = addLifeCycle(
    //   ({ params }) => <h3>Message {params.id}</h3>,
    //   ({ routes }) => console.log(routes),
    //   () => console.log('Message: cwm'),
    //   () => console.log('Message: cdm'),
    //   () => console.log('Message: cwu'),
    //   () => console.log('Message: cdu'),
    //   () => console.log('Message: cwum'),
    // );
    const routes = {
      path: '/',
      component: App,
      childRoutes: [
        {
          path: 'about',
          component: About,
        },
        {
          path: 'inbox',
          component: Inbox,
          childRoutes: [{
            path: 'messages/:id',
            component: Message,
          }],
        },
      ],
    };
    return <Router routes={routes} history={createBrowserHistory({ basename: '/' })} />;
  })
  .add('lazy route', () => {
    const App = ({ children }) => (
      <div>
        <h1>Pleas click the hello world link.</h1>
        <ul>
          <li><Link to="/lazy-route/hello-world">Hello World!</Link></li>
        </ul>
        {children}
      </div>
    );
    const routes = {
      path: '/',
      component: App,
      childRoutes: [
        {
          path: 'lazy-route/hello-world',
          getComponent(ignored, cb) {
            import('./HelloWorld').then(route => cb(null, route.default));
          },
        },
      ],
    };
    return <Router routes={routes} history={createBrowserHistory({ basename: '/' })} />;
  })
  .add('with router', () => {
    const App = ({ children }) => (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/with-router/message-1">Message-1</Link></li>
          <li><Link to="/with-router/message-2">Message-2</Link></li>
          <li><Link to="/with-router/message-3">Message-3</Link></li>
        </ul>
        {children}
      </div>
    );
    const Message = withRouter(({ params }) => <h3>Message {params.msg}</h3>);
    const MessageBox = () => <Message />;
    const routes = {
      path: '/',
      component: App,
      childRoutes: [
        {
          path: 'with-router/:msg',
          component: MessageBox,
        },
      ],
    };
    return <Router routes={routes} history={createBrowserHistory({ basename: '/' })} />;
  })
  .add('life cycle', () => {
    const cb = cmp => ({
      cwm() {
        console.log(`${cmp}/will mount`);
      },
      cdm() {
        console.log(`${cmp}/did mount`);
      },
      cwu() {
        console.log(`${cmp}/will update`);
      },
      cdu() {
        console.log(`${cmp}/did update`);
      },
      cwum() {
        console.log(`${cmp}/will unmount`);
      },
    });
    const App = addLifeCycle(({ children }) => (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/invoices/1">Invoice: 1</Link></li>
          <li><Link to="/invoices/2">Invoice: 2</Link></li>
          <li><Link to="/invoices/3">Invoice: 3</Link></li>
          <li><Link to="/accounts/1">Account: 1</Link></li>
          <li><Link to="/accounts/2">Account: 2</Link></li>
          <li><Link to="/accounts/3">Account: 3</Link></li>
        </ul>
        { children }
      </div>
    ), cb('App'));
    const Home = addLifeCycle(() => <div>Home</div>, cb('Home'));
    const Invoice = addLifeCycle(() => <div>Invoice</div>, cb('Invoice'));
    const Account = addLifeCycle(() => <div>Account</div>, cb('Account'));
    const routes = {
      path: '/',
      component: App,
      indexRoute: {
        component: Home,
      },
      childRoutes: [
        {
          path: 'invoices/:invoiceId',
          component: Invoice,
        },
        {
          path: 'accounts/:accountId',
          component: Account,
        },
      ],
    };
    return <Router routes={routes} history={createBrowserHistory({ basename: '/' })} />;
  });
