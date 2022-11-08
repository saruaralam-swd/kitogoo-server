const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('colors')
require('dotenv').config();

const cors = require('cors');

//middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0269g6x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnection() {
  try {
    await client.connect()
    console.log('DB Connection done'.yellow.italic);

    const Services = client.db('kitogoo').collection('services');
    const Facilities = client.db('kitogoo').collection('facilities');
    const AllReview = client.db('kitogoo').collection('allReview');

    /* ----> service section <--- */

    // crete service
    app.post('/service',async (req, res) => {
      const service = req.body;
      const result = await Services.insertOne(service);
      res.send(result)
    });

    // all services
    app.get('/services', async (req, res) => {
      const query = {};
      const allService = await Services.find(query).toArray();
      const serviceLimit = await Services.find(query).limit(3).toArray();
      const count = await Services.estimatedDocumentCount();
      res.send({ allService, serviceLimit, count });
    });

    // single service
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await Services.findOne(query)
      res.send(result);
    })

    // all facilities
    app.get('/facilities', async (req, res) => {
      const query = {};
      const facility = await Facilities.find(query).toArray();
      res.send(facility);
    });


    /* ----> review section <--- */

    // create review
    app.post('/addReview', async (req, res) => {
      const data = req.body;
      const result = await AllReview.insertOne(data)
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
      const result = await AllReview.find(query).toArray();
      res.send(result);
    });

    // get review by email
    app.get('/reviewByEmail', async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const result = await AllReview.find(query).toArray();
      res.send(result)
    });

    app.delete('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await AllReview.deleteOne(query)
      res.send(result)
    })
  }
  finally {

  }
};

dbConnection().catch(error => console.log(error.name, error.message));

app.listen(port, () => console.log(`server is running on port ${port}`.cyan.bold));