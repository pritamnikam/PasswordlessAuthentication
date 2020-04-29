class DIDDocument {
    constructor( {id, publicKey, authentication} ) {
        this.id = id;
        this.publicKey = publicKey;
        this.authentication = authentication;
    }
}

class PublicKey {
    constructor({id, type, owner, publicKeyHex }) {
        this.id = id;
        this.type = type;
        this.owner = owner;
        this.publicKeyHex = publicKeyHex;
    }
}

class Authentication {
    constructor({ type, publicKey }) {
        this.type = type;
        this.PublicKey = publicKey;
    }
}

class ParsedDID {
    constructor({ did, didurl, method, id, path, fragment, query, param }) {
        this.did = did;
        this.didUrl = didurl;
        this.method = method;
        this.id = id;
        this.path = path;
        this.fragment = fragment;
        this.query = query;
        this.params = param;
    }
}

const ID_CHAR = '[a-zA-Z0-9_.-]'
const METHOD = '([a-zA-Z0-9_]+)'
const METHOD_ID = `(${ID_CHAR}+(:${ID_CHAR}+)*)`
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
const PARAMS = `((${PARAM})*)`
const PATH = `(\/[^#?]*)?`
const QUERY = `([?][^#]*)?`
const FRAGMENT = `(\#.*)?`
const DID_MATCHER = new RegExp(
  `^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`
)

function parse(didUrl) {
    if (didUrl === '' || !didUrl)
        throw new Error('Missing DID');

    const sections = didUrl.match(DID_MATCHER)
    if (sections) {
      const parts = new ParsedDID({
        did: `did:${sections[1]}:${sections[2]}`,
        method: sections[1],
        id: sections[2],
        didUrl: didUrl
      });

      if (sections[4]) {
        const params = sections[4].slice(1).split(';')
        parts.params = {}
        for (const p of params) {
          const kv = p.split('=')
          parts.params[kv[0]] = kv[1]
        }
      }

      if (sections[6]) parts.path = sections[6]
      if (sections[7]) parts.query = sections[7].slice(1)
      if (sections[8]) parts.fragment = sections[8].slice(1)
      return parts
    }

    throw new Error(`Invalid DID ${didUrl}`)
  }

class Resolver {
    constructor(registry) {
        this.registry = registry;
    }
  
    async resolve(didUrl) {
      try {
        const parsed = parse(didUrl);
        const resolver = this.registry[parsed.method];
        if (!resolver) {
          reject( Error(`Unsupported DID method: '${parsed.method}'`) );
        }
        
        const document = await resolver.resolve(parsed.did);
        let publicKeys = [];
        Object.values(document.publicKey).forEach(element => {
            publicKeys.push(new PublicKey( {
                id: element.id,
                owner: element.owner,
                type: element.type,
                publicKeyHex: element.publicKeyHex
            } ));
        });

        let authentications = [];
        if (document.authentication) {
            Object.values(document.authentication).forEach(element => {
                authentications.push(new Authentication( {
                    type: element.type,
                    publicKey: element.publicKey
                } ));
            });
        }

        return new DIDDocument({
                    id: document.id,
                    publicKey: publicKeys,
                    authentication: authentications
                  });
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  module.exports = { Resolver, DIDDocument, parse, ParsedDID, Authentication, PublicKey, DIDDocument }; 