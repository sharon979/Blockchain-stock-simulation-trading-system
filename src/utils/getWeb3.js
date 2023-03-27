import Web3 from 'web3';
//const Web3 = require('web3');
//const ethereumUri = 'http://127.0.0.1:8545';
const ethereumUri = 'http://127.0.0.1:7545';


//let web3 = new Web3();

//web3.setProvider(new web3.providers.HttpProvider(ethereumUri));

// 連結 web3

export const connect_to_web3 = async () => {
	try {
		const provider = new Web3.providers.HttpProvider(ethereumUri);
        let web3=new Web3(provider);
        await web3.eth.net.getId();
        //console.log("No web3 instance injected, using Local web3.");
        return web3;
        
	} catch (error) {
		console.log(error);
		return null;
	}
};
//module.exports=connect_to_web3;
/*
// 取得區塊鏈上常用資訊
export const get_blockchain_info = async (web3) => {
	try {
		let accounts = await web3.eth.getAccounts(); //所有帳戶
		let is_mining = await web3.eth.isMining(); //是否正在挖礦
		let coinbase = await web3.eth.getCoinbase(); //挖礦獎勵帳戶
		let node_info = await web3.eth.getNodeInfo(); //節點資訊
		let gas_price = await web3.eth.getGasPrice(); //燃料
		let block_number = await web3.eth.getBlockNumber(); //目前區塊編號
		let network_id = await web3.eth.net.getId(); //網路id
		let is_listening = await web3.eth.net.isListening(); //是否正在監聽
		let peer_count = await web3.eth.net.getPeerCount(); //節點數量
		let default_account = web3.eth.defaultAccount; //預設操作帳戶
		let default_chain = web3.eth.defaultChain; //網路類型

		return {
			accounts,
			is_mining,
			coinbase,
			node_info,
			gas_price,
			block_number,
			network_id,
			is_listening,
			peer_count,
			default_account,
			default_chain,
		};
	} catch (error) {
		console.log(error);
		return null;
	}
};

/*
if(!web3.isConnected()){
    throw new Error('unable to connect to ethereum node at ' + ethereumUri);
}else{
    console.log('connected to ehterum node at ' + ethereumUri);
    let coinbase = web3.eth.coinbase;
    console.log('coinbase:' + coinbase);
    let balance = web3.eth.getBalance(coinbase);
    console.log('balance:' + web3.fromWei(balance, 'ether') + " ETH");
    let accounts = web3.eth.accounts;
    console.log(accounts);
}
*/
