const line = require('@line/bot-sdk');
const express = require('express');
//const provider = new firebase.auth.GoogleAuthProvider()
var userDatas = {
  foo: { "email": "example@example.com", "password": "foo", "messageDict": "" }
};

//import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
const firebase = require('firebase/app');
const firebaseAuth = require('firebase/auth');

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

// 環境変数からチャネルアクセストークンとチャネルシークレットを取得する
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
// LINE クライアントを生成する : `channelSecret` が未定義だと例外が投げられる
const client = new line.Client(config);

// Express アプリを生成する
const app = express();

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
  if (event.message.text == '認証' || event.message.text == 'login') {
    //認証コマンド
    textStr = 'メールアドレスを入力してください';
    userDatas[event.source.userId] = { "email": "", "password": "", "messageDict": 'login' };
  } else if (userDatas[event.source.userId]) {
    if (userDatas[event.source.userId].messageDict == 'login') {
      userDatas[event.source.userId].email = event.message.text;
      textStr = "次にパスワードを入力してください";
      userDatas[event.source.userId].messageDict = "password";
    } else if (userDatas[event.source.userId].messageDict == 'password') {
      userDatas[event.source.userId].password = event.message.text;
      console.log("login now");
      var temp = userDatas[event.source.userId].email;
      console.log(temp);
      //const auth = getAuth();
      //await firebaseAuth.signInWithEmailAndPassword(temp, event.message.text)
      await firebaseAuth.signInWithEmailAndPassword(temp, event.message.text)
        .then((userCredential) => {
          console.log("login OK");
          // Signed in
          const user = userCredential.user;
          res = user.uid;
          //console.log(res);
          // ...
        })
        .catch((error) => {
          console.log("login NG");
          const errorCode = error.code;
          const errorMessage = error.message;
          res = errorMessage;
          //console.log(res);
        });
      console.log("END");
      textStr = res;
    } else if (event.message.text == 'history') {
      //ユーザの１つ前のメッセージを返すhistoryコマンド
      if (userDatas[event.source.userId].messageDict != "") {
        textStr = userDatas[event.source.userId].messageDict;
      } else {
        textStr = "履歴なし"
      }
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

/*
auth.onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    //認証OKの場合は，「認証OK」とメールアドレスをコンソールに表示する。
    console.log('認証OK：' + firebaseUser.email);
    //btnLogout.style.display = "inline";
  } else {
    //認証NGの場合は，「認証NG」とコンソールに表示する。
    console.log('認証NG');
    //btnLogout.style.display = "none";
  };
});
*/

// サーバを起動する
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

