# react-router-4-compat &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/react-router-4-compat.svg?style=flat)](https://www.npmjs.com/package/react-router-4-compat)

A version compatible with version 3 for [React-Router-4](https://reacttraining.com/react-router/).

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-router-4-compat
    
```jsx harmony
import { Router4Compat as Router } from 'react-router-4-compat';

const Demo = () => {
    const App = ({ children }) => (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
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
    return <Router routes={routes} history={createBrowserHistory('/')} />;
  }

```

##Progress
Only plain route config is supported at this moment.
OnUpdate and OnLeave is not supported yet, but onEnter has been supported. 
static and Dynamic route config have all been supported. 
components and getComponents are supported, but without test.
components and getComponents are not permitted in the root route config.
