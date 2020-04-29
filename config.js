const DEFAULT_PORT = 3000;
const RESOLVER_PORT = 2999;

const ALGORITHM_TYPE = 'secp256k1';

const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
const RESOLVER_NODE_ADDRESS = `http://localhost:${RESOLVER_PORT}`;

module.exports = { DEFAULT_PORT, RESOLVER_PORT,  ROOT_NODE_ADDRESS, RESOLVER_NODE_ADDRESS, ALGORITHM_TYPE };