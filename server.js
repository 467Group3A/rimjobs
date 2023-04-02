const express = require("express");
var path = require('path');
const app = express();
const port = 4000;

const legacyPartsRouter = require("./routes/legacyParts");

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// CSS and image files
app.use(express.static(path.join(__dirname,'assets')));

// Javascript files
app.use(express.static(path.join(__dirname,'components')));

// If url is /, send the index.html file
app.get("/", (req, res) => {
  //send the index.html file for all requests
  res.sendFile(__dirname + "/views/index.html");
});

// If url is /legacy-parts, send the legacyPartsRouter
app.use("/legacy-parts", legacyPartsRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

// Displays the port number the server is listening on
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});