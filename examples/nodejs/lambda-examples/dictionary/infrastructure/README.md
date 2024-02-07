## Deploying the Simple Get Lambda

First make sure to start Docker and install the dependencies in the `lambda` directory, which is where the AWS Lambda code lives.

```bash
cd ../lambda/dict
npm install
```

The source code for the CDK application lives in this `infrastructure` directory.
To build and deploy it you will first need to install the dependencies:

```bash
npm install
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need a superuser API key generated from the [Momento Console](https://console.gomomento.com).

Then run:

```
npm run cdk -- deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

OR use the cdk cli directly:

```
AWS_PROFILE=<profile_name> cdk deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```
