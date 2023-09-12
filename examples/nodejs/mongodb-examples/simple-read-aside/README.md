# Welcome to an example MongoDB + Momento Cache read-aside cache example

This is a simple example of using Momento Cache as a read-aside cache for simple MongoDB calls. It could be easily modified to perform and cache more complex and repeated DB calls saving you time and money by avoiding going to MongoDB for reatable things.

<img src="https://docs.momentohq.com/img/nodes.png" width='90%'>

This example currently uses [jest](https://jestjs.io/) to call the example functions in the `./src` directory. This entire sample can be taken and the libraries used in your own code to build your own app.

## Prerequisites
- An AWS account and commandline env configured so you can remotely call AWS Secrets Manager.
- A Momento API key from the [Momento console](https://console.gomomento.com).
- The Momento API key [stored in AWS Secrets Manager](https://docs.momentohq.com/develop/integrations/aws-secrets-manager) as text.
- MongoDB installed somewhere. It can be local, in your cloud provider account, or MongoDB Atlas.
- Node.js installed


