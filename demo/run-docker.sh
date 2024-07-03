#!/bin/bash

docker build -t flagship-demo-node . && docker run -p 3000:3000 flagship-demo-node