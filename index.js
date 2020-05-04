const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const Wallet = require('./wallet');
const { register, read } = require('./did');

const { DEFAULT_PORT, ROOT_NODE_ADDRESS, RESOLVER_PORT } = require('./config');
const { getTokenFromHeader, getAuthJSON } = require('./util');
const IPFSClient = require('./app/ipfs_client');


let wallet;
const app = express();
app.use(bodyParser.json());

// ------ Routes on DEFAULT ports (server) ------ //
app.get('/api/hello', (req, res) => {
  console.log('#2. Server reads the HTTP request header to validate the Auth Token.');
  const token = getTokenFromHeader(req);
  if (token != undefined || token != null) {
    res.json({
      status: 200,
      message: 'Success'
    });
  } else {
    res.json({
      status: 401,
      message: "Unauthorized"
    });
  }
});

app.get('/api/login', (req, res) => {
  console.log('#4. Server Signs a Login Challenge and Sends it along with DID To the Client.');
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
  console.log('#6. Server verifies the Clients Signature and sends a JWT auth token to Client.')
  Wallet.verifyAsync({
    did: req.body.sender,
    data: req.body.msg,
    signature: req.body.sig
  }).then((matched) => {
    if (matched) {
      res.json({
        status: 200,
        message: 'Success',
        auth: getAuthJSON()
      });
    } else {
      res.json({
        status: 401,
        message: "Unauthorized"
      });
    }
  }, ((err) => {
    res.json({
      status: 401,
      message: "Unauthorized"
    });
  }));
});

// ------ Routes on RESOLVER ports (DID Resolver) ------ //

app.post('/api/did/register', async (req, res) => {
  const did = await register(req.body);
  res.json(did);
});

app.post('/api/did/fetch', async (req, res) => {
  const document = await read(req.body);
  res.json(document);
});

// ------ Helper APIs mainly on client ------ //

let authToken;

const Hello = async ()  => {
  console.log('#1. Client Requests Hello.');
  const authorizationString = (authToken === undefined) ? '' : `Token ${authToken}`;
  const resp = await fetch(`${ROOT_NODE_ADDRESS}/api/hello`, {
    method: 'GET',
    headers: {
      authorization: authorizationString
    }
  });

  let results = await resp.json();
  if (results.status !== 200) {
    Login();
  } else {
    console.log("#3a. Client successuly sign-in to server with auth token.");
  }
}

const Login = async () => {
  console.log('#3b. Client Requests Login.');

  const resp = await fetch(`${ROOT_NODE_ADDRESS}/api/login`);
  let results = await resp.json();
  let match = await Wallet.verifyAsync({
                      did: results.sender,
                      data: results.msg,
                      signature: results.sig
                    });
  if (match) {
    Verify(results);
  } else {
    console.log("#5b. Login challenge signature failed.");
  }
}

const Verify = async (parsedBody) => {
    console.log('#5a. Client Verifies the Server Signature and Sends Signed Challenge along with the DID to the Server.');
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
    if (results.status === 200) {
      console.log('#7a. Client receives the JWT as login token.');
      
      authToken = results.auth.token;
      setTimeout(() => {
                          Hello();
                        }, 2000);

    } else {
      console.log('#7b. Client failed to sign-in to the Server.');
    }
};

// --------------- Test routes for IPFS --------- //

app.post('/api/ipfs-upload', async (req, res) => {
  console.log(req.body);

  const ipfs = new IPFSClient();
  const address = await ipfs.sendFile(req.body);
  res.json(address);
});

app.get('/api/ipfs-fetch/:hash', async (req, res) => {
  console.log(req.params.hash);

  const ipfs = new IPFSClient();
  const file = await ipfs.fetchFile({ fileHash: req.params.hash });
  res.json(file);
});

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
        setTimeout(() => { Hello(); }, 2000);
    }
});
