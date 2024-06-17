{{ ossHeader }}

# Momento Javascript NodeJS SDK - Momento <-> Eventbridge Project Example - TypeScript CLI App

## About

The parent directory contains a project demonstrating a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.

This directory contains a TypeScript CLI app that illustrates how to use the Momento NodeJS SDK to interact with the
Momento EventBridge integration. The code subscribes to a Momento Topic, writes to DynamoDB, and then illustrates that
the DDB updates are propagated to Momento Topics and Cache via DynamoDB Streams and EventBridge.

This CLI app relies on configuration and infrastructure defined in the parent directory. Check out [the README in the parent directory](../README.md) for complete instructions.

{{ ossFooter }}
