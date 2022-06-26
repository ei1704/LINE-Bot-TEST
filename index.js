const line = require('@line/bot-sdk');
const { text } = require('express');
const express = require('express');
var userDatas = {
  foo: { "email": "example@example.com", "password": "foo", "messageDict": "" }
};

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
  console.log("hello");
  console.log(client);
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
function handleEvent(event) {
  // メッセージイベントではない場合、テキスト以外のメッセージの場合は何も処理しない
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  var textStr;
  // 返信用メッセージを組み立てる
  if (userDatas[event.source.userId]) {
    if (userDatas[event.source.userId].messageDict == 'login') {
      userDatas[event.source.userId].email = event.message.text;
      textStr = "次にパスワードを入力してください";
      userDatas[event.source.userId].messageDict = "password";
    } else if (userDatas[event.source.userId].messageDict == 'password') {
      userDatas[event.source.userId].password = event.message.text;
      result = showFirebaseIdToken(userDatas[event.source.userId].email, userDatas[event.source.userId].password);
      textStr = result;
    } else if (event.message.text == 'history') {
      //ユーザの１つ前のメッセージを返すhistoryコマンド
      if (userDatas[event.source.userId].messageDict != "") {
        textStr = userDatas[event.source.userId].messageDict;
      } else {
        textStr = "履歴なし"
      }
    }
  } else if (event.message.text == '認証' || event.message.text == 'login') {
    //認証コマンド
    textStr = 'メールアドレスを入力してください';
    userDatas[event.source.userId].messageDict = { "email": "", "password": "", "messageDict": 'login' };
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


// firebaseにアクセスしトークンを取得、表示する
function showFirebaseIdToken(email, password) {
  // firebase appの初期化
  const app = firebase.initializeApp(firebaseConfig);

  // メール認証
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((result) => {
      const firebaseAuthUser = result.user;
      firebaseAuthUser.getIdToken(true)
        .then((idToken) => {
          console.log(idToken);
          return idToken;
        })
        .catch((error) => {
          console.log(error);
          return error;
        });
    })
    .catch(function (error) {
      console.log(error);
      return error;
    });

}


// サーバを起動する
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

