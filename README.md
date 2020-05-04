# Passwordless Authentication using Decentralized Indentifiers (DID).
A simulation for password-less authentication using Decentralized Indentifiers (DID) and Blockchain Elliptical Curve Cryptography (ECC).


### Outline for the experiment

```bash
$ tree PasswordlessAuthentication
PasswordlessAuthentication
|-- README.md
|-- app
|   `-- ipfs_client.js
|-- config.js
|-- contracts
|   |-- Login.sol
|   `-- Migrations.sol
|-- did
|   |-- did_resolver.js
|   |-- index.js
|   |-- registry.js
|   `-- test_resolver.js
|-- index.js
|-- migrations
|   |-- 1_initial_migration.js
|   `-- 2_deploy_contracts.js
|-- package.json
|-- test
|-- truffle-config.js
|-- util
|   `-- index.js
`-- wallet
    `-- index.js

7 directories, 16 files

```

### Let's begin with getting around the code

#### Running IPFS as DLT
1. Install IPFS from below website.

```
https://docs.ipfs.io/guides/guides/install/#installing-from-a-prebuilt-package
```

2. Run the IPFS initialization (first time)

```bash
$ cd go-ipfs
$ ipfs init

initializing IPFS node at C:\Users\prita\.ipfs
generating 2048-bit RSA keypair...done
peer identity: QmPCofsW6CcYegvrcz3zMfqesJC4xJnVMj8TBim6RHWbxS
to get started, enter:

        ipfs cat /ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme
```

3. Start the daemon service.

```bash
$ ipfs daemon

Initializing daemon...
go-ipfs version: 0.5.0
Repo version: 9
System version: amd64/windows
Golang version: go1.13.10
Swarm listening on /ip4/127.0.0.1/tcp/4001
Swarm listening on /ip4/169.254.183.85/tcp/4001
Swarm listening on /ip4/192.168.29.45/tcp/4001
Swarm listening on /ip6/2405:201:d800:c754:5895:f2cf:4cfd:be83/tcp/4001
Swarm listening on /ip6/2405:201:d800:c754:c6d:2978:f9d8:8851/tcp/4001
Swarm listening on /ip6/::1/tcp/4001
Swarm listening on /p2p-circuit
Swarm announcing /ip4/127.0.0.1/tcp/4001
Swarm announcing /ip4/169.254.183.85/tcp/4001
Swarm announcing /ip4/192.168.29.45/tcp/4001
Swarm announcing /ip6/2405:201:d800:c754:5895:f2cf:4cfd:be83/tcp/4001
Swarm announcing /ip6/2405:201:d800:c754:c6d:2978:f9d8:8851/tcp/4001
Swarm announcing /ip6/::1/tcp/4001
API server listening on /ip4/127.0.0.1/tcp/5001
WebUI: http://127.0.0.1:5001/webui
Gateway (readonly) server listening on /ip4/127.0.0.1/tcp/8080
Daemon is ready

```

4. [Optinal] We can open WebUI interface in web browser

```
http://127.0.0.1:5001/webui
```

#### Installing node dependencies

```bash
$ cd PasswordlessAuthentication
$ npm install
```

Open 3 different bash terminals to run DID resolver, a Server and a Client application.

Run the DID resolver (localhost:2999)
```bash
$ npm run dev-resolver
```

Run Server (localhost:3000)
```bash
$ npm run dev
```

Run Client (localhost:3000 + random number)
```bash
$ npm run dev-peer
```

Please note:
1. Both server and Client will register their public-key with resolved to get a DID, so make sure you start resolver first.
2. the client will initiate login on launch so make sure all server will be created.
3. At present, DID resolver does not talk to blockchain, however we can make it to backup data on Blockchain or IPFS.
4. In addition, we are using ECC for login, web3 based communication we have not added as this sample app does not use Metamask wallet.

Communication Handshake.
1. Resolver has started.
2. Server has started. It creates a wallet with pair of ECC keys and registers the public-key to get a DID with resolver ('/api/did/register').
3. Client has started. It creates a wallet with pair of ECC keys and registers public key to get a DID with resolver ('/api/did/register').
4. Cleint requests a '/api/hello' along with auth token (if available).
5. Server reads the HTTP request header and validate the auth token. If token is valid, send success response, otherwise error code 401, as unauthorized.
6. Client sends '/api/login' request to Server to initiate authentication.
7. Server sends a JSON with Signed Challenge, DID and plain-text challenge string to the Client.
8. Client fetches the DID-Document corresponding to the Server's DID received in login challenge from DID-Resolver ('/api/did/fetch'), and verifies the signature based on the public-key proof.
9. If signature matches, sends a '/api/verify' request along with JSON with Signed Challenge, DID and plain-text challenge string received from the Server.
10. Server fetches the DID-Document corresponding to the Client's DID received in login challenge from DID-Resolver ('/api/did/fetch'), and verifies the signature based on the public-key proof.
11. If signature matches sends a JWT auth token, and Client gets authenticated to the system.
