import './SellStock.css';
import React, { Component,useState } from 'react';
import  {Link,useNavigate} from "react-router-dom";
import searchicon from '../search.png';
import heart2 from '../heart-2.png';
import salary from '../salary.png';
import assets from '../assets.png';
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set,update, push, child,get, orderByChild, equalTo,startAt, remove} from "firebase/database";
import { query, orderBy, limit,getDocs,where } from "firebase/firestore";  
import axios from 'axios';
import Stock from '../contracts/Stock.json';
import User from '../contracts/User.json';
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";
import { async } from '@firebase/util';


const SellStock=()=>{
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
    const [user_stock_value,setUserStockVlaue]=React.useState("");
    const [user_total_value,setUserTotalVlaue]=React.useState("");
    const [user_final_money,setUserFinalMoney]=React.useState("");
    const [ButtonPop,setButtonPop] = React.useState(false);
    let [test,settest]=React.useState();
    const [messages, setMessages] = useState([]);
    const schedule = require('node-schedule');
    const { scheduleJob } = require('node-schedule');
    const [clock, set_clock]=React.useState([]);
    const [current_time,set_current_time]=React.useState([]);
    const [opennow,set_opennow]=React.useState([]);
    const [shutDown_txn,set_shutDown_txn]=React.useState([]);
    var [idname, setidname]=useState([]);

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
                let result= await contract_call(user_contract,'user_now_money',[nowaccount],{
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
            //取得使用者股票總價值
            const stock_value=async(res,req)=>{
                console.log('取得'+account+'股票總價值');
                const dbRef = ref(getDatabase());
                const dbRef2 = child(dbRef,"/User/"+account);  
                get(dbRef2).then((snapshot) => {
                    if(snapshot.exists()){
                        const userStock = snapshot.val();
                        console.log(userStock.Total_stock_value);
                        setUserStockVlaue(userStock.Total_stock_value);
                    }
                    else{
                        console.log('沒有資料');
                    }
                });
            }
        
        get_now_money();
        stock_value();
        //job();
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
    console.log('user_money'+user_money,'user_stock_value'+user_stock_value);
    var money1=parseFloat(user_money)
    var money2=parseFloat(user_stock_value)
    var money3=money1+money2;
    setUserTotalVlaue(money3);
    console.log('總價值'+money3);
},[opennow,shutDown_txn,clock,user_money,user_stock_value]);

 

    function reload(){
        get_now_money();
        getdata();

    }
    
    //取得現在資產
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
              console.log(user_money);
              //console.log(success_or_not)
              //alert(result);
              //Navigate.push('Home/Register');
      
            } else {
              console.log(result)
              console.log("取得"+account+"目前金額失敗");
            }
        }catch(error){
            console.log("fail");
        }
    };

    async function getStockprice(stocknum){
        console.log(Stocknum);
        try{
            const cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
            const url = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_"+stocknum+".tw&json=1&delay=0" ;

        let res1=await axios.get(`${cors}${url}`);

        console.log('爬～');
        //console.log(res1.data);
        var data1=res1.data.msgArray[0];;
        console.log(data1);
        //var u  = data1.map(v => v.u);
        console.log(data1.pz);
        console.log(data1.n);
      
        console.log(data1.z);
        await(setstockdata(data1));
        await(Popup(setButtonPop(true)));
        return res1.data;
        }
        catch(error){
            console.log(error);
            console.log("不存在的股票代碼，請確認後重新輸入");

        }
    }

     //交易處理價格爬蟲
    async function getStockprice2(stocknum){
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
        setstockdata(data1);
        return data1.pz;
        }
        catch(error){
            console.log(error);
            console.log("不存在的股票代碼，請確認後重新輸入");
        }
    }

    //取得已購買股票
    const getdata=async(res,req)=>{
        //const db = getDatabase();
        console.log("開始抓資料");
       const dbRef = ref(getDatabase());
       //const q = query(dbRef, orderBy("user_account"), limit(2));


       const dbRef2 = child(dbRef,"Buy/"+account);
       //const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stockdata.c));

        console.log(account);
       /*
       for(var i=1;i<=test;i++){
               
       }
       */
       get(dbRef2).then((snapshot) => {
        //child(dbRef, 'Buy/')
        if(snapshot.exists()) {
          //const alldata=snapshot.val()
          console.log('有抓到');
          var data=snapshot.val();
          //console.log(data);
          setMessages(Object.values(data));

          console.log(messages);
          setidname(Object.keys(messages));
          console.log(idname);

          //console.log(data.context);
        /*
          setallmessage(Object.keys(messages).map((message)=>{
            <Message author={message.User} time={message.time} context={message.context}></Message>
        }));
        */
       /*
        console.log(data[1].user_account);
        const i=1;
        for(i=1;i<=test;i++){
            if(data[i].user_account=accounts){
                userbuy.add(data[i]);
            }
        }
        console.log(userbuy);
        */
        //console.log(messages[2].user_account);   
       //console.log(setallmessage);

          //console.log(snapshot.val());
        } 
        
        else {
            console.log('沒有資料');
          //console.log('沒有資料');
        }
        }).catch((error) => {
            console.log('未知錯誤');
            console.error(error);
        });
    }

    function Message({ idname,user_account, stock_name, stock_number,stock_price,time }) {
        let i=0;
        return (
        <div class='postbuy'>
            
                <table  border={1} id="havestock">
                    <tr>
                    <td>股票名稱</td>
                    <td>持有數量</td>
                    <td>購買價格</td>
                    <td>購買時間</td>
                    <td>我要售出</td>

                    </tr>
                    <tr>
                    <td>{stock_name}</td>
                    <td>{stock_number}</td>
                    <td>{stock_price}</td>
                    <td>{time}</td>
                    <td><button  class="sell"  id={stock_name}  onClick={(e)=>{want_sell_stock(e.target.id)}}>售出</button></td>
                    </tr>
                    </table>
        </div>
        );
      }

      //想售出股票
    const want_sell_stock=(thisbutton)=>{
        console.log("我要售出");
        console.log(thisbutton);
        setStocknum(thisbutton);
        //爬取選擇的股票
        console.log(thisbutton);
        getStockprice(thisbutton);
        //getStockprice();
        //var btn = document.getElementsByTagName("button");
    }
    
    //
    const can_sell_or_not=async(res,req)=>{
        get_now_money();
        var x = document.getElementById("TransactionType").value;
        var y = document.getElementById("share").value;
        let price=parseFloat(stockdata.z);
        price=price.toFixed(3)+"";        
        
        //let nowprice=price.toString;
        console.log('浮點數：'+price);
        //console.log('字串：'+nowprice);
        console.log('判斷是否有足夠股數賣出股票！');
        if(!web3){
            console.log("web3未載入!");
			return;
        }
        try{
            let result= await contract_call(stock_contract,'User_Can_Sell_OR_NOT',[account,user_money,stockdata.c,price,y],{
                from:accounts[0],
                gas:6000000,
            });
            if(result){
                console.log(result);
                alert("!判斷剩餘股數是否足夠賣出"+y);
                let check1=Object.values(result)[0] //是否足夠股數賣出
                let check2=Object.values(result)[1] //現在餘額
                let check3=Object.values(result)[2] //最終賺得
                console.log(check1,check2,check3);
                if(check1===true){
                    //console.log('剩餘股數足夠賣出'+stockdata.c+'股票'+y+'股，開始執行賣出股票');
                    console.log('剩餘股數足夠賣出'+stockdata.c+'股票'+y+'股，開始執行賣出股票');
                    var final=(Number(check2)+Number(check3))/1000; //有錯！！！！
                    //var finaltest=(Number(check2)+Number(check3))/1000; //有錯！！！！

                    setUserFinalMoney(final);
                    alert('最終金額'+final);
                    console.log('最終金額'+final);
                    //console.log('最終金額測試'+finaltest);



                    //賣出股票
                    const sell_stock=async(res,req)=>{
                        try{
                            let sell_stock = await contract_send(stock_contract,'User_Sell',[account,stockdata.c,price,y],{
                            from:accounts[0],
                            gas:6000000,
                        });
                        console.log(sell_stock);
                        return sell_stock;
                        }catch(error){
                            alert("fail");
                            return false;
                        }
                    };
                    sell_stock();
                    //資料庫檢查是否已經持有該股票
                    console.log('檢查資料庫是否已經持有該股票'+account+stockdata.c);
                    try{
                        const dbRef = ref(getDatabase());
                        const dbRef2 = child(dbRef,"Buy/"+account);
                        const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stockdata.c));
                        get(dbRef3).then((snapshot) => {
                            if (snapshot.exists()){
                                const userData = snapshot.val();
                                console.log("exists!", userData);
                                let userhave=parseInt(Object.values(userData)[0].stock_number)-parseInt(y);
                                console.log('userhave:'+userhave);
                                let userhave2=Object.keys(userData);
                                console.log('userhave2:'+userhave2);
                                if(userhave!=0){
                                    //更新舊有資料
                                    const db = getDatabase();
                                    update(ref(db, '/Buy/'+account+'/'+userhave2), {
                                    stock_number:userhave,
                                    stock_price: price,
                                    time: Date(),
                                    });
                                    getdata();
                                }
                                else{
                                    //剩餘股數為0
                                    const db = getDatabase();
                                    remove(ref(db,'/Buy/'+account+'/'+userhave2));
                                    getdata();

                                }
                              
  
                            }
                            else{
                                console.log("not exists!");
                                //將買入資料存入firebase
                                }
                        });
  
                    }catch(err){
                        console.log(err);
                    }

                }
                else if(check1 === false){
                    //alert('持有股票數不足無法賣出'+stockdata.c+'股票'+y+'股');
                    console.log('持有股票數不足無法賣出'+stockdata.c+'股票'+y+'股');
                }
            }else{
                console.log(result);
                alert('判斷股數是否足夠賣出'+y+'失敗');
            }
        }catch(err){
            console.log(err);
        }

    };
    


    function likestock(){
        console.log('加入喜好');
        if(!web3){
            alert("web3未載入!");
			return;
        }
        try{
            let result= contract_send(stock_contract,'UserLike',[account,stockdata.c,stockdata.y],{
              from:accounts[0],
              gas:6000000,
            });
            if (result) {
              console.log(result);
              //console.log(success_or_not)
              console.log("已儲存喜好股票"+stockdata.c);
              //Navigate.push('Home/Register');
      
            } else {
              console.log(result)
              console.log("儲存喜好股票"+stockdata.c+"失敗");
            }
        }catch(error){
            alert("fail");
        }
        //document.getElementById('notlike').src="./heart-2.png";
    }

    async function get_final_money(final){
        var finalmoneynow=final;
        console.log(user_final_money);
        const user_renew_money=async(res,req)=>{
            try{
                let user_renew_money = await contract_send(user_contract,'user_renew_money',[account,finalmoneynow],{
                  from:accounts[0],
                  gas:6000000,
                });
                console.log("更新使用者剩餘金額"+finalmoneynow);
                return user_renew_money;
            }catch(error){
                alert("fail");
                return false;
            }
          };

          await(user_renew_money());
          //await(get_now_money());

      };
    
      //將訂單存至等待賣出執行佇列
    const waiting_sell_order=async(res,req)=>{
        var x = document.getElementById("TransactionType").value;
        var y = document.getElementById("share").value;
        var z = document.getElementById("wantprice").value;
        console.log(x,y,z);
        //市價交易
        if(x==1){
            console.log('市價交易');
            let price=parseFloat(stockdata.z);
            price=price.toFixed(3)+""; 
            console.log('浮點數：'+price);
            const db = getDatabase();
            push(ref(db, '/State/'+account+'/Waiting/Market'), {
                stock_name: stockdata.c,
                stock_price: price,
                stock_number:y,
                time: Date(),
                HowBuy: '市價交易',
                State: 'waitingsell',
                result: '尚未執行'
            });
            await(setButtonPop(false));
            await(schedulesell(stockdata.c,y));
        }
        else if(x==2){
            console.log('限價交易');
            let price=parseFloat(stockdata.z);
            price=price.toFixed(3)+"";  
            console.log('股數：'+y);
            console.log('想要價格'+z);
            const db = getDatabase();
            push(ref(db, '/State/'+account+'/Waiting/Limit'), {
                stock_name: stockdata.c,
                want_price: z,
                now_price:price,
                stock_number:y,
                time: Date(),
                HowBuy: '限價交易',
                State: 'waitingsell',
                result: '尚未執行'
            });
        }
        
   
    }

    async function schedulesell(stock_name,stock_number){
        alert('市價訂單將在40分鐘後執行');
        var moment = require('moment');
        const txn_time = moment().add(40, "m").toDate(); //即時交易處理時間下單後40分鐘
        console.log(moment());
        console.log(txn_time);
        console.log('市價單將在'+txn_time+'進行處理');
        console.log(stock_name,stock_number);
        var stock1=stock_name;
        var stock2=stock_number;
        console.log(stock1,stock2);
        const job2 = async(stock_name=stock1,stock_number=stock2)=>{
            schedule.scheduleJob(txn_time, async() => {
                console.log('開始執行交易'+ new Date());
                console.log(stock_name,stock_number);
                let result=await((getStockprice2(stock_name))); //爬蟲
                console.log("等待爬蟲結果");
                console.log("現在交易價格"+result); //現在交易價格
                get_now_money(); //取得使用者目前資產
                let price=parseFloat(result);
                price=price.toFixed(3)+"";        
                console.log('浮點數：'+price);
                console.log('判斷是否有足夠股數賣出！');
                if(!web3){
                    alert("web3未載入!");
                    return;
                }
                try{
                    let result= await contract_call(stock_contract,'User_Can_Sell_OR_NOT',[account,user_money,stock_name,price,stock_number],{
                        from:accounts[0],
                        gas:6000000,
                    });
                    if(result){
                        console.log(result);
                        console.log("!判斷剩餘股數是否足夠賣出"+stock_name);
                        let check1=Object.values(result)[0] //是否足夠股數賣出
                        let check2=Object.values(result)[1] //現在餘額
                        let check3=Object.values(result)[2] //最終賺得
                        console.log(check1,check2,check3);
                        if(check1===true){
                            //alert('剩餘股數足夠賣出'+stock_name+'股票'+stock_number+'股，開始執行賣出股票');
                            console.log('剩餘股數足夠賣出'+stock_name+'股票'+stock_number+'股，開始執行賣出股票');
                            var final=(Number(check2)+Number(check3))/1000; //有錯！！！！
                            //var finaltest=(Number(check2)+Number(check3))/1000; //有錯！！！！
                            await(setUserFinalMoney(''+final));
                            console.log('最終金額'+final);

                            //賣出股票
                            const sell_stock=async(res,req)=>{
                                try{
                                    let sell_stock = await contract_send(stock_contract,'User_Sell',[account,stock_name,price,stock_number],{
                                    from:accounts[0],
                                    gas:6000000,
                                });
                                console.log(sell_stock);
                                return sell_stock;
                                }catch(error){
                                    alert("fail");
                                    return false;
                                }
                            };
                            await(sell_stock());
                            await(get_final_money(final));
                            get_now_money();

                            //資料庫檢查是否已經持有該股票
                            console.log('檢查資料庫是否已經持有該股票'+account+stockdata.c);
                            try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+account);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stockdata.c));
                                get(dbRef3).then((snapshot) => {
                                    if (snapshot.exists()){
                                        const userData = snapshot.val();
                                        console.log("exists!", userData);
                                        let userhave=parseInt(Object.values(userData)[0].stock_number)-parseInt(stock_number);
                                        console.log('userhave:'+userhave);
                                        let userhave2=Object.keys(userData);
                                        console.log('userhave2:'+userhave2);
                                        if(userhave!=0){
                                            //更新舊有資料
                                            const db = getDatabase();
                                            update(ref(db, '/Buy/'+account+'/'+userhave2), {
                                            stock_number:userhave,
                                            stock_price: price,
                                            time: Date(),
                                            });
                                            getdata();
                                        }
                                        else{
                                            //剩餘股數為0
                                            const db = getDatabase();
                                            remove(ref(db,'/Buy/'+account+'/'+userhave2));
                                            getdata();
        
                                        }
                                    }
                                    else{
                                        console.log("not exists!");
                                        //將買入資料存入firebase
                                    }
                                });
          
                            }catch(err){
                                console.log(err);
                            }
                                           
                          try{
                            //更新資料庫交易狀態
                            const dbRef=ref(getDatabase());
                            const dbRef2 = child(dbRef,"/State/"+account+'/Waiting/Market');
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
                                    remove(ref(db,"/State/"+account+'/Waiting/Market/'+statekey));
                                   
                                    push(ref(db,'/State/'+account+'/Success'),{
                                        State:'success',
                                        HowBuy:'市價交易',
                                        result: '執行完畢',
                                        stock_price:price,
                                        stock_number:stock_number,
                                        stock_name:stock_name,
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
                        else if(check1 === false){
                            //alert('持有股票數不足無法賣出'+stock_name+'股票'+stock_number+'股');
                            console.log('持有股票數不足無法賣出'+stock_name+'股票'+stock_number+'股');
                            //更新資料庫交易狀態
                            const dbRef = ref(getDatabase());
                            const dbRef2 = child(dbRef,"/State/"+account+'/Waiting/Market');
                            const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                            get(dbRef3).then((snapshot)=>{
                                if(snapshot.exists()){
                                    const userData=snapshot.val();
                                    console.log("exists1", userData);
                                    let statekey=Object.keys(userData);
                                    console.log('statekey'+statekey);
                                    //更新交易結果
                                    const db=getDatabase();
                                    remove(ref(db,"/State/"+account+'/Waiting/Market/'+statekey));
                                    push(ref(db,'/State/'+account+'/Fail'),{
                                        State:'fail',
                                        HowBuy:'市價交易',
                                        result: '持有股票數不足無法賣出',
                                        stock_price:price,
                                        stock_number:stock_number,
                                        stock_name:stock_name,
                                        time: Date(),
                                    });
                                    getdata();
                                }
                            });
                        }   
                    }else{
                        console.log(result);
                        console.log('判斷股數是否足夠賣出'+stock_name+'失敗');
                    }
                }catch(err){
                    console.log(err);
                }
            }
        )}
        await(job2());

    }

    function Popup(props) {
        return (props.trigger)?(
            <div className="popup">
                <div className="popup-inner">
                <button className="close-btn" onClick={()=>{props.setButtonPop(false);window.location.reload()}}>close</button>
                        <form name='form' id='form'>
                        <button class="like-btn"  onClick={()=>{likestock()}}><img id='notlike' src={heart2}/></button>
                        <h1>{stockdata.n}</h1>
                        <h2>成交價：{stockdata.z}</h2>
                        <h3>累積成交量：{stockdata.v}</h3>
                        <h3>開盤：{stockdata.o}</h3>
                        <h3>當日最高：{stockdata.h}</h3>
                        <h3>當日最低：{stockdata.l}</h3>
                        <h3>昨收：{stockdata.y}</h3>
                        <h3>漲跌幅：{((stockdata.z-stockdata.y)/stockdata.y)*100}%</h3>
                        </form>

                        <select class='Transaction' id='TransactionType'>
                            <option value>請選擇交易類型</option>
                            <option value='1'>市價交易</option>
                            <option value='2'>限價交易</option>
                        </select>
                        <input class='inputshare' type="text" id='share' placeholder="數入賣出股數"/>
                        <input class='inputprice' type="text" id='wantprice' placeholder="限價交易賣出價格"/>
                        <button class="cancel"  onClick={()=>{props.setButtonPop(false)}}>取消交易</button>
                        <button class="submit"  onClick={()=>{waiting_sell_order()}}>確認送出</button>
                </div>
            </div>
        ):"";
    }
    
    return (
        <body>
        <div class='warp'>
            <div class='leftSell'>
                <h1>股票交易模擬平台</h1>
                <h4>{clock}</h4>
                <p>{current_time}</p>
                <Link to='/Home' id='nowpage'>使用者管理</Link>
                <Link to='' id='BuyStock'>即時股價/買入</Link>
                <Link to='/SellStock' id='SellStock'>已持有股票/賣出</Link>
                <Link to='/TransactionStatus' id='TransactionStatus'>交易狀態</Link>
                <Link to='/Discussion' id='Discussion'>系統討論版</Link>
                
            </div>                   
            <div class='rightSell'>
                <div class='topsell'>
                    <Link to='/' id='logout'>登出</Link>
                </div>
               <div class='searchsell'>
               <Popup trigger={ButtonPop} setButtonPop={setButtonPop}/>

                    <div class='leftbox'>
                        <img src={salary} alt='salary'/>
                        <h3>目前總資產</h3>
                        <h2>{user_money}</h2>
                        <p>交易後即時更新</p>
                    </div>
                    <div class='rightbox'>
                        <img src={assets} alt='assets'/>
                        <h3>股票總價值</h3>
                        <h2>{user_total_value}</h2>
                        <p>每天下午3:30更新</p>
                    </div>
               </div>
                <div class='info'>
            
                {messages.map(message => 
                    <Message  idname={message.idname} stock_name={message.stock_name} stock_number={message.stock_number} stock_price={message.stock_price} time={message.time}></Message>
                )}

                </div>
            
            </div>
        </div>
    </body>
    
);
}
export default SellStock;