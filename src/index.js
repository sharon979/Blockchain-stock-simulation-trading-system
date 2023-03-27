import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(<App/>, document.getElementById('root'));
reportWebVitals();

/*
ReactDOM.render(
<React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
*/



/*
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory} from 'react-router';
import './index.css';
import App from './App';
import Home from './components/Home';
import Register from './components/Register';
//import reportWebVitals from './reportWebVitals';


//reportWebVitals();

ReactDOM.render(
  (
    <Router history={hashHistory}>
      <Route path="/" component={App}>
        <Route path="/components/Home" component={Home}/>
        <Route path="/components/Register" component={Register} />
      </Route>
    </Router>
  ),
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

*/