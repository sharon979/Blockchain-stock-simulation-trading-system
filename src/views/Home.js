import React, { Component,useState } from 'react';
import  {Link,useNavigate} from "react-router-dom";
import woman from '../woman.png';
import star from '../star.png';
import './Home.css';
import User from '../contracts/User.json';
import Stock from '../contracts/Stock.json';
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";
import {start_opening_schedule,start_closing_schedule,testcount,Total_Account_Value,limitorder,delet_waiting} from "../scheduled";
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set,update, push, child,get, orderByChild, equalTo,startAt} from "firebase/database";
import { scheduleJob,RescheduleJob } from 'node-schedule';
import { Job,schedule } from 'node-schedule';
import { cancelJob } from 'node-schedule';



const Home=()=>{
    const [web3,set_web3]=React.useState("");
    const [accounts, set_accounts] = React.useState([]);
    const [clock, set_clock]=React.useState([]);
    const [current_time,set_current_time]=React.useState([]);
    const [opennow,set_opennow]=React.useState([]);
    const [shutDown_txn,set_shutDown_txn]=React.useState([]);
    const [user_contract, set_user_contract] = React.useState(null);
    const [stock_contract, set_stock_contract] = React.useState(null);
    const [email,set_email]=React.useState(null);
    const [user, set_user] = React.useState(null);
    const Navigate = useNavigate();
    const [account,setAccount]=React.useState("");
    const [name,setUserName]=React.useState("");
    const [starnum,setstarnum]=React.useState("");
    const schedule = require('node-schedule');
    const { scheduleJob } = require('node-schedule');
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

    let count=0;

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
                let contract2 = await getContractInstance(web3, Stock, eth_addr.Stock);
				set_stock_contract(contract2);
			}
		};
		load();
	}, [web3]);

  //載入User
    React.useEffect(() => {
        let nowaccount;
        const load=async()=>{
            let user_str = localStorage.getItem("user");
            if (user_str) {
                let user = JSON.parse(user_str);
                set_user(user);
                setAccount(user.useraccount);
                setUserName(user.username);
                nowaccount=user.useraccount;
            }
        }
        load();
        const get_token=async(res,req)=>{    
            //alert('nowaccount:'+nowaccount);
            try{
                let get_token = await contract_call(user_contract,'user_gettoken',[nowaccount],{
                  from:accounts[0],
                  gas:6000000,
                });
                console.log(get_token);
                setstarnum(get_token);
                return get_token;
            }catch(error){
                alert("fail");
                return false;
            }
            
        }
        get_token();
        get_email();
    }, [accounts,user_contract]);

    //載入Global
    React.useEffect(() => {
        
        const getGlobaldata=async()=>{
            const dbRef = ref(getDatabase());
            const dbRef2 = child(dbRef,"Global");  
            get(dbRef2).then((snapshot) => {
            if(snapshot.exists()){
            const userData = snapshot.val();
            console.log("exists!", userData);
            console.log('test!');
            //console.log(userData.opennow,userData.shutDown_txn);
            set_opennow(userData.opennow);
            set_shutDown_txn(userData.shutDown_txn);
            //const now=new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const now=new Date().toTimeString();
            set_current_time(now);
            console.log("current date and time : " + now);
            console.log(Date());
            if(userData.opennow==true){
                set_clock('開盤中');
            }
            else if(userData.opennow==false){
                set_clock('收盤中');
            }
        }
        });
    }
    getGlobaldata();
},[opennow,shutDown_txn,clock]);

    //載入所有排程
    React.useEffect(() => {
        start_opening_schedule(opennow,shutDown_txn);
        start_closing_schedule(opennow,shutDown_txn);
        //testcount(accounts,user_contract,web3,stock_contract);
        limitorder(accounts,user_contract,web3,stock_contract);
        delet_waiting();
        Total_Account_Value();
        console.log('clock:'+clock);

    },[[accounts,user_contract,web3,stock_contract]]);

    //去得使用者基本資料
    const get_email=async(res,req)=>{
        const mail='';
        const dbRef = ref(getDatabase());
        const dbRef2 = child(dbRef,"User/"+account);
        get(dbRef2).then((snapshot) => {
            if(snapshot.exists()) {
                console.log('有抓到');
              var mail=snapshot.val();
              set_email(mail.email);
              console.log(mail.email);
            } 
            else {
                console.log('沒有資料');
            }
            }).catch((error) => {
                alert('未知錯誤');
                console.error(error);
            });
    }

     //取得User炒股幣數量
     const get_token=async(res,req)=>{
        alert(account);
        try{
            let get_token = await contract_call(user_contract,'user_gettoken',[account],{
              from:accounts[0],
              gas:6000000,
            });
            console.log(get_token);
            //setstarnum(get_token);
            return get_token;
        }catch(error){
            alert("fail");
            return false;
        }
    };

    return (
            <body>
                <div class='warp'>
                    <div class='left'>
                        <h1>股票交易模擬平台</h1>
                        <h4>{clock}</h4>
                        <p>{current_time}</p>
                        <Link to='' id='nowpage'>使用者管理</Link>
                        <Link to='/BuyStock' id='BuyStock'>即時股價/買入</Link>
                        <Link to='/SellStock' id='SellStock'>已持有股票/賣出</Link>
                        <Link to='/TransactionStatus' id='TransactionStatus'>交易狀態</Link>
                        <Link to='/Discussion' id='Discussion'>班級討論版</Link>
                        
                    </div>                   
                    <div class='right'>
                        <Link to='/' id='logout'>登出</Link>
                        <img src={woman} alt='QQ'/>
                        <div class='info'>
                            <img src={star} alt='QQ'/>
                            <h2>炒古幣：{starnum}個</h2>
                            <h3>{account}</h3>
                            <h4>{name}</h4>
                            <h5>{email}</h5>
                            <div class='tab'>

                            </div>
                        </div>
                    </div>
                </div>
            </body>
            
    );
   
}

export default Home;
