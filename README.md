# PasswordlessAuthentication
A simulation for passwordless authentication for DID and Blockchain ECC.

$ tree PasswordlessAuthentication
PasswordlessAuthentication
|-- README.md
|-- config.js
|-- contracts
|   |-- Login.sol
|   `-- Migrations.sol
|-- did
|   |-- did_resolver.js
|   |-- index.js
|   |-- registry.js
|   `-- test_resolver.js
|-- index.js
|-- migrations
|   |-- 1_initial_migration.js
|   `-- 2_deploy_contracts.js
|-- package.json
|-- truffle-config.js
`-- wallet
    `-- index.js

4 directories, 14 files

$ cd PasswordlessAuthentication

$ npm install

[3 different bash terminals]

Run the DID resolver (localhost:2999)
$ npm run dev-resolver

Run Server (localhost:3000)
$ npm run dev

Run Client (localhost:3000 + random number)
$ npm run dev-peer

Please note:
1. Both server and Client will register their public-key with resolved to get a DID, so make sure you start resolver first.
2. the client will initiate login on launch so make sure all server will be created.
3. At present, DID resolver does not talk to blockchain, however we can make it to backup data on Blockchain or IPFS.
4. In addition, we are using ECC for login, web3 based communication we have not added as this sample app does not use Metamask wallet.

Communication Handshake.
1. Resolver has started.
2. Server has started. It creates a wallet with pair of ECC keys and registers the public-key to get a DID with resolver ('/api/did/register').
3. Client has started. It creates a wallet with pair of ECC keys and registers public key to get a DID with resolver ('/api/did/register').
4. Client sends '/api/login' request to Server to initiate authentication.
5. Server sends a JSON with Signed Challenge, DID and Plain challenge to Client.
6. Client fetches the DID-Document corresponding to the Server's DID received in login challenge from DID-Resolver ('/api/did/fetch'), and verifies the signature based on the public-key.
7. If signature matches, sends a '/api/verify' request along with JSON with Signed Challenge, DID and Plain-text challenge received from Server.
8. Server fetches the DID-Document corresponding to the Client's DID received in login challenge from DID-Resolver ('/api/did/fetch'), and verifies the signature based on the public-key.
9. If signature matches sends a JWT auth token, and Client gets authenticated to the system.
