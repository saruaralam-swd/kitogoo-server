const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    // all services
    app.get('/services', async (req, res) => {
      const query = {};

      const allService = await Services.find(query).toArray();
      const serviceLimit = await Services.find(query).limit(3).toArray();
      const count = await Services.estimatedDocumentCount();

      res.send({ allService, serviceLimit, count });
    });

    // all facilities
    app.get('/facilities', async (req, res) => {
      const query = {};
      const facility = await Facilities.find(query).toArray();
      res.send(facility);
    })

  }
  finally {

  }
};

dbConnection().catch(error => console.log(error.name, error.message));

app.listen(port, () => console.log(`server is running on port ${port}`.cyan.bold));