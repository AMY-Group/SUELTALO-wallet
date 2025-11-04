{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile",
    "buildContext": "backend"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "runtime": "V2",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
