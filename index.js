const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
// const jwt = require("jsonwebtoken")
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5011;

// middleware
app.use(cors())
app.use(express.json())
// middleware


const uri = `mongodb+srv://${process.env.DB_USER_ACCESS}:${process.env.DB_KEY_PASS_SECRET}@cluster0.cpjgoyc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const menuCollection = client.db("rgrestaurantsDb").collection("menu");
        const reviewsCollection = client.db("rgrestaurantsDb").collection("reviews");
        const cartsCollection = client.db("rgrestaurantsDb").collection("carts");


        // menu
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });
        // reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        });
        // carts
        app.post('/carts', async (req, res) => {
            const items = req.body;
            const results = await cartsCollection.insertOne(items);
            res.send(results);
        });

        // app.get('/carts', async (req, res) => {
        //     const result = await cartsCollection.find().toArray();
        //     res.send(result)
        // })
        // total cart
        app.get('/totalCarts', async (req, res) => {
            const results = await cartsCollection.estimatedDocumentCount();
            res.send({ total: results });
        })







        app.get('/', (req, res) => {
            res.send('Red gold is open now')
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`red gold is open ${port}`)
});