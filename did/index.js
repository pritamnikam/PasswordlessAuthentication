const DIDRegistry = require('./registry');
const TestResolver = require('./test_resolver');
const { Resolver, parse } = require('./did_resolver');

const registry = new DIDRegistry();
const test_resolver = new TestResolver();
const resolver = new Resolver({ 'test': test_resolver });

register = async ({ publicKey, type, key }) => {
    const did = await registry.Add({
        publicKey: publicKey,
        type: type,
        key: key
    });

    return did;
}

read = async (did) => {
    const document = await registry.Read(did);
    return document;
}

async function resolve({ didURL }) {
    const result = await resolver.resolve(didURL);
    return result;
}

module.exports = { register, read, resolve, parse };