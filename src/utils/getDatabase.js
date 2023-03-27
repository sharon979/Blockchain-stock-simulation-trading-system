/*
 *  測試使用mongoose操作mongodb資料庫
 */
// 1. 連線資料庫
// 1.1 引入mongoose
const mongoose = require('mongoose')
// URi
const uri = "mongodb://localhost:27017/blockchain"
// 1.2 連線指定資料庫（URL只有資料庫是變化的）
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
// 1.3 獲取連線物件
const conn = mongoose.connection
// 1.4 繫結連線完成的監聽
conn.on('connected', () => { // 連線成功回撥
    console.log("資料庫連線成功~")
})


// 2. 得到對應特定集合的Model
// 2.1 字義Schema（描述文件結構）
/*
const userSchema = mongoose.Schema({
    username: {type: String, required: true}, // 使用者名稱
    password: {type: String, required: true}, // 密碼
    type: {type: String, required: true}, // 型別
    header: {type: String} // 頭像
})
*/
const userSchema = mongoose.Schema({
    name: {type: String, required: true}, // 使用者名稱
    post: {type: String, required: true}, // 密碼
})
// 2.2 定義Model（與集合對應，可以操作集合）
const UserModel = mongoose.model('discussion', userSchema)

// 3. CRUD
// 3.1 通過Model例項的save()新增資料
function testSave() {
    const userModel = new UserModel({
        name: 'Tom1',
        post: '大家來玩'
    })
    userModel.save(function (error, user) {
        console.log("save()", error, user)
    })
}

testSave()
