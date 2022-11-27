const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')

const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.jh5ecod.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorize access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send('forbidden access')  
        }
        req.decoded = decoded;
        next()
    })
}

async function run(){
    try{
        const categoriesCollection = client.db('resaleDB').collection('categories')
        const productsCollection = client.db('resaleDB').collection('products')
        const bookingsCollection = client.db('resaleDB').collection('bookings')
        const usersCollection = client.db('resaleDB').collection('users')

        const verifySeller = async(req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query)

            if(user.role !== 'Seller'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }
        const verifyAdmin = async(req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query)

            if(user.role !== 'Admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }

        app.get('/categories', async(req, res) => {
            const query = {}
            const category = await categoriesCollection.find(query).toArray();
            res.send(category)
        })
        app.get('/categories/:id', async(req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await categoriesCollection.findOne(query);
            res.send(result)
        })
        app.get('/products', async(req, res) => {
            let query = {}
            if(req.query.categoryName){
                query = {
                    categoryName: req.query.categoryName
                }
            }
            const product = await productsCollection.find(query).toArray();
            res.send(product)
        })

        app.get('/products/email', verifyJWT, verifySeller, async(req, res) => {
            const email = req.query.email
            const query = {email: email}
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        app.delete('/products/:id', async(req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(filter);
            res.send(result)
        })

        app.get('/products/available', async(req, res) => {
            const query = {available: true}
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/products', async(req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })

        app.put('/products/:id', async(req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const option = {upsert: true}
            const updatedDoc = {
                $set: {
                    available: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, option)
            res.send(result)
        })

        //booking API

        app.get('/bookings', verifyJWT, async(req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send('forbidden access')  
            }
            const query = {email: email}
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/bookings', async(req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        //users API

        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '5d'})
                return res.send({accessToken: token})
            }
            return res.status(403).send({accessToken: ''})
        })

        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({isAdmin: user.role === 'Admin'})
        })

        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({isSeller: user.role === 'Seller'})
        })

        app.post('/users', async(req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.delete('/users/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })

        app.get('/users/buyers', verifyJWT, verifyAdmin, async(req, res) => {
            const query = {role: 'Buyer'}
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/users/sellers', verifyJWT, verifyAdmin, async(req, res) => {
            const query = {role: 'Seller'}
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })


    }
    finally{

    }
}

run().catch(console.log)


app.get('/', (req, res) => {
    res.send('resale server running')
})

app.listen(port, () => {
    console.log(`resale running on the port ${5000}`)
})