const app = require("./index");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Local backend running at http://localhost:${PORT}`);
});
