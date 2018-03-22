/* eslint-disable import/no-extraneous-dependencies,jsx-a11y/anchor-is-valid */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { createBrowserHistory } from 'history';
import { Link } from 'react-router-dom';
import { Router4Compat as Router } from '../src';

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
    const Inbox = ({ children }) => (
      <div>
        <h2>Inbox</h2>
        {children || 'Welcome to your Inbox'}
      </div>
    );
    const Message = ({ params }) => <h3>Message {params.id}</h3>;
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
  });
