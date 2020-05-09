const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto  = require('crypto');
const QRCode = require('qr-image');
const template = require("swig");

const Wallet = require('./wallet');
const { register, read } = require('./did');

const { DEFAULT_PORT, ROOT_NODE_ADDRESS, RESOLVER_PORT } = require('./config');
const { getTokenFromHeader, getAuthJSON } = require('./util');
const IPFSClient = require('./app/ipfs_client');

const isQRCodeEnabled = process.env.QR_ON;

let wallet;

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

// -------------- QR Code ----------------------- //
const PSK_LENGTH = 10;

app.get('/api/qr/signin', (req, res) => {
  if (!isQRCodeEnabled)
    res.status(404).send('Sorry, we cannot find that!');

	var randomid = crypto.randomBytes(PSK_LENGTH).toString("hex");
	console.log("[GET /] Generating PSK: " + randomid + "." );
	let render = template.renderFile(__dirname + "/client/index.html.j2", {
		id: randomid
	});
	res.send(render);
});

app.get('/api/qr/authentication.svg/:id', (req, res) => {
  if (!isQRCodeEnabled)
    res.status(404).send('Sorry, we cannot find that!');

	var id = req.params.id;
	if(id) {
		var qr = QRCode.image(`${ROOT_NODE_ADDRESS}/api/qr/verifysignin/:${id}`, { type: 'svg' });
		res.type('svg');
		qr.pipe(res);
	} else {
		res.status(404).send('Sorry, we cannot find that!');
	}
});

app.get('/api/qr/verifysignin/:id', (req, res) => {
  if (!isQRCodeEnabled)
    res.status(404).send('Sorry, we cannot find that!');

	var id = req.params.id;
	if(id) {
		let render = template.renderFile(__dirname + "/client/verify.html.j2", {
			id: id
		});
		res.send(render);
	} else {
		res.status(404).send('Sorry, we cannot find that!');
	}
});

// ------------- SOCKET APIs ---------------------
let lightdb = {};

io.on('connection', (socket) => {
	var connRandomID;

	// Browser wants to join a room
	socket.on('id', (randomID) => {
		connRandomID = randomID;
		socket.join(randomID);
	});

	// New device (e.g. smartphone) Wants to check the ID
  socket.on('authid', (id) => {
		connRandomID = id;
		socket.join(connRandomID);
		socket.emit("uuidquery");
	});

	// New device sends UUID.
	socket.on('uuidresponse', (uuid) => {
		if(!(uuid in lightdb)){
			io.sockets.in(connRandomID).emit("signin_bind", uuid);
		} else{
			io.sockets.in(connRandomID).emit("successful_login", lightdb[uuid]);
		}
	});

	// New device sends UUID.
	socket.on('signin', (credentials) => {
		lightdb[credentials.uuid] = {name: credentials.name, surname: credentials.surname};
		io.sockets.in(connRandomID).emit("successful_signin", credentials.uuid);
	});

	socket.on('disconnect', () => {
		console.log('[DISCONNECT] client disconnected');
	});

  // For each update, tell other device.
  socket.on('broadcast', (payload) => {
		io.sockets.in(connRandomID).emit("update", payload);
	});
});

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
http.listen(PORT, () => {
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
