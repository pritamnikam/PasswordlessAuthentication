const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const Wallet = require('./wallet');
const { register, read } = require('./did');

const { DEFAULT_PORT, ROOT_NODE_ADDRESS, RESOLVER_PORT } = require('./config');

let wallet;
const app = express();
app.use(bodyParser.json());

// ------ Routes on DEFAULT ports (server) ------ //
app.get('/api/login', (req, res) => {
  console.log('#2. Server Signs a Login Challenge and Sends To Client.');
  const challenge = {
    msg: 'hello'
  };

  const message = JSON.stringify(challenge);
  const signature = wallet.sign(message);

	res.json({
    msg: message,
    sig: signature,
    sender: wallet.did
  });
});

app.post('/api/verify', (req, res) => {
  console.log('#4. Server verifies the Client Signature and Lgoins in Client.')
  Wallet.verifyAsync({
    did: req.body.sender,
    data: req.body.msg,
    signature: req.body.sig
  }).then((matched) => {
    // TODO(pritam.nikam): Sends a login token
    res.json({msg: matched});
  }, ((err) => {
    console.error('err: ', err);
  }));
});

// ------ Routes on RESOLVER ports (DID Resolver) ------ //

app.post('/api/did/register', (req, res) => {
  res.json({
    did: register({
      publicKey: req.body.publicKey,
      type: req.body.type,
      key: req.body.key
    })
  });
});

app.post('/api/did/fetch', (req, res) => {
  res.json(read(req.body.did));
});

// ------ Helper APIs mainly on client ------ //

const Login = async () => {
  console.log('#1. Client Requests Login.');

  const resp = await fetch(`${ROOT_NODE_ADDRESS}/api/login`);
  let results = await resp.json();
  let match = await Wallet.verifyAsync({
                      did: results.sender,
                      data: results.msg,
                      signature: results.sig
                    });
  if (match) {
    Verify(results);
  }
}

const Verify = async (parsedBody) => {
    console.log('#3. Client Verifies the Server Signature and Sends Signed Challenge to Server.');
    // Request a session token
    // a. Sign the message with private-key.
    // b. Send public-key along with original message and sign message.
    const postData = {
      sender: wallet.did,
      msg: parsedBody.msg,
      sig: wallet.sign(parsedBody.msg)
    }

    const resp = await fetch(`${ROOT_NODE_ADDRESS}/api/verify`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    let results = await resp.json();
    console.log('#5. Client receives the JWT as login token', results);
};

// -------------- Common Code ------------------ //

let peer_port;

if (process.env.CLIENT === 'true') {
    peer_port = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
} else if (process.env.RESOLVER === 'true') {
  peer_port = RESOLVER_PORT;
}

const PORT = peer_port || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening on localhost:${PORT}`);

    // Don't create wallet for DID-Resolver.
    if (PORT !== RESOLVER_PORT) {
      wallet = new Wallet();
    }

    // Client initiates Login flow.
    if (PORT !== DEFAULT_PORT && PORT !== RESOLVER_PORT) {
        setTimeout(() => { Login(); }, 2000);
    }
});
