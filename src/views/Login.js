import login from '../login.png';
import React,{useState} from 'react';
import './Login.css';
import {Link,useNavigate} from "react-router-dom";
import User from '../contracts/User.json';
//import {Link,useNavigate} from "react-router-dom";
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";
import crypto from "crypto-browserify";


  const Login=()=>{
      const [account,setAccount]=useState("");
      const [name,setUserName]=useState("");
      const [password,setUserPassword]=useState("");
      const [web3,set_web3]=React.useState("");
      const [accounts, set_accounts] = React.useState([]);
      const [user_contract, set_user_contract] = React.useState(null);
      const Navigate = useNavigate();



      //初始載入web3
	    React.useEffect(() => {
		    const load = async () => {
			    let web3 = await connect_to_web3();
			    if (web3) {
				    set_web3(web3);
			    }
		    };
		  load();
	    }, []);

      //更新帳戶資料
	    React.useEffect(() => {
		    const load = async () => {
			    if (web3) {
				  let accounts = await web3.eth.getAccounts();
				  set_accounts(accounts);
			    }
		    };
		    load();
	    }, [web3]);

	    //更新智能合約
	    React.useEffect(() => {
		    const load = async () => {
			    if (web3) {
				  let contract1 = await getContractInstance(web3, User, eth_addr.User);
				  set_user_contract(contract1);
			    }
		    };
		    load();
	    }, [web3]);
      
      /*
      //確認用戶是否存在
      const check_user=async(res,req)=>{
        try {
          // * 執行智能合約
          let checkuser = await contract_call(user_contract, 'get_User',[account,password],{
          from:accounts[0],
          gas:6000000,
        });  
        console.log(checkuser);
        return checkuser;
        } catch (error) {
          alert("error");
          return false;
        }
      };
      */
      //清空輸入欄
      const cleaninput=()=>{
        document.getElementById('account').value = '';
        document.getElementById('name').value = '';
        document.getElementById('password').value = '';
      }

      //確認用戶是否存在
      const check_user=async(res,req)=>{
        try {
          // * 執行智能合約
          let checkuser = await contract_call(user_contract, 'user_login',[account,name,password],{
          from:accounts[0],
          gas:6000000,
        });  
        console.log(checkuser);
        return checkuser;
        } catch (error) {
          alert("error");
          return false;
        }
      };

       //取得用戶密碼
       const  get_User_password=async(res,req)=>{
        try {
          // * 執行智能合約
          let get_password = await contract_call(user_contract, 'user_password',[account],{
          from:accounts[0],
          gas:6000000,
        });  
        console.log(get_password);
        return get_password;
        } catch (error) {
          alert("error");
          return false;
        }
      };

      //加密測試
      const secret=async(res,req)=>{
        const user_password=await get_User_password();
        console.log(password,account,name);
        const test='wantlogin'
        const value =crypto
				  .createHmac("sha512", test)
				  .update(password) 
				  .digest("hex");
        console.log(value);

        const value2=	 crypto
        .createHmac("sha512", test)
        .update(user_password) 
        .digest("hex");
        console.log(value2);

        if(value===value2){
          console.log("success");
          return "success";

        }
        else{
          console.log("fails");
          return "fails";

        }
      }

      
      const wantlogin=async()=>{
        const user=await check_user();
        const Encryption=await secret();
        console.log(Encryption);

        if (!web3) {
          alert("web3未載入!");
          cleaninput();
          return;
        }
        if (accounts.length === 0) {
          alert("區塊鏈上沒有任何帳戶!");
          cleaninput();
          return;
        }
        if (!password) {
          alert("請輸入密碼!");
          cleaninput();
          return;
        }
        if (!account) {
          alert("請輸入帳號!");
          cleaninput();
          return;
        }
        if (!name) {
          alert("請輸入姓名!");
          cleaninput();
          return;
        }
        if(user==="login success" && Encryption==='success'){
          console.log("成功了！");
          let user_obj = {
						useraccount: account,
						username:name,
					};
					localStorage.setItem("user", JSON.stringify(user_obj));
          Navigate('../Home');
        }else if(user==="password error"){
          alert("密碼錯誤，請重新輸入");
          cleaninput();
        }
        else if(user==="user not exit"){
          alert("該用戶不存在，請確認姓名或學號。是否尚未註冊？");
          cleaninput();
          //this.props.navigation.navigate('../Register');
          //Navigate('../Register');
        }
      }
     
      return(
          <html>
            <body>
              <div class='warp'>
              <div class='header'>
                <h1>歡迎來到股票模擬系統</h1>
              </div>  
              <div class="login">
                  <h1>登入</h1>
                  <div class="picture">
                    <img src={login} alt='QQ'/>
                  </div>

                  <div class="inputaccount">
                  <h3>請輸入學號:</h3>
                  <input type="text" id='account' placeholder="使用者學號" onChange={(e)=>{setAccount(e.target.value)}}/>
                  </div>           
                  <div class="inputname">
                  <h4>請輸入姓名:</h4>
                  <input type="text" id='name'  placeholder="使用者姓名" onChange={(e)=>{setUserName(e.target.value)}}/>
                  </div>           
                  <div class="inputpassword">
                    <h4>請輸入密碼:</h4>
                    <input type="text" id='password'  placeholder="使用者密碼" onChange={(e)=>{setUserPassword(e.target.value)}}/>

                  </div>
                  <button id="submit" onClick={()=>{wantlogin()}}>登入</button>
                  <Link to='/Register' id='linkregister'>立即註冊</Link>
                  


              </div>
          </div>
          </body>  
          </html>
          
        );
      }
    


export default Login;
