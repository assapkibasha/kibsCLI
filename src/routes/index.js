const express = require("express");

const router = express.Router();

router.get("/", (_request, response) => {
  response.json({
    product: "Kibs",
    project: "demo-app",
    backend: "express",
    status: "ok"
  });
});

module.exports = router;
