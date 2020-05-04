const crypto = require('crypto');

const IPFSClient = require('../app/ipfs_client');


// @singleton
class DIDRegistry {
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.ipfs = new IPFSClient();
        this.registry = {};
        this.constructor.instance = this;
    }

    Add = async ({ publicKey, type, key }) => {
        console.log('#1 Resolver: DID Subject registers for the DID.');

        var md5 = crypto.createHash('md5')
                      .update(publicKey)
                      .digest('hex');

        const did = `did:test:${md5}`;

        const body = {
            "@context": "https://w3id.org/did/v1",
            id: `${did}`,
            publicKey: [
                {
                    id: `${did}#${key}`,
                    owner: `${did}`,
                    type: `${type}`,
                    publicKeyHex: `${publicKey}`
                }
            ],
            authentication: [
                {
                    type: `${type}`,
                    publicKey: `${did}#${key}`
                }
            ],
        };

        const file = await this.ipfs.sendFile({ content: JSON.stringify(body) });
        this.registry[did] = file;

        return  ({
            did: did,
            content: file
        });
    }

    Read = async ({ did }) => {
        console.log(`#2 Resolver: fetches the DID Document for ${did}.`);
        const content = this.registry[did];
        const file = await this.ipfs.fetchFile( content );
        return file;  // do-not-parse-to-json
    }
}

module.exports = DIDRegistry;