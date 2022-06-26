const line = require('@line/bot-sdk');
const { text } = require('express');
const express = require('express');
var messageDict;

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
  if (event.message.text == 'hello') {
    textStr = 'hello';
  } else if (event.message.text == 'history') {
    //ユーザの１つ前のメッセージを返すhistoryコマンド
    if (messageDict[event.source.userId]) {
      textStr = messageDict[event.source.userId];
    } else {
      textStr = "履歴なし"
    }
  } else {
    textStr = 'そろそろ休憩しませんか？';
    messageDict[event.source.userId] = event.message.text;
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

