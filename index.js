const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.jh5ecod.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoriesCollection = client.db('resaleDB').collection('categories')
        const productsCollection = client.db('resaleDB').collection('products')
        const bookingsCollection = client.db('resaleDB').collection('bookings')

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

        //booking API
        app.post('/bookings', async(req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking);
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