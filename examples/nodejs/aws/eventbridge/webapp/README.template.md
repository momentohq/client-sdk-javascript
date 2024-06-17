{{ ossHeader }}

# Momento Javascript NodeJS SDK - Momento <-> Eventbridge Project Example - Web App

## About

The parent directory contains a project demonstrating a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.

This directory contains a browser app that illustrates how to use the Momento Web SDK to interact with the
Momento EventBridge integration. The app subscribes to a Momento Topic, provides a form to submit writes to DynamoDB, and then illustrates that
the DDB updates are propagated to Momento Topics and Cache via DynamoDB Streams and EventBridge.

This web app relies on configuration and infrastructure defined in the parent directory. Check out [the README in the parent directory](../README.md) for complete instructions.

{{ ossFooter }}
