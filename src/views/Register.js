import React,{useState} from 'react';
import './Register.css';
import registered from '../registered.png';
import User from '../contracts/User.json';
import {Link,useNavigate} from "react-router-dom";
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set,update, push, child,get, orderByChild, equalTo,startAt} from "firebase/database";


const Register=()=>{
  const [account,setAccount]=useState("");
  const [name,setUserName]=useState("");
  const [password,setUserPassword]=useState("");
  const [email,setUserEmail]=useState("");
  const [web3,set_web3]=React.useState("");
  const [accounts, set_accounts] = React.useState([]);
  const [user_contract, set_user_contract] = React.useState(null);
  const Navigate = useNavigate();
  var exist_or_not=false;
  const firebaseConfig = {
    apiKey: "AIzaSyA7BHjHS9v5GgKM79B530U2XSoJb3fbaow",
    authDomain: "blockchainstock-65b87.firebaseapp.com",
    projectId: "blockchainstock-65b87",
    storageBucket: "blockchainstock-65b87.appspot.com",
    messagingSenderId: "172308721496",
    appId: "1:172308721496:web:f10dc4f41271b804b37f2d",
    measurementId: "G-K0FGJ4N45P"
  };
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

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

  //清空輸入欄
  const cleaninput=()=>{
    document.getElementById('account').value = '';
    document.getElementById('name').value = '';
    document.getElementById('password').value = '';
    document.getElementById('email').value = '';
  }


  //確認用戶是否存在
   const check_user_exist=async(res,req)=>{
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
		if (!password) {
			alert("請輸入密碼!");
      cleaninput();
			return;
		}
    if (!email) {
			alert("請輸入信箱!");
      cleaninput();
			return;
		}
     //var exist_or_not=false;
    try {
      // * 執行智能合約
      let checkuserexist = await contract_call(user_contract, 'user_IsExist',[account],{
        from:accounts[0],
        gas:6000000,
      });  
      console.log(checkuserexist);
      return checkuserexist;
    } catch (error) {
      alert("error");
      return false;

    }
   }

  //使用者註冊
  const create=async()=>{
    var success_or_not=false;

    try{
      let result=contract_send(user_contract,'userCreate',[account,name,password],{
        from:accounts[0],
        gas:6000000,
      });
      if (result) {
        success_or_not=true
        console.log(result,success_or_not);
        console.log("註冊成功");
        //更新至資料庫User中
        const db=getDatabase();
        push(ref(db, '/User/'+account), {
          name: name,
          emial: email,
          birthday:'none',
          Total_stock_value:0,
          time: Date(),
      });


      } else {
        console.log(result)
        alert("註冊失敗");
      }
    }catch(error){
      alert("fail");
    }
    
    if(success_or_not===true){
        Navigate('../');
    }
    
  }


  const run =async()=>{
    const user=await check_user_exist();
    if(user){
      console.log("該帳號已被註冊");
      cleaninput();
    }
    /*
    else if(user=''){
      alert("該帳號可以註冊");
      create();
    }
    */
   else{
    console.log("該帳號可以註冊");
    create();
   }
  }
  

  return (
    <html>
      <body>
      <div class='warp'>
              <div class='header'>
                <h1>歡迎來到股票模擬系統</h1>
              </div>  
      <div class='Register'> 
            <h1>註冊</h1>
            <div class="picture">
              <img src={registered} alt='QQ'/>
            </div>
                <div class="inputaccount">
                  <h3>請輸入學號:</h3>
                  <input type="text" id='account' placeholder="使用者學號" onChange={(e)=>{setAccount(e.target.value)}}/>
                </div>            
                <div class="inputname">
                  <h4>請輸入姓名:</h4>
                  <input type="text" id='name' placeholder="使用者姓名" onChange={(e)=>{setUserName(e.target.value)}}/>
                </div>      
                <div class="inputpassword">
                  <h4>請輸入密碼:</h4>
                  <input type="text" id='password' placeholder="使用者密碼" onChange={(e)=>{setUserPassword(e.target.value)}}/>
                </div>
                <div class="inputpassword">
                  <h4>請輸入信箱:</h4>
                  <input type="text" id='email' placeholder="使用者信箱" onChange={(e)=>{setUserEmail(e.target.value)}}/>
                </div>
                  <button  id="submit" onClick={()=>{run()}}>註冊</button>
                  <Link to='/' id='linklogin'>登入</Link>

      </div>              
      </div>  
      </body>
    </html>
  )
}

export default Register;


    