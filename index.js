const line = require('@line/bot-sdk');
const express = require('express');

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
app.get('/',(req,res) => res.sendFile('/index.html'));

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
  // 返信用メッセージを組み立てる : ユーザからのメッセージにカギカッコを付けて返信してみる
  if(event.message.text == 'hello'){
    textStr = 'hello';
  }else{
    textStr = 'そろそろ休憩しませんか？';
  }
  const echoMessage = {
    type: 'text',
    // text: `「${event.message.text}」`
    text: textStr
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