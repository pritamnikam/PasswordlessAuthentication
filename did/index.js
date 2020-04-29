const DIDRegistry = require('./registry');
const TestResolver = require('./test_resolver');
const { Resolver, parse } = require('./did_resolver');

const registry = new DIDRegistry();
const test_resolver = new TestResolver();
const resolver = new Resolver({ 'test': test_resolver });

function register( { publicKey, type, key } ) {
    const did = registry.Add({
        publicKey: publicKey,
        type: type,
        key: key
    });

    return did;
}

function read(did) {
    return registry.Read(did);
}

async function resolve({ didURL }) {
    let result = await resolver.resolve(didURL);
    return result;
}

module.exports = { register, read, resolve, parse };