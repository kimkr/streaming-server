#!/bin/bash

deploy_process_apply() {
    apiUrl=$1
    redisHost=$2
    redisPort=$3
    echo "Deploying processApply function..."
    gcloud functions deploy processApply \
           --runtime nodejs18 \
           --trigger-topic=process-apply \
           --allow-unauthenticated \
           --region asia-northeast3 \
           --memory 1GB \
           --gen2 \
           --vpc-connector projects/host-streaming/locations/asia-northeast3/connectors/host-streaming-connector \
           --set-env-vars API_URL=$apiUrl,REDIS_HOST=$redisHost,REDIS_PORT=$redisPort
}

if [ "$#" -ne 3 ]
then
    echo "enter apiUrl, redisHost, redisPort"
else
    deploy_process_apply $1 $2 $3
fi