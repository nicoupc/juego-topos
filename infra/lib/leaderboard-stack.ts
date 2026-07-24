import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as path from 'path';

/**
 * LeaderboardStack: el backend del ranking de "Topos y Erizos".
 *
 * Flujo de un puntaje:
 *   juego -> API Gateway (HTTP API) -> Lambda (valida/sanea/escritura condicional) -> DynamoDB
 *
 * La Lambda es el UNICO que puede escribir la tabla (permiso minimo por IAM),
 * asi desaparece el bin publico de escritura abierta y el XSS via nombres.
 */
export class LeaderboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- DynamoDB: tabla de puntajes (clave = playerId) ---
    const table = new dynamodb.Table(this, 'ScoresTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // sin capacidad fija -> amigable con free-tier
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // cifrado en reposo
      removalPolicy: cdk.RemovalPolicy.DESTROY, // hackathon: se limpia con `cdk destroy`
    });

    // --- Log group de la Lambda con retencion explicita (no "para siempre") ---
    const logGroup = new logs.LogGroup(this, 'HandlerLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- Lambda: el guardian (valida, sanea, escribe) ---
    const handler = new lambda.Function(this, 'LeaderboardHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        TABLE_NAME: table.tableName, // nombre autogenerado, pasado por env
        MAX_SCORE: '1000000', // tope anti-cheat basico del lado servidor
      },
      logGroup,
    });

    // Permiso minimo: la Lambda solo puede leer/escribir ESTA tabla.
    table.grantReadWriteData(handler);

    // --- API Gateway HTTP API ---
    const integration = new HttpLambdaIntegration('LeaderboardIntegration', handler);

    const httpApi = new apigwv2.HttpApi(this, 'LeaderboardApi', {
      description: 'API del ranking de Topos y Erizos',
      corsPreflight: {
        // TODO(Fase 3): restringir al origen final del juego cuando definamos el hosting.
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    });

    httpApi.addRoutes({
      path: '/scores',
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });
    httpApi.addRoutes({
      path: '/scores',
      methods: [apigwv2.HttpMethod.POST],
      integration,
    });

    // Rate limiting GRATIS: throttling en el stage por defecto del HTTP API.
    const cfnStage = httpApi.defaultStage!.node.defaultChild as apigwv2.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingBurstLimit: 20,
      throttlingRateLimit: 10,
    };

    // --- Output: URL base del API (aca apunta el LeaderboardService del juego) ---
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'Base URL del API del ranking',
    });
  }
}
