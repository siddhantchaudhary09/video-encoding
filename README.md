# Video Transcoder

## Overview

This repository contains a video transcoding service built using Docker, leveraging FFmpeg for video processing and integrating with AWS services such as S3, SQS, ECR, and ECS. The goal of this project is to provide a scalable and efficient solution for transcoding video files in a cloud-native environment.

## Features

- **Containerized Application**: Built with Docker for easy deployment and scalability.
- **FFmpeg Integration**: Utilizes FFmpeg for powerful video processing capabilities.
- **AWS S3**: Stores input and output video files in Amazon S3 buckets.
- **AWS SQS**: Uses Amazon Simple Queue Service for handling video processing jobs asynchronously.
- **AWS ECR**: Manages Docker images using Amazon Elastic Container Registry.
- **AWS ECS**: Deploys and manages the service on Amazon Elastic Container Service for container orchestration.

## Architecture

The architecture of the video transcoder consists of the following components:

1. **Input Queue**: Videos are uploaded to an S3 bucket and a corresponding message is sent to an SQS queue.
2. **Processing Service**: A containerized service retrieves messages from the SQS queue, processes the video using FFmpeg, and uploads the transcoded files back to S3.
3. **Output Storage**: Transcoded videos are stored in a designated S3 bucket for further use.

## Prerequisites

Before deploying the service, ensure you have the following:

- AWS account with permissions for S3, SQS, ECR, and ECS.
- Docker installed on your local machine for building and running the application.
- Familiarity with AWS CLI and Docker commands.
