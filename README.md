# <img width="5%" src="docs/bank.png">Blockchain_Stock_Simulation_Trading_System

<br>這是一個模擬台灣證券交易所的股票交易平台</br>
<br>透過區塊鏈環境搭配智能合約技術，為用戶提供一個去中心化的交易平台，提升資料儲存安全性及降低交易手續費</br>

## 建置環境與技術需求

### Ethereum環境 
使用 [Ganache](https://trufflesuite.com/ganache/) 建置許可制私有鏈環境

### 智能合約開發與部署
使用 [solidity](https://docs.soliditylang.org/en/v0.8.19/) 開發撰寫智能合約並使用 [truffle](https://trufflesuite.com) 部署至私有鏈環境

### 前後端
使用 [React](https://react.dev) 進行前端開發搭配 [Node.js](https://nodejs.org/zh-tw/download) 作為後端伺服器

### 資料庫
Friebase [RealTime Database](https://firebase.google.com/docs/database?hl=zh-tw)

### 硬體需求
macOS [Monterey v12.2.1](https://support.apple.com/zh-tw/HT212585)

## 系統規則介紹
### 使用者管理頁面
  顯示使用者基本資訊，開盤時間為週ㄧ至週五上午9:00至13:30，收盤時間為週一至週五13:30後及週六日與國定假日。  
  每位使用者在初次註冊系統時，可獲得總資產200萬虛擬新台幣。

### 即時股價/買入頁面
  「目前總資產」為使用者現在剩餘資產，每筆交易執行完畢接會自動更新。  
  「帳戶總價值」為「目前總資產」＋「持有股票總價值」，會在每日收盤後3:10以收盤價進行計算並更新。  
   股票買入方式分為「限價單」、「市價單」，使用者可以依照需求進行下單。  

### 已持有股票/賣出頁面
  清單可以看到持有股票、數量、買入時間等基本資料。  
  股票賣出方式分為「限價單」、「市價單」，使用者可以依照需求進行下單。   

### 交易狀態
  交易狀態分為「Waiting」、「Success」、「Fail」三種狀態。   
  在失敗的狀態中可以查看買入/賣出的失敗原因。   

### 班級討論版
  使用者可以透過討論版發表投資心得。   
  每發表一份心得可以賺取一個虛擬貨幣做為鼓勵。   




