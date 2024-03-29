const DEFAULT_PORT = 3000;
const RESOLVER_PORT = 2999;
const IPFS_API_PORT = 5001;
const IPFS_GATEWAY_PORT = 8080;

const ALGORITHM_TYPE = 'secp256k1';

const ROOT_NODE_ADDRESS = `http://localhost:${ DEFAULT_PORT }`;
const RESOLVER_NODE_ADDRESS = `http://localhost:${ RESOLVER_PORT }`;
const IPFS_API_ADDRESS = `http://localhost:${ IPFS_API_PORT }`
const IPFS_GATEWAY_ADDRESS = `http://localhost:${ IPFS_GATEWAY_PORT }`

module.exports = {
    DEFAULT_PORT,
    RESOLVER_PORT,
    ROOT_NODE_ADDRESS,
    RESOLVER_NODE_ADDRESS,
    IPFS_API_ADDRESS,
    IPFS_GATEWAY_ADDRESS,
    ALGORITHM_TYPE
};