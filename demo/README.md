# Flagship Demo Node Application

Welcome to the Flagship Demo Node Application. This application is a demonstration of how to use Flagship for feature flagging and A/B testing in a Node.js application.

This implementation is based on two use cases:

1. **Fs demo toggle use case**: This feature toggle campaign enables a discount for VIP users.
2. **Fs demo A/B Test use case**: This A/B test campaign allows you to test the color of the 'Add to Cart' button.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed the latest version of [Node.js](https://nodejs.org/en/download/)
- You have installed [Yarn](https://yarnpkg.com/getting-started/install)
- You have [Docker](https://www.docker.com/products/docker-desktop) installed (optional)
- [Flagship account](https://www.abtasty.com)

## Getting Started

### Running the Application Locally

Follow these steps to get up and running quickly on your local machine:

1. Install the dependencies:

    ```bash
    yarn install
    ```

2. Start the application:

    ```bash
    yarn start
    ```

The application will be accessible at `http://localhost:3000`.

### Running the Application in Docker

If you prefer to use Docker, you can build and run the application using the provided shell script:

```bash
chmod +x run-docker.sh && ./run-docker.sh
```

## API Endpoints

This application provides the following API endpoints:

### GET /item

This endpoint fetches an item and applies any feature flags for the visitor.

Example:

```bash
curl http://localhost:3000/item
```

This will return a JSON object with the item details and any modifications applied by feature flags.

### POST /add-to-cart

This endpoint simulates adding an item to the cart and sends a hit to track the action.

Example:

 ```bash
 curl -X POST http://localhost:3000/add-to-cart
 ```

 This will send a hit to track the "add-to-cart-clicked" action for the visitor.
