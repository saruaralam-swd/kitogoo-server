const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
require('colors')
const cors = require('cors');

//middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0269g6x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// token verify
function verifyJWt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unAuthorization access', code: 404 })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access', code: 404 })
    }
    req.decoded = decoded;
    next();
  })
}


async function dbConnection() {
  try {
    // for text : DB connection
    await client.connect()
    console.log('DB Connection done'.yellow.italic);

    const servicesCollection = client.db('kitogoo').collection('services');
    const facilitiesCollection = client.db('kitogoo').collection('facilities');
    const allReviewCollection = client.db('kitogoo').collection('allReview');

    // create json web token
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "20d" });
      res.send({ token })
    })


    /* ----> service section <--- */

    // crete service
    app.post('/service', async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result)
    });

    // all & limit services
    app.get('/services', async (req, res) => {
      const query = {};
      const allService = await servicesCollection.find(query).sort({date: -1}).toArray();
      const serviceLimit = await servicesCollection.find(query).sort({date: -1}).limit(3).toArray();
      const count = await servicesCollection.estimatedDocumentCount();
      res.send({ allService, serviceLimit, count });
    });

    // specific service
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(query)
      res.send(result);
    });

    // all facilities
    app.get('/facilities', async (req, res) => {
      const query = {};
      const facility = await facilitiesCollection.find(query).toArray();
      res.send(facility);
    });


    /* ----> review section <--- */

    // create review
    app.post('/addReview', async (req, res) => {
      const data = req.body;
      const result = await allReviewCollection.insertOne(data)
      result.insertedId ? res.send(result) : res.send('no review add in DB')
    });

    // git specific review by id
    app.get('/review', async (req, res) => {
      let query = {};
      if (req.query.id) {
        query = {
          serviceId: req.query.id,
        }
      }
      const result = await allReviewCollection.find(query).toArray();
      res.send(result);
    });

    // get review by email
    app.get('/getReviewByEmail', verifyJWt, async (req, res) => {
      const decode = req.decoded;

      if (decode.email !== req.query.email) {
        return res.status(403).send({ message: 'you are not valid user', code: 404 })
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const result = await allReviewCollection.find(query).toArray();
      res.send(result)
    });

    // review delete
    app.delete('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await allReviewCollection.deleteOne(query)
      res.send(result)
    })

    // get specific review for update
    app.get('/reviewEdit/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await allReviewCollection.findOne(query);
      res.send(result)
    })

    // review update 
    app.patch('/review/:id', async (req, res) => {
      const id = req.params.id;
      const newMessage = req.body.message;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          message: newMessage,
        }
      }
      const result = await allReviewCollection.updateOne(query, updateDoc);
      res.send(result)
    })
  }
  finally {

  }
};

dbConnection().catch(error => console.log(error.name, error.message));

app.get('/', (req, res) => {
  res.send('Kitogoo server is running');
});

app.listen(port, () => console.log(`server is running on port ${port}`.cyan.bold));