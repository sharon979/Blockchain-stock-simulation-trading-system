import { RecurrenceRule } from 'node-schedule';
import { Job } from 'node-schedule';
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set,update, push, child,get, orderByChild, equalTo,startAt,remove} from "firebase/database";
import { query, orderBy, limit,getDocs,where } from "firebase/firestore";  
import { async } from '@firebase/util';
import axios from 'axios';
import { getContractInstance, contract_send, contract_call } from "./utils/getContract";


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
var nodata;




//交易處理價格爬蟲
async function getStockprice2(stocknum){
    console.log(stocknum);
    try{
        const cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
        const url = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_"+stocknum+".tw&json=1&delay=0" ;
 
    let res1=await axios.get(`${cors}${url}`);

    console.log('爬～');
    var data1=res1.data.msgArray[0];;
    console.log(data1);
    console.log(data1.pz);
    console.log(data1.n);
    //setstockdata(data1);
    return data1.pz;
    }
    catch(error){
        nodata=error;
        //console.log(error);
        console.log("不存在的股票代碼，請確認後重新輸入");
        return false;

    }
}


//取得使用者目前資產        
const get_now_money=async(user,web3,accounts,user_contract)=>{
    var usernowmoney;
    console.log('取得'+user+'現在金額');
    if(!web3){
        console.log("web3未載入!");
        return false;
    }
    try{
        let result= await contract_call(user_contract,'user_now_money',[user],{
        from:accounts[0],
        gas:6000000,
    });
    if (result) {
      usernowmoney=result;
      console.log(usernowmoney);
      return usernowmoney;
    } else {
      console.log(result)
      console.log("取得"+user+"目前金額失敗");
      return false;
    }
    }catch(error){
        console.log("fail");
    }
};


//限價交易(10:00-13:30)
export const limitorder=async(accounts,user_contract,web3,stock_contract)=>{
    console.log(accounts,user_contract,web3,stock_contract);
    console.log('盤中進行爬蟲');
    var rule = new schedule.RecurrenceRule();
    rule.hour = new schedule.Range(10, 13);
	rule.minute = new schedule.Range(0, 59,30);
    //rule.second = new schedule.Range(0, 59, 30);

	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五
    schedule.scheduleJob(rule, async function (fireDate) {
        
   
    const dbRef = ref(getDatabase());
    const dbRef2 = child(dbRef,"User"); //取得現有使用者 
    var userinfo=[]; //使用者
    var limitorder=[]; //限價訂單
    var i=0;
    var j=0;

    await(get(dbRef2).then(async(snapshot) => {
        if(snapshot.exists()){
            userinfo = snapshot.val();
            console.log(userinfo);
        }
        else{
            console.log("not exists!");
        }
    }));
    const long=Object.keys(userinfo).length;
    console.log(userinfo,long); //現有使用者數目
    for(i=0;i<long;i++){
        var user=Object.keys(userinfo)[i];
        console.log(user);
        const dbRef3 = child(dbRef,"/State/"+user+'/Waiting/Limit');
        await(get(dbRef3).then(async(snapshot) => {
            if(snapshot.exists()){
                limitorder = snapshot.val();
                //console.log(limitorder);
            }
            else{
                console.log("not exists!");
            }
        }));
        const long2=Object.keys(limitorder).length;
        console.log(long2); //現有限價單數目
        for(j=0;j<long2;j++){
            var stock_name=Object.values(limitorder)[j].stock_name;
            var stock_number=Object.values(limitorder)[j].stock_number;
            var stock_price=Object.values(limitorder)[j].now_price;
            var want_stock_price=Object.values(limitorder)[j].want_price;
            var ordertype=Object.values(limitorder)[j].State;
            var now_price;
            console.log(user+':'+stock_name,stock_number,want_stock_price,stock_price,ordertype);
            if(ordertype=='waitingsell'){
                console.log('限價賣出');
                now_price=false;
                if((now_price==false)||(now_price=='')){
                    console.log('沒爬到，用舊有資料');
                    if(parseFloat(want_stock_price)>parseFloat(stock_price)){
                        console.log('售價太高，等待下一輪比對');
                    }
                    else if(parseFloat(want_stock_price)<=parseFloat(stock_price)){
                        console.log('售價ok,以現在價格賣出');
                        let user_now_money=await(get_now_money(user,web3,accounts,user_contract)); //取得使用者目前資產
                        console.log(user_now_money);
                        let price=parseFloat(stock_price);
                        price=price.toFixed(3)+"";        
                        console.log('浮點數：'+price);
                        console.log('判斷是否有足夠股數賣出！');
                        if(!web3){
                            console.log('web3未載入');
                            return;
                        }
                        try{
                            let canbuy_result=await contract_call(stock_contract,'User_Can_Sell_OR_NOT',[user,user_now_money,stock_name,price,stock_number],{
                                from:accounts[0],
                                gas:6000000,
                            });
                            console.log(canbuy_result);
                            console.log("!判斷剩餘股數是否足夠賣出"+stock_name);
                            let check1=Object.values(canbuy_result)[0] //是否足夠股數賣出
                            let check2=Object.values(canbuy_result)[1] //現在餘額
                            let check3=Object.values(canbuy_result)[2] //最終賺得
                            console.log(check1,check2,check3);
                            if(check1===true){
                                console.log('剩餘股數足夠賣出'+stock_name+'股票'+stock_number+'股，開始執行賣出股票');
                                var final=(Number(check2)+Number(check3))/1000; 
                                console.log('最終金額'+final);
                            
                            //賣出股票
                            const sell_stock=async(res,req)=>{
                                try{
                                    let sell_stock = await contract_send(stock_contract,'User_Sell',[user,stock_name,price,stock_number],{
                                    from:accounts[0],
                                    gas:6000000,
                                });
                                console.log(sell_stock);
                                return sell_stock;
                                }catch(error){
                                    alert("fail");
                                    return false;
                                }
                            }
                            await(sell_stock());

                            //更新最終金額
                            async function get_final_money(final){
                                var finalmoneynow=final;
                                const user_renew_money=async(res,req)=>{
                                    try{
                                        let user_renew_money = await contract_send(user_contract,'user_renew_money',[user,finalmoneynow],{
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
                              await (get_final_money(final));

                              //檢查資料庫是否已持有該股票
                              try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+user);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
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
                                            update(ref(db, '/Buy/'+user+'/'+userhave2), {
                                            stock_number:userhave,
                                            stock_price: price,
                                            time: Date(),
                                            });
                                        }
                                        else{
                                            //剩餘股數為0
                                            const db = getDatabase();
                                            remove(ref(db,'/Buy/'+user+'/'+userhave2));
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
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
    
                                get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                       
                                        push(ref(db,'/State/'+user+'/Success'),{
                                            State:'success',
                                            HowBuy:'限價交易',
                                            result: '執行完畢',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                    }
                                });
                              }
                              catch(err){
                                console.log(err);
                              }
                            }
                            else if(check1 === false){
                                console.log('持有股票數不足無法賣出'+stock_name+'股票'+stock_number+'股');
                                //更新資料庫交易狀態
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                    get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));

                                        push(ref(db,'/State/'+user+'/Fail'),{
                                            State:'fail',
                                            HowBuy:'限價交易',
                                            result: '持有股票數不足無法賣出',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                }
                            });
                            }
                        }catch(err){
                            console.log(err);
                        }
                    }
                }
                else{
                    console.log('有爬到，用新資料');
                    if(parseFloat(want_stock_price)>parseFloat(now_price)){
                        console.log('賣價太高，等待下一輪比對');
                
                    }
                    else if(parseFloat(want_stock_price)<=parseFloat(now_price)){
                        console.log('售價ok,以現在價格買入');
                        let user_now_money=await(get_now_money(user,web3,accounts,user_contract)); //取得使用者目前資產
                        console.log(user_now_money);
                        let price=parseFloat(now_price);
                        price=price.toFixed(3)+"";        
                        console.log('浮點數：'+price);
                        console.log('判斷是否有足夠股數賣出！');
                        if(!web3){
                            console.log('web3未載入');
                            return;
                        }
                        try{
                            let canbuy_result=await contract_call(stock_contract,'User_Can_Sell_OR_NOT',[user,user_now_money,stock_name,price,stock_number],{
                                from:accounts[0],
                                gas:6000000,
                            });
                            console.log(canbuy_result);
                            console.log("!判斷剩餘股數是否足夠賣出"+stock_name);
                            let check1=Object.values(canbuy_result)[0] //是否足夠股數賣出
                            let check2=Object.values(canbuy_result)[1] //現在餘額
                            let check3=Object.values(canbuy_result)[2] //最終賺得
                            console.log(check1,check2,check3);
                            if(check1===true){
                                console.log('剩餘股數足夠賣出'+stock_name+'股票'+stock_number+'股，開始執行賣出股票');
                                var final=(Number(check2)+Number(check3))/1000; 
                                console.log('最終金額'+final);
                            
                            //賣出股票
                            const sell_stock=async(res,req)=>{
                                try{
                                    let sell_stock = await contract_send(stock_contract,'User_Sell',[user,stock_name,price,stock_number],{
                                    from:accounts[0],
                                    gas:6000000,
                                });
                                console.log(sell_stock);
                                return sell_stock;
                                }catch(error){
                                    alert("fail");
                                    return false;
                                }
                            }
                            await(sell_stock());

                            //更新最終金額
                            async function get_final_money(final){
                                var finalmoneynow=final;
                                const user_renew_money=async(res,req)=>{
                                    try{
                                        let user_renew_money = await contract_send(user_contract,'user_renew_money',[user,finalmoneynow],{
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
                              await (get_final_money(final));

                              //檢查資料庫是否已持有該股票
                              try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+user);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
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
                                            update(ref(db, '/Buy/'+user+'/'+userhave2), {
                                            stock_number:userhave,
                                            stock_price: price,
                                            time: Date(),
                                            });
                                        }
                                        else{
                                            //剩餘股數為0
                                            const db = getDatabase();
                                            remove(ref(db,'/Buy/'+user+'/'+userhave2));
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
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
    
                                get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                       
                                        push(ref(db,'/State/'+user+'/Success'),{
                                            State:'success',
                                            HowBuy:'限價交易',
                                            result: '執行完畢',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                    }
                                });
                              }
                              catch(err){
                                console.log(err);
                              }
                            }
                            else if(check1 === false){
                                console.log('持有股票數不足無法賣出'+stock_name+'股票'+stock_number+'股');
                                //更新資料庫交易狀態
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                    get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));

                                        push(ref(db,'/State/'+user+'/Fail'),{
                                            State:'fail',
                                            HowBuy:'限價交易',
                                            result: '持有股票數不足無法賣出',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                }
                            });
                            }
                        }catch(err){
                            console.log(err);
                        }
                    }
                }
            }
            else if(ordertype=='waitingbuy'){
                console.log('限價買入');
                now_price=false;
                if((now_price==false)||(now_price=='')){
                    console.log('沒爬到，用舊有資料');
                    if(parseFloat(want_stock_price)<parseFloat(stock_price)){
                        console.log('買價太低，等待下一輪比對');
                    }
                    else if(parseFloat(want_stock_price)>=parseFloat(stock_price)){
                        console.log('售價ok,以現在價格買入');
                        let user_now_money=await(get_now_money(user,web3,accounts,user_contract)); //取得使用者目前資產
                        console.log(user_now_money);
                        let price=parseFloat(stock_price);
                        price=price.toFixed(3)+"";        
                        console.log('浮點數：'+price);
                        console.log('判斷是否有足夠股數賣出！');
                        if(!web3){
                            console.log('web3未載入');
                            return;
                        }
                        try{
                            let canbuy_result=await contract_call(stock_contract,'User_Can_Buy_OR_NOT',[user,user_now_money,stock_name,price,stock_number],{
                                from:accounts[0],
                                gas:6000000,
                            });
                            console.log(canbuy_result);
                            console.log("!判斷剩餘股數是否足夠賣出"+stock_name);
                            let check=Object.values(canbuy_result)[0] 
                            console.log(check);
                            if(check===true){
                                console.log('餘額足夠購買'+stock_name+'股票'+stock_number+'股');
                                var final=(Object.values(canbuy_result)[1]-Object.values(canbuy_result)[2])/1000;
                                console.log('最終金額'+final);
                            
                            //執行購買股票
                            const buy_stock=async(res,req)=>{
                                try{
                                    let buy_stock = await contract_send(stock_contract,'User_Buy',[user,stock_name,price,stock_number],{
                                    from:accounts[0],
                                    gas:6000000,
                                });
                                console.log(buy_stock);
                                return buy_stock;
                                }catch(error){
                                    alert("fail");
                                    return false;
                                }
                            }
                            await(buy_stock());

                            //更新最終金額
                            async function get_final_money(final){
                                var finalmoneynow=final;
                                const user_renew_money=async(res,req)=>{
                                    try{
                                        let user_renew_money = await contract_send(user_contract,'user_renew_money',[user,finalmoneynow],{
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
                              await (get_final_money(final));

                              //檢查資料庫是否已持有該股票
                              try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+user);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                get(dbRef3).then((snapshot) => {
                                    if (snapshot.exists()){
                                        const userData = snapshot.val();
                                        console.log("exists!", userData);
                                        let userhave=parseInt(Object.values(userData)[0].stock_number)+parseInt(stock_number);
                                        console.log('userhave:'+userhave);
                                        let userhave2=Object.keys(userData);
                                        console.log('userhave2:'+userhave2);
                                        
                                        //更新舊有資料
                                        const db = getDatabase();
                                        update(ref(db, '/Buy/'+user+'/'+userhave2), {
                                        stock_number:userhave,
                                        stock_price: price,
                                        time: Date(),
                                        });
                
                                    }
                                    else{
                                        console.log("not exists!");
                                        //將買入資料存入firebase
                                         const db=getDatabase();
                                         push(ref(db,'/Buy/'+user),{
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
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
    
                                get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                       
                                        push(ref(db,'/State/'+user+'/Success'),{
                                            State:'success',
                                            HowBuy:'限價交易',
                                            result: '執行完畢',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                    }
                                });
                              }
                              catch(err){
                                console.log(err);
                              }
                            }
                            else if(check === false){
                                console.log('餘額不足無法購買'+stock_name+'股票'+stock_number+'股');
                                //更新資料庫交易狀態
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                    get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                        push(ref(db,'/State/'+user+'/Fail'),{
                                            State:'fail',
                                            HowBuy:'限價交易',
                                            result: '餘額不足無法購買',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                }
                            });
                            }
                        }catch(err){
                            console.log(err);
                        }
                    }
                }
                else{
                    if(parseFloat(want_stock_price)<parseFloat(now_price)){
                        console.log('買價太低，等待下一輪比對');
                    }
                    else if(parseFloat(want_stock_price)>=parseFloat(now_price)){
                        console.log('售價ok,以現在價格買入');
                        let user_now_money=await(get_now_money(user,web3,accounts,user_contract)); //取得使用者目前資產
                        console.log(user_now_money);
                        let price=parseFloat(now_price);
                        price=price.toFixed(3)+"";        
                        console.log('浮點數：'+price);
                        console.log('判斷是否有足夠股數賣出！');
                        if(!web3){
                            console.log('web3未載入');
                            return;
                        }
                        try{
                            let canbuy_result=await contract_call(stock_contract,'User_Can_Buy_OR_NOT',[user,user_now_money,stock_name,price,stock_number],{
                                from:accounts[0],
                                gas:6000000,
                            });
                            console.log(canbuy_result);
                            console.log("!判斷剩餘股數是否足夠賣出"+stock_name);
                            let check=Object.values(canbuy_result)[0] 
                            console.log(check);
                            if(check===true){
                                console.log('餘額足夠購買'+stock_name+'股票'+stock_number+'股');
                                var final=(Object.values(canbuy_result)[1]-Object.values(canbuy_result)[2])/1000;
                                console.log('最終金額'+final);
                            
                            //執行購買股票
                            const buy_stock=async(res,req)=>{
                                try{
                                    let buy_stock = await contract_send(stock_contract,'User_Buy',[user,stock_name,price,stock_number],{
                                    from:accounts[0],
                                    gas:6000000,
                                });
                                console.log(buy_stock);
                                return buy_stock;
                                }catch(error){
                                    alert("fail");
                                    return false;
                                }
                            }
                            await(buy_stock());

                            //更新最終金額
                            async function get_final_money(final){
                                var finalmoneynow=final;
                                const user_renew_money=async(res,req)=>{
                                    try{
                                        let user_renew_money = await contract_send(user_contract,'user_renew_money',[user,finalmoneynow],{
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
                              await (get_final_money(final));

                              //檢查資料庫是否已持有該股票
                              try{
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"Buy/"+user);
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                get(dbRef3).then((snapshot) => {
                                    if (snapshot.exists()){
                                        const userData = snapshot.val();
                                        console.log("exists!", userData);
                                        let userhave=parseInt(Object.values(userData)[0].stock_number)+parseInt(stock_number);
                                        console.log('userhave:'+userhave);
                                        let userhave2=Object.keys(userData);
                                        console.log('userhave2:'+userhave2);
                                        
                                        //更新舊有資料
                                        const db = getDatabase();
                                        update(ref(db, '/Buy/'+user+'/'+userhave2), {
                                        stock_number:userhave,
                                        stock_price: price,
                                        time: Date(),
                                        });
                
                                    }
                                    else{
                                        console.log("not exists!");
                                        //將買入資料存入firebase
                                         const db=getDatabase();
                                         push(ref(db,'/Buy/'+user),{
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
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
    
                                get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                       
                                        push(ref(db,'/State/'+user+'/Success'),{
                                            State:'success',
                                            HowBuy:'限價交易',
                                            result: '執行完畢',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                    }
                                });
                              }
                              catch(err){
                                console.log(err);
                              }
                            }
                            else if(check === false){
                                console.log('餘額不足無法購買'+stock_name+'股票'+stock_number+'股');
                                //更新資料庫交易狀態
                                const dbRef = ref(getDatabase());
                                const dbRef2 = child(dbRef,"/State/"+user+'/Waiting/Limit');
                                const dbRef3=query(dbRef2,orderByChild('stock_name'),equalTo(''+stock_name));
                                    get(dbRef3).then((snapshot)=>{
                                    if(snapshot.exists()){
                                        const userData=snapshot.val();
                                        console.log("exists1", userData);
                                        let statekey=Object.keys(userData);
                                        console.log('statekey'+statekey);
                                        //更新交易結果
                                        const db=getDatabase();
                                        remove(ref(db,"/State/"+user+'/Waiting/Limit/'+statekey));
                                        push(ref(db,'/State/'+user+'/Fail'),{
                                            State:'fail',
                                            HowBuy:'限價交易',
                                            result: '餘額不足無法購買',
                                            stock_price:price,
                                            stock_number:stock_number,
                                            stock_name:stock_name,
                                            time: Date(),
                                        });
                                }
                            });
                            }
                        }catch(err){
                            console.log(err);
                        }
                    }
                }
            }    
        }
    }
});
};

//進入開盤狀態排程（每日9:00）
export const start_opening_schedule = async(opennow,shutDown_txn) => {
    console.log('test!');
    console.log(opennow,shutDown_txn);
    console.log('開盤時間判斷');
	var rule = new schedule.RecurrenceRule();
	rule.hour = 9;
	rule.minute = 0;
	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五
    schedule.scheduleJob(rule, async function (fireDate) {
		console.log("----------------------------------------");
		if (shutDown_txn==true) {
			console.log('停止交易，不會進入開盤時間:'+shutDown_txn);
		} else {
			console.log('進入開盤時間:'+shutDown_txn);
            //更新開盤資料
            const db=getDatabase();
            update(ref(db, '/Global/'), {
                opennow:true,
            });
		}
		console.log("----------------------------------------");
	});
    
};

// * 進入收盤狀態排程(每日13:30)
export const start_closing_schedule = async(opennow,shutDown_txn) => {
    console.log('test!');
    console.log(opennow,shutDown_txn);
    console.log('收盤時間判斷');
    var rule = new schedule.RecurrenceRule();
	rule.hour = 13;
	rule.minute = 30;
	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五

    schedule.scheduleJob(rule, async function (fireDate) {
	    console.log("----------------------------------------");
			console.log('進入收盤時間:'+shutDown_txn);
            //更新開盤資料
            const db=getDatabase();
            update(ref(db, '/Global/'), {
                opennow:false,
            });
		
		console.log("----------------------------------------");
	});
};

//刪除Waiting訂單(每日13:40)
export const delet_waiting = async() => {
    console.log('刪除未處理訂單!');
    var rule = new schedule.RecurrenceRule();
	rule.hour = 13;
	rule.minute = 40;
	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五
    schedule.scheduleJob(rule, async function (fireDate) {
        const dbRef = ref(getDatabase());
        const dbRef2 = child(dbRef,"User");  
        var i=0;
        var j=0;
        var k=0;
        var userinfo=[];//使用者
        var waitinglimitdata=[];//剩餘資料
        var waitingmarketdata=[];//剩餘資料
    
            get(dbRef2).then(async(snapshot) => {
                if(snapshot.exists()){
                    userinfo = snapshot.val();
                    console.log(userinfo);
                }
                else{
                    console.log("not exists!");
                }
            
                const long=Object.keys(userinfo).length;
    
                console.log(long); //現有使用者數目
                for(i=0;i<long;i++){
                    const nowuser= Object.keys(userinfo)[i];
                    const db = getDatabase();
                    const dbRef2 = child(dbRef,"/State/"+nowuser+'/Waiting/Limit');
                    const dbRef3 = child(dbRef,"/State/"+nowuser+'/Waiting/Market');
                    get(dbRef2).then((snapshot)=>{
                        if(snapshot.exists()){
                            waitinglimitdata = snapshot.val();
                            console.log("exists!", waitinglimitdata);
                            const long2=Object.keys(waitinglimitdata).length;
                            console.log(long2);
                            for(j=0;j<long2;j++){
                                remove(ref(db,'/State/'+nowuser+'/Waiting/Limit/'+Object.keys(waitinglimitdata)[j]));
                            }
                        }
                        else{
                            console.log('已清空');
                        }
                    });
                    get(dbRef3).then((snapshot)=>{
                        if(snapshot.exists()){
                             waitingmarketdata = snapshot.val();
                             console.log("exists!", waitingmarketdata);
                             const long3=Object.keys(waitingmarketdata).length;
                             console.log(long3);
                             for(k=0;k<long3;k++){
                                remove(ref(db,'/State/'+nowuser+'/Waiting/Market/'+Object.keys(waitingmarketdata)[k]));
    
                             }
    
                        }
                        else{
                            console.log('已清空');
                        }
                    });
    
                }
            });
    });
}


// ＊更新股票總價值(每日15:30)
export const Total_Account_Value=async()=>{
    console.log('更新帳戶總價值');
    var rule = new schedule.RecurrenceRule();
	rule.hour = 15;
	rule.minute = 30;
	rule.dayOfWeek = new schedule.Range(1, 5); //每個禮拜一到五
    schedule.scheduleJob(rule, async function (fireDate) {
        const dbRef = ref(getDatabase());
        const dbRef2 = child(dbRef,"User");  
        var userinfo=[];//使用者
        var userStockData=[];//使用者持有股票
        var i=0;
        var j=0;

        async function getUser(){
             get(dbRef2).then(async(snapshot) => {
                if(snapshot.exists()){
                    userinfo = snapshot.val();
                    console.log(userinfo);
                }
                else{
                    console.log("not exists!");
                }
            
                const long=Object.keys(userinfo).length;
                console.log(long); //現有使用者數目
                for(i=0;i<long;i++){
                    console.log(i);
                    const dbRef3 = child(dbRef,"/Buy/"+Object.keys(userinfo)[i]);
                    const nowuser= Object.keys(userinfo)[i];
                    //console.log(Object.keys(userinfo)[i]);
                      get(dbRef3).then(async(snapshot) => {
                        if(snapshot.exists()){
                            userStockData=snapshot.val();
                            const longdata=Object.keys(userStockData).length;
                            console.log(longdata);
                            var totalvalue=0;
                            //console.log(Object.values(userStockData));
                            for(j=0;j<longdata;j++){
                                var totalvalue;
                                var totalprice;
                                var stock_name=Object.values(userStockData)[j].stock_name;
                                var stock_number=Object.values(userStockData)[j].stock_number;
                                var stock_price=Object.values(userStockData)[j].stock_price;
                                console.log(stock_name,stock_number,stock_price);
                                
                            
                                
                                let result=await((getStockprice2(stock_name))); //爬蟲
                                //let result=(getStockprice2(stock_name)); //爬蟲
                                if((result==false)||(result=='')){
                                    console.log('沒爬到，舊有資料');
                                    stock_price=parseFloat(stock_price).toFixed(3)+""; //歷史股價
                                    totalprice=stock_price*stock_number;
                                    totalvalue=totalvalue+totalprice;
                                }
                                else{
                                    console.log('有爬到'+result);
                                    stock_price=parseFloat(result).toFixed(3)+""; //現在股價
                                    totalprice=stock_price*stock_number;
                                    totalvalue=totalvalue+totalprice;

                                }
                                
                            }
                            console.log('股票總價值:'+totalvalue);
                            console.log(nowuser);
                            const db = getDatabase();
                            update(ref(db, '/User/'+nowuser),{
                                Total_stock_value:totalvalue,
                                time:Date(),
                            });
                        }
                        else{
                            console.log("not exists!");
                        }
                    });    
                }
                  
            });
        }
        await(getUser());
    });    
}
