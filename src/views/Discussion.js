import React, { Component,useState } from 'react';
import  {Link,useNavigate} from "react-router-dom";
import './Discussion.css';
import User from '../contracts/User.json';
import {connectfirebase} from "../utils/FireBaseConfig";
import firebase from 'firebase/compat/app';
import { initializeApp } from 'firebase/app';
import {getDatabase, ref, set, update, push, child,get} from "firebase/database";
import { connect_to_web3 } from "../utils/getWeb3";
import { getContractInstance, contract_send, contract_call } from "../utils/getContract";
import eth_addr from "../eth_contract.json";

import { async } from '@firebase/util';

//import * as firebase from "firebase";


const Discussion=()=>{
    const [web3,set_web3]=React.useState("");
    const [accounts, set_accounts] = React.useState([]);
    const [user_contract, set_user_contract] = React.useState(null);
    const [clock, set_clock]=React.useState([]);
    const [current_time,set_current_time]=React.useState([]);
    const [opennow,set_opennow]=React.useState([]);
    const [shutDown_txn,set_shutDown_txn]=React.useState([]);
    const [user, set_user] = React.useState(null);
    const Navigate = useNavigate();
    const [account,setAccount]=React.useState("");
    const [name,setUserName]=React.useState("");
    const [ButtonPop,setButtonPop] = React.useState(false);
    const [userpost,setUserPost]=React.useState("");
    //var [ifpost,setpost]=React.useState("");
    const [db,setdb]=React.useState("");
    const countpost=0;
    let [test,settest]=React.useState();
    const [messages, setMessages] = useState([]);
    let [allmessage,setallmessage]=React.useState();   

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
    
    //setdb(getDatabase());

    //const db = getDatabase();
    //const dbRef = ref(db, '/Discussion/post1');
    const starnum=0;
    var today = new Date();

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
    //初始連線firebase
	React.useEffect(() => {
		const load = async () => {
			let firebaseready = await connectfirebase();
			if (firebaseready) {
                setdb(firebaseready);
				alert("success");
			}
		};
		load();
	}, []);
    
*/
    /*
    React.useEffect(() => {
        const firebaseConfig = {
            apiKey: "AIzaSyA7BHjHS9v5GgKM79B530U2XSoJb3fbaow",
            authDomain: "blockchainstock-65b87.firebaseapp.com",
            projectId: "blockchainstock-65b87",
            storageBucket: "blockchainstock-65b87.appspot.com",
            messagingSenderId: "172308721496",
            appId: "1:172308721496:web:f10dc4f41271b804b37f2d",
            measurementId: "G-K0FGJ4N45P"
        };
        //為避免firebase被重複初始化要加入以下這段程式碼
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
          setdb(getDatabase);
          alert("success");
        }
      }, []);
    */
      
  //載入User
    React.useEffect(() => {
        const load=async()=>{
            let user_str = localStorage.getItem("user");
            if (user_str) {
                let user = JSON.parse(user_str);
                set_user(user);
                setAccount(user.useraccount);
                setUserName(user.username);
            }
        };
        load();
        getpostnum();
        getdata();
        console.log(messages);
        //getdata();

    }, []);

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

    //使用者發文加1個炒股幣
    const add_token=async()=>{
        console.log(account);
        if(!web3){
            alert("web3未載入!");
			return;
        }
        try{
            let result= contract_send(user_contract,'user_addtoken',[account],{
              from:accounts[0],
              gas:6000000,
            });
            if (result) {
              console.log(result);
              //console.log(success_or_not)
              console.log("炒股幣＋＋");
              //Navigate.push('Home/Register');
      
            } else {
              console.log(result)
              alert("加入炒股幣失敗");
            }
        }catch(error){
            console.log("fail");
        }
    }

    //取得發文者炒股幣數量
    const get_token=async(res,req)=>{
        console.log(account);
        
        try{
            let get_token = await contract_call(user_contract,'user_gettoken',[account],{
              from:accounts[0],
              gas:6000000,
            });
            console.log(get_token);
            return get_token;
        }catch(error){
            console.log("fail");
            return false;
        }
     
    }

    /*
    <div class='MessageContainer'>
    <div class='MessageHead'>
        <h1>{author}</h1>
        <h2>{time}</h2>
    </div>
    <p>{context}</p>
</div>
    */
    function post(author,time,context){
        var a=author;
        console.log(author+time+context);
        return (
            <p>author:{a}</p>
        )
    }
    
    const senddatabase=async()=>{
        //取得當前留言數
        //console.log(test);
        console.log(test); 
        test=test+1;

        //alert(getpost);
        //post=post+1;
        //console.log(post);
        //console.log(post);
        //alert(post);
        //getpost=getpost+1;
        //alert(getpost);
       //setpost(getpost);
        //console.log(getpost);

        const db = getDatabase();
        //const newKey = push(child(ref(db), 'Discussion')).key;
        /*set(ref(db, '/Discussion/'+newKey), {
            User: name,
            context: userpost,
            time: Date(),
          });
        */
          //let countpost=countpost+1;
          //alert(countpost);
          //alert(countpost);
          set(ref(db, '/Discussion/'+test), {
            User: name,
            context: userpost,
            time: Date(),
          });
          console.log("發布成功");
          set(ref(db, '/Howmanydiscussion/'), {
            number: test,
          });
          console.log("計算數量成功");
          getdata();
          getpostnum();
        /*
        alert("test");
        let getall = await getdata();
        alert(getall);
        */
    }
    const printdata=async()=>{
        const getall = await getdata();
        console.log(
            JSON.stringify(getall,function(key,value){
                if(key==="User"){
                    alert("success");
                }
            })  // 序列化成 JSON 字串
        );
        


        //alert(getall);
        //console.log(getall)
    }

    //取得現在留言數目
    const getpostnum=async(res,req)=>{
        console.log("開始取得留言數");
        const dbRef = ref(getDatabase());
        get(child(dbRef, 'Howmanydiscussion/')).then((snapshot) => {
            if(snapshot.exists()) {
              //const alldata=snapshot.val()
              //alert('有抓到'+alldata);
              let postnum=snapshot.val().number;
              settest(postnum);
              //console.log(postnum.number);
              //setpost=postnum.number;
              //console.log(setpost);
              //console.log(setpost);
              console.log(postnum);
              console.log(postnum);
              //return postnum.number;
              return postnum;
            
              //console.log(snapshot.val());
            } else {
                console.log('沒有資料');
              //console.log('沒有資料');
            }
            }).catch((error) => {
                console.log('未知錯誤');
                console.error(error);
            });        
    }
    
    const getdata=async(res,req)=>{
        //const db = getDatabase();
        console.log("開始抓資料");
       const dbRef = ref(getDatabase());
       /*
       for(var i=1;i<=test;i++){
               
       }
       */
       get(child(dbRef, 'Discussion/')).then((snapshot) => {
        if(snapshot.exists()) {
          //const alldata=snapshot.val()
          console.log('有抓到');
          var data=snapshot.val();
          //console.log(data);
          setMessages(data);
          //console.log(messages);
          //console.log(data.context);
        /*
          setallmessage(Object.keys(messages).map((message)=>{
            <Message author={message.User} time={message.time} context={message.context}></Message>
        }));
        */
    
         console.log(messages);   
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
      
        
        
        /*
            var ref = db.collection('Discussion');

            ref.get().then(querySnapshot => {
              querySnapshot.forEach(doc => {
                console.log(doc.id, doc.data());
              });
            });
        */
    }

    const finish =()=>{
        //const form = document.forms['form'];
        //取 elements 集合中 name 屬性為 name 的值
        var x = document.getElementById("userpost").value;
        setUserPost(x);
        console.log(x);
        post(name,Date(),x);
        //senddatabase();
        add_token();
        //showalert();
        //window.location.reload();

        //getdata();
        //getpostnum();
        //getpostnum();
        //senddatabase();
        //getdata();
        //取 elements 集合中 name 屬性為 email 的值
        //alert("你的姓名是 " + userpost);
    }

    const reload=()=>{
        senddatabase();
        window.location.reload();
    }

    const showalert=()=>{
        /*
        alert(
            '確定要送出嗎？',
            '送出之後全部人都會看到你的發文，記得遵守網路秩序和平討論',
            [
                {text: '確認', onPress: () => senddatabase()},
                {text: '取消', style: 'cancel'}, 
            ],
            {cancelable: false}
        )
        */
        var yes = window.confirm('你確定要送出嗎？送出之後全部人都會看到你的發文，記得遵守網路秩序和平討論');

        if (yes) {
            senddatabase();
        } else {
            alert('你按了取消按鈕');
        }
    }

    function Message({ author, time, context }) {
        return (
        <div class='post'>
            <div class='MessageHead'>
                <div class='MessageAuth'>
                    <h1>{author}</h1>
                </div>
                <div class='MessageTime'>
                    <h2>{time}</h2>
                </div>
                <div class='Messagebody'>
                    <p>{context}</p>
                </div>
            </div>
        </div>
      
        );
      }

    

    function Popup(props) {
        return (props.trigger)?(
            <div className="popup">
                <div className="popup-inner">
                    <button className="close-btn" onClick={()=>{senddatabase();props.setButtonPop(false)}}>close</button>
                        <form name='form' id='form'>
                            <h5>留言內容</h5>
                            <textarea  name="userpost" id='userpost' rows={8} />
                            <button  id='submit'  onClick={()=>{finish()}}>送出</button> 
                        </form>
                      
                </div>
            </div>
        ):"";
    }
    
    return (
        <body>
            <div class='warp'>
                <div class='leftDis'>   
                    <h1>股票交易模擬平台</h1>
                    <h4>{clock}</h4>
                    <p>{current_time}</p>
                    <Link to='/Home' id='nowpage'>使用者管理</Link>                        
                    <Link to='/BuyStock' id='BuyStock'>即時股價/買入</Link>
                    <Link to='/SellStock' id='SellStock'>已持有股票/賣出</Link>
                    <Link to='/TransactionStatus' id='TransactionStatus'>交易狀態</Link>
                    <Link to='' id='Discussion'>系統討論版</Link>
                    
                </div>                   
                <div class='rightDis'>
                    <h1>系統留言板</h1>
                    <p>寫下您對股票交易的心得吧！{name}</p>
                    <Link to='/' id='logout'>登出</Link>
    



                    <div class='Page'>
                    <button id='write' onClick={()=> setButtonPop(true)}>留言</button>

                    <Popup trigger={ButtonPop} setButtonPop={setButtonPop}/>
                    <div class='posthere'>
                    
                
                       {messages.map(message => (
                            <Message  author={message.User} time={message.time} context={message.context}></Message>
                    ))}
                                
                    </div>
                    </div>
                </div>
            </div>
        </body>
            
    );
   
    
    
    
    
       
}

export default Discussion;
