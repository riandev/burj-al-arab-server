const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config()
console.log(process.env.DB_USER);
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vbqmn.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-abcb3-firebase-adminsdk-gn39e-23f2785cd6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const port = 5000;

client.connect((err) => {
  const bookingCollection = client.db("burjAlArab").collection("bookings");
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          let tokenEmail = decodedToken.email;
          if (tokenEmail === req.query.email) {
            bookingCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          }
          else{
            res.status(401).send('Unauthorized Access');
          }
        })
        .catch(function (error) {
            res.status(401).send('Unauthorized Access');
        });
    }
    else {
        res.status(401).send('Unauthorized Access');
    }
  });
});

app.listen(port);
