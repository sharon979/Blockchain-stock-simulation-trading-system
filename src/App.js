import React,{useState}from 'react';
import { BrowserRouter , Routes,Route } from 'react-router-dom';
import Home from "./views/Home";
import Register from "./views/Register";
import Login from "./views/Login";
import BuyStock from "./views/BuyStock";
import SellStock from "./views/SellStock";
import Discussion from "./views/Discussion";
import TransactionStatus from "./views/TransactionStatus";
import {testcount} from "./scheduled";


export const AuthContext = React.createContext(null);


function App() {
  const [ authState, setAuthState ] = useState(false);
 
  //testcount();

 
  let route_target;
  if(!authState) {
    route_target = <Route path="/" name="Login" component={Login}/>;
  } else
    route_target = <Route path="/" name="Home" component={Home} />;
  
    return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route  path="/" element={<Login />} />
            <Route  path="/Home" element={<Home />} />
            <Route  path="/BuyStock" element={<BuyStock />} />
            <Route  path="/SellStock" element={<SellStock />} />
            <Route  path="/TransactionStatus" element={<TransactionStatus />} />
            <Route  path="/Discussion" element={<Discussion />} />
            <Route  path="/Register" element={<Register />} />
          </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;





