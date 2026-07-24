#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LeaderboardStack } from '../lib/leaderboard-stack';

const app = new cdk.App();

new LeaderboardStack(app, 'ToposLeaderboardStack', {
  // Usa la cuenta y region de la CLI configurada (CDK_DEFAULT_*).
  // Si estan vacias, el stack es agnostico de entorno.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description:
    'Backend serverless del ranking de Topos y Erizos (API Gateway HTTP + Lambda + DynamoDB)',
});
