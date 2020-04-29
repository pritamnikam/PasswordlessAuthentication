const fetch = require('node-fetch');
const DIDRegistry = require('./registry');
const { RESOLVER_NODE_ADDRESS } = require('../config');

const registry = new DIDRegistry();

class TestResolver {
    
    async getDocument(didUrl) {
        const postData = {
            did: didUrl
        };

        const resp = await fetch(`${RESOLVER_NODE_ADDRESS}/api/did/fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        let results = await resp.json();
        return results;
    }

    async resolve(did) {
        const didDocument = await this.getDocument(did);

        if(didDocument === undefined) {
            throw new Error(`No DID document for dthe requested ${did}`);
        }

        const document = JSON.parse(didDocument);
        if (document.id !== did) {
          throw new Error('DID document id does not match requested did');
        }

        if (document.publicKey === undefined) {
            throw new Error('DID document has no public keys');
        }
        
        return document;
    }
}

module.exports = TestResolver;