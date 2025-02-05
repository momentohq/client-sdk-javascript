const HappyDomEnvironment = require('@happy-dom/jest-environment').default;

class CustomHappyDomEnvironment extends HappyDomEnvironment {
  async setup() {
    await super.setup();

    // Grab the prototype once the environment is ready:
    const xhrProto = this.global.window.XMLHttpRequest.prototype;

    const originalOpen = xhrProto.open;
    xhrProto.open = function (method, url, async, user, password) {
      // This line is the main reason we need this custom happy dom env to force
      // creds to be passed w/ requests.
      // Node18 has some funkiness since fetch wasn't included in core runtime yet.
      // It explains why node 16 and 20 worked but not 18 when updating Happy Dom
      // a major version due to critical vulnerability warnings.
      //
      // These issues and prs from AWS dev on their JS sdk clued me into what was happening
      // https://github.com/capricorn86/happy-dom/issues/1042
      // https://github.com/aws/aws-sdk-js-v3/pull/6780/files
      //
      // Note: im overriding 'xhrProto' though not 'fetch' since that is what grpc-web uses
      this.withCredentials = true;
      return originalOpen.apply(this, arguments);
    };
  }
}

module.exports = CustomHappyDomEnvironment;
