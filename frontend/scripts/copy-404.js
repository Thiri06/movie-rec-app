const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "..", "build");
const indexFile = path.join(buildDir, "index.html");
const notFoundFile = path.join(buildDir, "404.html");

if (!fs.existsSync(indexFile)) {
  throw new Error("Cannot create 404.html because build/index.html does not exist.");
}

fs.copyFileSync(indexFile, notFoundFile);
console.log("Created build/404.html for GitHub Pages client-side routes.");
