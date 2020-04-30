const fetch = require('node-fetch');
const EC = require('elliptic').ec;

const { resolve, parse } = require('../did');
const { RESOLVER_NODE_ADDRESS, ALGORITHM_TYPE } = require('../config');

const ec = new EC(ALGORITHM_TYPE);

// @singleton
class Wallet {
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.did = '';
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
        this.constructor.instance = this;

        if (process.env.DID_ON === 'true') {
            this.requestRegistration();
        }
    }

    sign(data) {
        return this.keyPair.sign(data);
    }

    async requestRegistration() {
        console.log('#0. Register for DID.');

        const postData = {
            publicKey: this.publicKey,
            type: ALGORITHM_TYPE,
            key: 'key-1'         // make sure we pass key based on domain.
        };

        const resp = await fetch(`${RESOLVER_NODE_ADDRESS}/api/did/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        let results = await resp.json();
        this.did = results.did;
    }

    static verify({ sender, data, signature }) {
        // Import public key
        var key = ec.keyFromPublic(sender, 'hex');
        return key.verify(data, signature);
    }

    static async verifyAsync({ did, data, signature }) {
        const parsedDID = parse(did);
        let document = await resolve({didURL: parsedDID.did});

        // TODO(pritam.nikam): Match here is temporary.
        const publicKey = document.publicKey[0];
        return this.verify({ sender: publicKey.publicKeyHex, data, signature });
    }

}

module.exports = Wallet;