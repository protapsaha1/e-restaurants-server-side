const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
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


const verifyId = (req, res, next) => {
    const authorization = req.headers.authorization;
    console.log(authorization)
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.SECRET_USER_ACCESS_PASS_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const menuCollection = client.db("rgrestaurantsDb").collection("menu");
        const reviewsCollection = client.db("rgrestaurantsDb").collection("reviews");
        const cartsCollection = client.db("rgrestaurantsDb").collection("carts");
        const usersCollection = client.db("rgrestaurantsDb").collection("users");

        // jwt create
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_USER_ACCESS_PASS_KEY, {
                expiresIn: '4h'
            })
            // res.cookie('access-token', token, {
            //     expires: new Date(Date.now() + 25892000000),
            //     httpOnly: true
            // })
            res.send({ token });
        });
        // jwt create

        // check admin 
        const verifyIsAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const filter = { email: email };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'admin') {
                res.status(403).send({ error: true, message: 'forbidden access' })
            }
            next();
        };

        // users
        app.post('/users', async (req, res) => {
            const users = req.body;
            const query = { email: users.email }
            const isExistUser = await usersCollection.findOne(query);
            if (isExistUser) {
                return res.send({ mess: 'Exist user' })
            }
            const results = await usersCollection.insertOne(users);
            console.log(results)
            res.send(results);
        });

        // get users
        app.get('/users', verifyId, verifyIsAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });
        // user delete in admin
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        app.patch('/users/admin/:id', async (req, res) => {
            // const email = req.body;
            // const filter = email.email;
            // console.log(filter)
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const role = {
                $set: {
                    role: 'admin'
                }
            };
            const results = await usersCollection.updateOne(query, role);
            res.send(results);
        });

        app.get('/users/admin/:email', verifyId, async (req, res) => {
            const email = req.params?.email;
            if (req.decoded?.email !== email) {
                return res.send({ admin: false })
            }
            const filter = { email: email };
            const user = await usersCollection.findOne(filter);
            const result = { admin: user?.role === 'admin' };
            res.send(result);
        });


        // food and foodCarts
        // create items
        app.post('/menu', verifyId, verifyIsAdmin, async (req, res) => {
            const menu = req.body;
            const results = await menuCollection.insertOne(menu);
            res.send(results);
        })
        // delete items in menu
        app.delete('/menu/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await menuCollection.deleteOne(filter);
            res.send(result);
        })

        // update item in menu
        // app.put('/menu/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const option = { upsert: true };
        //     const query = {
        //         $set: {
        //             plot: 
        //         },
        //     };
        //     const result = await menuCollection.updateOne(filter, option, query)
        // })

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
        // carts
        app.get('/carts', verifyId, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.send([]);
            }

            const decodedEmailId = req.decoded.email;
            if (email !== decodedEmailId) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }


            const query = { email: email }
            const result = await cartsCollection.find(query).toArray();
            res.send(result)
        });

        // delete cart
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartsCollection.deleteOne(query);
            res.send(result);
        });
        // total cart
        app.get('/totalCarts', async (req, res) => {
            const results = await cartsCollection.estimatedDocumentCount();
            res.send({ total: results });
        });


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




