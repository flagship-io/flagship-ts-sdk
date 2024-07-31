const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Flagship Demo Node Application",
      version: "1.0.0",
      description: "This application is a demonstration of how to use Flagship for feature flagging and A/B testing in a Node.js application.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./swaggerDocs.js"],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/", swaggerUi.serve, swaggerUi.setup(specs));
};
