(function () {
  //Firebase SDKのキー設定を追加する

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

  // Firebaseを初期化して準備
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();   //FirebaseAuthenticationを使うための下準備。

  //ボタンなどを変数に格納
  const txtEmail = document.getElementById('txtEmail');       //メールアドレス
  const txtPassword = document.getElementById('txtPassword'); //パスワード
  const btnLogin = document.getElementById('btnLogin');       //log inボタン
  const btnSignUp = document.getElementById('btnSignUp');     //Sign Upボタン
  const btnLogout = document.getElementById('btnLogout');     //Log outボタン
  const statusvar = document.getElementById('status');


  //log inボタンがclickされたときの処理
  btnLogin.addEventListener('click', e => {
    const email = txtEmail.value;   //メールアドレスを取得
    const pass = txtPassword.value; //パスワードを取得

    //メールアドレスとパスワードを使って，ログインを試みる
    const promise = auth.signInWithEmailAndPassword(email, pass);

    //エラーになった場合に，コンソールにエラーを表示する。 
    promise.catch(e => console.log(e.message));

  });

  //Sign upボタンのclickされたときの処理
  btnSignUp.addEventListener('click', e => {
    const email = txtEmail.value;   //メールアドレスを取得
    const pass = txtPassword.value; //パスワードを取得

    //メールアドレスとパスワードにより，新規作成する。
    const promise = auth.createUserWithEmailAndPassword(email, pass);

    //エラーになった場合にコンソールにエラーを表示する。 
    promise.catch(e => console.log(e.message));
  });

  //Log outボタンがclickされたときの処理
  btnLogout.addEventListener('click', e => firebase.auth().signOut());

  //ログイン状態が変化した（認証がOKになった，認証がNGになった）場合に
  //自動的に実行される関数。コールバック関数という。
  //
  //★コールバック関数とは，ある状態になった場合に自動的に実行される処理を，
  //事前に予約しておくことができるタイプの関数。
  //元々は現在の状態が何かを何度も問い合わせて，その状態により処理を行っていたが，
  //コールバックを使うことで，何度も問い合わせることなく，自動的に事前に予約した処理が実行される。
  auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
      //認証OKの場合は，「認証OK」とメールアドレスをコンソールに表示する。
      console.log('認証OK：' + firebaseUser.email);
      statusvar.innerText = '認証OK：' + firebaseUser.email;
      btnLogout.style.display = "inline";
    } else {
      //認証NGの場合は，「認証NG」とコンソールに表示する。
      console.log('認証NG');
      statusvar.innerText = '認証NG';
      btnLogout.style.display = "none";
    };
  });
}());