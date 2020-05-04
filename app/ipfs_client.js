const ipfsClient = require('ipfs-http-client');
const { IPFS_API_ADDRESS, IPFS_GATEWAY_ADDRESS } = require('../config');

class IPFSClient {
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.ipfs = ipfsClient(IPFS_API_ADDRESS);
        this.constructor.instance = this;
    }

    addFile = async ({ content }) => {
        const buffer = Buffer.from(content);
        const source = this.ipfs.add(buffer);
        let hash;
        for await (const file of source) {
            hash = file.path
        }

        return hash;
    }

    sendFile = async ({ content }) => {
        const fileHash = await this.addFile({ content });
        return ({
            hash: fileHash,
            gateway_url: `${ IPFS_GATEWAY_ADDRESS }/ipfs/${ fileHash }`
        });
    }

    fetchFile = async ( { hash } ) => {              
        const source = this.ipfs.cat(hash);
        const data = []
        for await (const chunk of source) {
            data.push(chunk);
        }
        
        return Buffer.concat(data).toString();
    }
}

module.exports = IPFSClient;