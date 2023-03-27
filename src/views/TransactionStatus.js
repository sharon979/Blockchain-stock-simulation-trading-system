import React, { Component,useState } from 'react';
import  {Link,useNavigate} from "react-router-dom";
import './TransactionStatus.css';
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set,update, push, child,get, orderByChild, equalTo,startAt} from "firebase/database";
import { query, orderBy, limit,getDocs,where } from "firebase/firestore";  
import https from "https";
import  {requests} from 'http';
import axios, { CanceledError } from 'axios';
import Stock from '../contracts/Stock.json';
import User from '../contracts/User.json';
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";
import { async } from '@firebase/util';
import { rescheduleJob } from 'node-schedule';
import { Job } from 'node-schedule';
import { cancelJob } from 'node-schedule';

const TransactionStatus=()=>{
    const [web3,set_web3]=React.useState("");
    const [accounts, set_accounts] = React.useState([]);
    const [stock_contract, set_stock_contract] = React.useState(null);
    const [user_contract, set_user_contract] = React.useState(null);
    const [user, set_user] = React.useState(null);
    const Navigate = useNavigate();
    const [account,setAccount]=React.useState("");
    const [name,setUserName]=React.useState("");
    const [Stocknum,setStocknum]=useState("");
    var [stockdata,setstockdata]=useState("");
    const [user_money,setUserMoney]=React.useState("");
    const [user_final_money,setUserFinalMoney]=React.useState("");
    const [ButtonPop,setButtonPop] = React.useState(false);
    let [test,settest]=React.useState();
    const [messages, setMessages] = useState([]);
    const [messages2, setMessages2] = useState([]);
    const [messages3, setMessages3] = useState([]);
    const [messages4, setMessages4] = useState([]);


    var [idname, setidname]=useState([]);
    const [clock, set_clock]=React.useState([]);
    const [current_time,set_current_time]=React.useState([]);
    const [opennow,set_opennow]=React.useState([]);
    const [shutDown_txn,set_shutDown_txn]=React.useState([]);
    const userbuy=[];

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
				let contract1 = await getContractInstance(web3, Stock, eth_addr.Stock);
				set_stock_contract(contract1);
                let contract2 = await getContractInstance(web3, User, eth_addr.User);
				set_user_contract(contract2);
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
                nowaccount=user.useraccount;
                setUserName(user.username);
            }
        };
        load();
        //getbuynum();
        getdata();

        //取得使用者目前資產        
        const get_now_money=async(res,req)=>{
            console.log('取得'+account+'現在金額');
            if(!web3){
                console.log("web3未載入!");
                return;
            }
            try{
                let result= await contract_call(user_contract,'user_now_money',[account],{
                  from:accounts[0],
                  gas:6000000,
                });
                if (result) {
                  setUserMoney(result);
                  console.log(result);
                  //console.log(success_or_not)
                  //alert(result);
                  //Navigate.push('Home/Register');
          
                } else {
                  console.log(result)
                  console.log("取得"+account+"目前金額失敗");
                }
            }catch(error){
                alert("fail");
            }
        };
        
        get_now_money();
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
            console.log("current date and time : " + now)
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

    //取得已購買股票
    const getdata=async(res,req)=>{
        console.log("開始抓資料");
       const dbRef = ref(getDatabase());
       const dbRef2 = child(dbRef,"State/"+account+"/Waiting/Market");
       const dbRef3 = child(dbRef,"State/"+account+"/Waiting/Limit");
       const dbRef4 = child(dbRef,"State/"+account+"/Success");
       const dbRef5 = child(dbRef,"State/"+account+"/Fail");


        console.log(account);

       get(dbRef2).then((snapshot) => {
        if(snapshot.exists()) {
            console.log('有抓到');
          var data=snapshot.val();
          setMessages(Object.values(data));

          console.log(messages);
          setidname(Object.keys(messages));
          console.log(idname);
        } 
        
        else {
            console.log('沒有資料');
        }
        }).catch((error) => {
            alert('未知錯誤');
            console.error(error);
        });

        get(dbRef3).then((snapshot) => {
            if(snapshot.exists()) {
                console.log('有抓到');
              var data=snapshot.val();
              setMessages2(Object.values(data));
    
              console.log(messages);
              setidname(Object.keys(messages2));
              console.log(idname);
            } 
            
            else {
                console.log('沒有資料');
            }
            }).catch((error) => {
                alert('未知錯誤');
                console.error(error);
            });

            get(dbRef4).then((snapshot) => {
                if(snapshot.exists()) {
                    console.log('有抓到');
                  var data=snapshot.val();
                  setMessages3(Object.values(data));
        
                  console.log(messages3);
                  setidname(Object.keys(messages3));
                  console.log(idname);
                } 
                
                else {
                    console.log('沒有資料');
                }
                }).catch((error) => {
                    alert('未知錯誤');
                    console.error(error);
                });

                get(dbRef5).then((snapshot) => {
                    if(snapshot.exists()) {
                        console.log('有抓到');
                      var data=snapshot.val();
                      setMessages4(Object.values(data));
            
                      console.log(messages4);
                      setidname(Object.keys(messages4));
                      console.log(idname);
                    } 
                    
                    else {
                        console.log('沒有資料');
                    }
                    }).catch((error) => {
                        alert('未知錯誤');
                        console.error(error);
                    });
    }
    
    //股票價格爬蟲
    async function getStockprice(stocknum){
        console.log(Stocknum);
        try{
            const cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
            const url = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_"+stocknum+".tw&json=1&delay=0" ;
     
        let res1=await axios.get(`${cors}${url}`);

        console.log('爬～');
        var data1=res1.data.msgArray[0];;
        console.log(data1);
        console.log(data1.pz);
        console.log(data1.n);
        //alert(data1.z);
        setstockdata(data1);
        //return res1.data;
        return data1.pz;
        }
        catch(error){
            console.log(error);
            console.log("不存在的股票代碼，請確認後重新輸入");

        }
    }


    function Message({ idname,user_account, stock_name, stock_number,stock_price,time, State,result,BuyWay }) {
        return (
        <div class='postbuy'>
            
                <table  border={1} id="havestock">
                    <tr>
                    <td>股票名稱</td>
                    <td>數量</td>
                    <td>買賣方式</td>
                    <td>買賣價格</td>
                    <td>下單時間</td>
                    <td>交易狀態</td>
                    <td>交易結果</td>


                    </tr>
                    <tr>
                    <td>{stock_name}</td>
                    <td>{stock_number}</td>
                    <td>{BuyWay}</td>
                    <td>{stock_price}</td>
                    <td>{time}</td>
                    <td>{State}</td>
                    <td>{result}</td>

                    </tr>
                    </table>
        </div>
        );
      }
      function Message2({ idname,user_account, stock_name, stock_number,stock_price,time, State,result }) {
        return (
        <div class='postbuy'>
            
                <table  border={1} id="havestock">
                    <tr>
                    <td>股票名稱</td>
                    <td>持有數量</td>
                    <td>購買價格</td>
                    <td>購買時間</td>
                    <td>交易狀態</td>
                    <td>交易結果</td>


                    </tr>
                    <tr>
                    <td>{stock_name}</td>
                    <td>{stock_number}</td>
                    <td>{stock_price}</td>
                    <td>{time}</td>
                    <td>{State}</td>
                    <td>{result}</td>

                    </tr>
                    </table>
        </div>
        );
      }

    const schedule = require('node-schedule');
    const { scheduleJob } = require('node-schedule');
    var rule = new schedule.RecurrenceRule();
	rule.hour = new schedule.Range(10, 13);//每天10:00-13:00
	rule.minute = new schedule.Range(0, 59, 30);//每30分做一次
	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五

    const task1 = ()=>{        
          schedule.scheduleJob(rule, ()=>{
            console.log('開始執行交易'+ new Date());
          })
        }
    //task1();

     //取得使用者目前資產        
     const get_now_money=async(res,req)=>{
        alert('取得'+account+'現在金額');
        if(!web3){
            alert("web3未載入!");
            return;
        }
        try{
            let result= await contract_call(user_contract,'user_now_money',[account],{
              from:accounts[0],
              gas:6000000,
            });
            if (result) {
              setUserMoney(result);
              console.log(result);
              //console.log(success_or_not)
              //alert(result);
              //Navigate.push('Home/Register');
      
            } else {
              console.log(result)
              alert("取得"+account+"目前金額失敗");
            }
        }catch(error){
            alert("fail");
        }
    };

    //取得使用者最終金額
    const get_final_money=async(res,req)=>{
        console.log(user_final_money);
        const user_renew_money=async(res,req)=>{
            try{
                let user_renew_money = await contract_send(user_contract,'user_renew_money',[account,user_final_money],{
                  from:accounts[0],
                  gas:6000000,
                });
                console.log("更新使用者剩餘金額"+user_final_money);
                return user_renew_money;
            }catch(error){
                alert("fail");
                return false;
            }
          };

          user_renew_money();
          get_now_money();

      };
    
    //測試限價交易
    async function testcount(){
        var count2;
        count2=3
        console.log(count2);
        console.log('每30秒判斷一次');
        var moment = require('moment');
        const txn_time = moment().add(10, "s").toDate(); //即時交易處理時間下單後40分鐘
        var rule = new schedule.RecurrenceRule();
        //rule.hour = new schedule.Range(10, 13);
        rule.minute = new schedule.Range(45, 48);
        rule.second = new schedule.Range(0, 59, 30);
        //rule.minute = new schedule.Range(0, 59, 30);
        //rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五
        const jobtest=async()=>{
            var count3=2;
            schedule.scheduleJob(rule, async ()=>{
                console.log('開始執行限價交易'+ new Date());
                count3++;
                console.log(count3);
                if(count3==5){
                    console.log('finish');
                    //schedule.cancelJob(rule);
                    scheduleJob.cancel();
                    
                    console.log('關閉成功');
                }
            }); 
        }
        jobtest();

    }

    async  function schedulebuy(stock_name,stock_number){
        alert('訂單將在40分鐘後執行');
        var moment = require('moment');
        const txn_time = moment().add(40, "m").toDate(); //即時交易處理時間下單後40分鐘
        console.log(moment());
        console.log(txn_time);
        console.log('市價單將在'+txn_time+'進行處理');
        console.log(stock_name,stock_number);
        var stock1=stock_name;
        var stock2=stock_number;
        console.log(stock1,stock2);
        //const job1 = async(stock_name=messages[8].stock_name,stock_number=messages[8].stock_number)=>{
        const job1 = async(stock_name=stock1,stock_number=stock2)=>{

            schedule.scheduleJob(txn_time, async() => {
                console.log('開始執行交易'+ new Date());
                console.log(stock_name,stock_number);
                let result=await((getStockprice(stock_name))); //爬蟲
                console.log("等待爬蟲結果");
                console.log("現在交易價格"+result); //現在交易價格
                get_now_money(); //取得使用者目前資產
                let price=parseFloat(result);
                price=price.toFixed(3)+"";        
                console.log('浮點數：'+price);
                console.log('判斷是否有足夠餘額購買！');
                if(!web3){
                    alert("web3未載入!");
                    return;
                }
                try{
                    let result= await contract_call(stock_contract,'User_Can_Buy_OR_NOT',[account,user_money,stock_name,price,stock_number],{
                      from:accounts[0],
                      gas:6000000,
                    });
                    if (result) {
                      console.log(result);
                      let finalmoney;
                      console.log("!判斷餘額是否足夠"+stock_number);
                      let check=Object.values(result)[0];
                      console.log(check);
                      if(check === true){
                          console.log('餘額足夠購買'+stock_name+'股票'+stock_number+'股');
                          var final=(Object.values(result)[1]-Object.values(result)[2])/1000;
                          setUserFinalMoney(final);
                          console.log("最終金額"+final);
                          
                          //執行購買股票
                          const buy_stock=async(res,req)=>{
                            try{
                                let buy_stock = await contract_send(stock_contract,'User_Buy',[account,stock_name,price,stock_number],{
                                  from:accounts[0],
                                  gas:6000000,
                                });
                                console.log(buy_stock);
                                return buy_stock;
                            }catch(error){
                                alert("fail");
                                return false;
                            }
                          };
                          buy_stock();
                          get_final_money();

                          console.log("檢查是否持有該股票"+account+stock_name);
                          try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+account);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));

                                get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        console.log('exists!');
                                        const userData=snapshot.val();
                                        console.log("exists!", userData);
                                        let userhave=parseInt(Object.values(userData)[0].stock_number)+parseInt(stock_number);
                                        console.log('userhave:'+userhave);
                                        let userhave2=Object.keys(userData);
                                        console.log('userhave2:'+userhave2);

                                        //更新舊有資料
                                        const db=getDatabase();
                                        update(ref(db,'/Buy/'+account+'/'+userhave2),{
                                            stock_number:userhave,
                                            stock_price:price,
                                            time: Date(),
                                        });
                                    }
                                    else{
                                        console.log("not exists!");
                                        //將買入資料存入firebase
                                        const db=getDatabase();
                                        push(ref(db,'/Buy/'+account),{
                                            stock_name: stock_name,
                                            stock_price:price,
                                            stock_number:stock_number,
                                            time:Date(),
                                        });
                                    }
                                });
                          }catch(err){
                              console.log(err);
                          }
                          
                          try{
                            //更新資料庫交易狀態
                            const dbRef=ref(getDatabase());
                            const dbRef2 = child(dbRef,"/State/"+account);
                            const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                            //const dbRef4=query(dbRef3,orderByChild('State'),equalTo('waiting'));

                            get(dbRef3).then((snapshot)=>{
                                if(snapshot.exists()){
                                    const userData=snapshot.val();
                                    console.log("exists1", userData);
                                    let statekey=Object.keys(userData);
                                    console.log('statekey'+statekey);
                                    //更新交易結果
                                    const db=getDatabase();
                                    update(ref(db,'/State/'+account+'/'+statekey),{
                                        State:'success',
                                        result:'購買成功',
                                        time: Date(),
                                    });
                                    getdata();
                                }
                            });
                          }
                          catch(err){
                              console.log(err);
                          }
                          

                        }
                        else if(check=== false){
                            console.log('餘額不足無法購買'+stock_name+'股票'+stock_number+'股');
                            //更新資料庫交易狀態
                            const dbRef = ref(getDatabase());
                            const dbRef2 = child(dbRef,"/State/"+account);
                            const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                            get(dbRef3).then((snapshot)=>{
                                if(snapshot.exists()){
                                    const userData=snapshot.val();
                                    console.log("exists1", userData);
                                    let statekey=Object.keys(userData);
                                    console.log('statekey'+statekey);
                                    //更新交易結果
                                    const db=getDatabase();
                                    update(ref(db,'/State'+account+'/'+statekey),{
                                        State:'fail',
                                        result:'餘額不足無法購買',
                                        time: Date(),
                                    });
                                    getdata();
                                }
                            });
                        } 
                    }
                    
                }catch(err){
                    console.log(err);
                }        
            }
        )}
        await(job1());
    }


    return(
        <body>
            <div class='warp'>
                <div class='leftTransaction'>
                    <h1>股票交易模擬平台</h1>
                    <h4>{clock}</h4>
                    <p>{current_time}</p>
                        <Link to='/Home' id='nowpage'>使用者管理</Link>
                        <Link to='' id='BuyStock'>即時股價/買入</Link>
                        <Link to='/SellStock' id='SellStock'>已持有股票/賣出</Link>
                        <Link to='/TransactionStatus' id='TransactionStatus'>交易狀態</Link>
                        <Link to='/Discussion' id='Discussion'>系統討論版</Link>
                </div>
                <div class='rightTransaction'>
                    <div class='top'>
                            <Link to='/' id='logout'>登出</Link>
                    </div>
                    <div class='info'>
                    <p>Waiting</p>
                        {messages.map(message => 
                            <Message  idname={message.idname} stock_name={message.stock_name} BuyWay={message.HowBuy} stock_number={message.stock_number} stock_price={message.stock_price} time={message.time} State={message.State} result={message.result}></Message>
                        )}
                         {messages2.map(message => 
                            <Message  idname={message.idname} stock_name={message.stock_name} BuyWay={message.HowBuy} stock_number={message.stock_number} stock_price={message.want_price} time={message.time} State={message.State} result={message.result}></Message>
                        )}
                        <p>Success</p>
                        {messages3.map(message => 
                            <Message  idname={message.idname} stock_name={message.stock_name} BuyWay={message.HowBuy} stock_number={message.stock_number} stock_price={message.stock_price} time={message.time} State={message.State} result={message.result}></Message>
                        )}
                        <div class='failclass'>
                        <p>Fail</p>
                        {messages4.map(message => 
                            <Message  idname={message.idname} stock_name={message.stock_name} BuyWay={message.HowBuy} stock_number={message.stock_number} stock_price={message.stock_price} time={message.time} State={message.State} result={message.result}></Message>
                        )}
                       </div>

                    </div>
                </div>
            </div>
        </body>
    );

}
export default TransactionStatus;
//schedulebuy('6271','30')