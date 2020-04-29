var crypto = require('crypto');

// @singleton
class DIDRegistry {
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.registry = {};
        this.constructor.instance = this;
    }

    Add({ publicKey, type, key }) {
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

        this.registry[did] = JSON.stringify(body);
        return did;
    }

    Read(did) {
        console.log(`#2 Resolver: fetches the DID Document for ${did}.`);
        return this.registry[did];
    }
}

module.exports = DIDRegistry;