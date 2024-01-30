## README

You can use the caller script in this package to call the dictionary lambda. By default it will run
close to 100 TPS and you can tweak the code to run at a higher rate by decreasing the interval at the bottom of the code

```typescript

setInterval(() => {
  for (let i = 0; i < 100; i++) {
    const tntid = getRandomElement(users);
    const metricIds = getRandomMetrics(metrics, 2, 8); // Get 2-8 random metrics
    console.log(`Calling Lambda with tntid: ${tntid} and metricIds: ${metricIds.join(', ')}`);
    invokeLambda(tntid, metricIds);
  }
}, 1000 /* interval */); //  decrease this to run at a higher rate
```

Running the script:

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

```
export AWS_SDK_LOAD_CONFIG=1
AWS_PROFILE=<profile_name> npm run call
```

