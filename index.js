const line = require('@line/bot-sdk');
const express = require('express');
const bodyParser = require('body-parser');

//const firebaseAdmin = require('firebase-admin');
//const provider = new firebase.auth.GoogleAuthProvider()
/*
var userDatas = {
  foo: { "email": "example@example.com", "password": "foo", "messageDict": "" }
};
*/
var userDatas = { "testid": "dummy" };
var ids = ["33r43(ID)"];

//import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
const firebase = require('firebase/app');
const firebaseAuth = require('firebase/auth');
//const { getAuth } = require("firebase-admin/auth");


//firebaseの認証情報
const firebaseConfig = {
  apiKey: "AIzaSyAFHhTw4lUNSphTToflfGR4xlCrHZSBglY",
  authDomain: "test-6921c.firebaseapp.com",
  projectId: "test-6921c",
  storageBucket: "test-6921c.appspot.com",
  messagingSenderId: "328972503263",
  appId: "1:328972503263:web:870f5c8c6618d8a05fc16a",
  measurementId: "G-HSTBXVGJ9V"
};

// firebase appの初期化
firebase.initializeApp(firebaseConfig);
//const auth = firebase.auth();
//const auth = getAuth();

// 環境変数からチャネルアクセストークンとチャネルシークレットを取得する
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
// LINE クライアントを生成する : `channelSecret` が未定義だと例外が投げられる
const client = new line.Client(config);
//const auth = getAuth();
// Express アプリを生成する
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});


// LINE Bot SDK が提供するミドルウェアを挟み込み、リクエストヘッダの署名検証や JSON パースなどを任せてしまう
app.post('/callback', line.middleware(config), (req, res) => {
  //console.log("hello");
  //console.log(client);
  res.send(client);
  // 1回のリクエストに複数のメッセージが含まれていたりすることもあるので
  // イベントの配列を1件ずつ取得して処理してやる
  const events = req.body.events;
  Promise.all(events.map((event) => {
    // イベント1件を処理する・エラー時も例外を伝播しないようにしておく
    return handleEvent(event).catch(() => { return null; });
  })
    .then((result) => {
      // 全てのイベントの処理が終わったら LINE API サーバには 200 を返す
      res.status(200).json({}).end();
    }))
});

//app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
//アクセスされたらメッセージ送信
app.get('/push', (req, res) => {
  broadCastMessage();
});

app.get('/login', (req, res) => res.sendFile(__dirname + '/login.html'));

//C#からの通信を得てLINEのIDを識別、メッセージ送信
app.post('/sendid', (req, res) => {
  console.log("send UID");
  console.log(req + '\n-----------------------------------------------------------------------------------');
  console.log(req.body.uid);
  console.log(req.body.lineId);
  //console.log(req.query.uid);
  res.status(200).json({}).end();
  userDatas[req.body.uid] = req.body.lineId;
  userDatas[req.body.lineId] = req.body.uid;
});

app.post('/serveMessage', (req, res) => {
  console.log("serveMessage");
  console.log(req + '\n-----------------------------------------------------------------------------------');
  console.log(req.body.uid);
  //console.log(req.query.uid);
  res.status(200).json({}).end();
  serveMessage(req.body.uid, req.body.time)
});

app.post('/uidSetting', (req, res) => {
  console.log("setting uid");
  console.log(req + '\n-----------------------------------------------------------------------------------');
  if (!(ids.includes(req.body.uid))) {
    ids.append(req.body.uid);
    console.log("setting Uid:" + req.body.uid);
  } else {
    console.log("alredy setting:" + req.body.uid);
  }
  res.status(200).json({}).end();
});

const serveMessage = async (uid, time) => {
  const message = {
    type: 'text',
    text: 'PCで' + (time) + '時間作業しました\nそろそろ休憩しませんか？'
  };

  client.pushMessage(userDatas[uid], message)
    .then(() => {
      console.log("送信成功");
    })
    .catch((err) => {
      // error handling
      console.log("送信エラー:" + err);
    });
};


app.get('/button', (req, res) => {
  res.send('<Button onclick="clicked()">こんにちは！</Button>');
  console.log(client);
  function clicked() {
    alert("hello");
  }
});

const broadCastMessage = async () => {
  const messages = [{
    type: 'text',
    text: 'botより送信'
  }];

  try {
    const res = await client.broadcast(messages);
    console.log(res);
  } catch (error) {
    console.log(`エラー: ${error.statusMessage}`);
    console.log(error.originalError.response.data);
  }
};


/**
 * イベント1件を処理する
 * 
 * @param {*} event イベント
 * @return {Promise} テキストメッセージイベントの場合は client.pushMessage() の結果、それ以外は null
 */
async function handleEvent(event) {
  // メッセージイベントではない場合、テキスト以外のメッセージの場合は何も処理しない
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  var textStr;
  // 返信用メッセージを組み立てる
  if (event.message.text == 'delete' || event.message.text == '連携解除') {
    delete userDatas[userDatas[event.source.userId]];
    delete userDatas[event.source.userId];
    textStr = "連係解除しました。";
  } else if (event.message.text == 'ids') {
    ids.forEach(function (element) {
      console.log(element);
      textStr += element + "\n";
    });
  } else if (event.message.text == '認証' || event.message.text == 'login') {
    //認証コマンド
    textStr = 'https://bot-test1231.herokuapp.com/login?user=' + event.source.userId + '\n上記アドレスで認証を行ってください';
  } else if (userDatas[event.source.userId]) {
    if (event.message.text == 'history') {
      //ユーザの１つ前のメッセージを返すhistoryコマンド
      if (userDatas[event.source.userId].messageDict != "") {
        textStr = userDatas[event.source.userId].messageDict;
      } else {
        textStr = "履歴なし"
      }
    } else {
      textStr = "連携済み：" + userDatas[event.source.userId];
    }
  } else {
    textStr = '「認証」もしくは「login」と入力し連携をして下さい。'
    //userDatas[event.source.userId] = 
  }
  const echoMessage = {
    type: 'text',
    text: textStr
    //text: `「${event.message.text}」`
    //text: textStr + messageDict[client.id]
  };

  // Reply API を利用してリプライする
  return client.replyMessage(event.replyToken, echoMessage);
  // Push API を利用する場合は以下のようにする
  // return client.pushMessage(event.source.userId, echoMessage);
}

// サーバを起動する
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

