const express = require("express");
const cors = require ("cors");
const jwt = require ("jsonwebtoken")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gplglww.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db("tech-fusionDB");
    const productsCollection = database.collection("products")
    const reviewCollection = database.collection("reviews")
    const usersCollection = database.collection("users")
    const reportCollection = database.collection("reports")

    // jwt apis

    app.post("/jwt", async(req, res)=>{
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 36000000})
      res.send({token})
    })

    // middlewares
    const verifyToken = (req, res, next) =>{
      console.log("inside middleware",req.headers.authorization)
      if(!req.headers.authorization){
        return res.status(401).send({message: "Forbidden Access!"})
      }
      const token = req.headers.authorization.split(" ")[1];
      
      // if(!token){
      //   return res.status(401).send({message: "Forbidden Access!"})
      // }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
        return res.status(401).send({message: "Forbidden Access!"})}
        else{
          req.decoded = decoded;
          next()
        }
      })
    }

    
    app.get("/products", async(req, res)=>{
        
        let query = {};
        if(req.query?.email){
          query = {owner_email: req.query.email}
          // console.log(query)
        }
      
        const options = {
          sort : {"insertedOn" : 1}
        }
        const result = await productsCollection.find(query, options).toArray();
        res.send(result)
    })

    app.get("/my-products", verifyToken, async(req, res)=>{
        
        let query = {};
        if(req.query?.email){
          query = {owner_email: req.query.email}
          // console.log(query)
        }
      
        const options = {
          sort : {"insertedOn" : 1}
        }
        const result = await productsCollection.find(query, options).toArray();
        res.send(result)
    })

    app.post("/users", async(req, res)=>{
      const user  = req.body;
      const query = {email: user.email};
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message: "user already exists", insertedId: null})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.get("/user/role", async(req, res)=>{
      let query = {};
      if(req.query?.email){
        query = {email : req.query.email}
      }
      console.log(query)
      const result = await usersCollection.findOne(query);
      console.log(result)
      res.send(result);
    })

    app.get("/users", verifyToken, async(req, res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.delete("/users/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    app.patch("/users/admin/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.patch("/users/moderator/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: "moderator"
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.patch("/products/featured/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          category : "featured"
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc);
      res.send(result)
    })

    app.patch("/products/accept/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc={
        $set: {
          status: "accepted"
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.patch("/products/reject/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc={
        $set: {
          status: "rejected"
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.post("/products", async(req, res)=>{
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result)
    })

    app.get("/products/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await productsCollection.findOne(query);
      res.send(result)
    })

    app.put("/dashboard/products/:id", async(req, res)=>{
      const id = req.params.id;
      const newProduct = req.body;
      const filter = {_id : new ObjectId(id)}
      const updatedProduct = {
        $set : {
          product_name : newProduct.product_name,
          description : newProduct.description,
          details_link : newProduct.details_link,
          owner_email : newProduct.owner_email,
          tags : newProduct.tags,
          image : newProduct.image
        }
      }
      const option = {upsert : true};
      const result = await productsCollection.updateMany(filter, updatedProduct, option);
      res.send(result)
    })

    app.delete("/products/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await productsCollection.deleteOne(query);
      res.send(result) 
    })

    // app.post('/upload', (req, res) => {
    //   const { image, key } = req.body;
    //   const url = `https://api.imgbb.com/1/upload?key=${key}`;
    
    //   request.post({ url, formData: { image } }, (err, httpResponse, body) => {
    //     if (err) {
    //       return res.status(500).send(err);
    //     }
    //     res.setHeader('Access-Control-Allow-Origin', '*');
    //     res.send(body);
    //   });
    // });

    app.post("/add-review/:id", async(req, res)=>{
      const product_id = req.params.id;
      const review = req.body;
      const product_review = {product_id, ...review}
      // console.log(product_review)

      const result = await reviewCollection.insertOne(product_review)
      res.send(result)

    })

    app.get("/reviews/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {product_id: id};
      const result = await reviewCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/product/upVote/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      // console.log(query)
      const incVote = {
        $inc: {vote : 1}
      }
      const option = {upsert : true}
      const result = await productsCollection.updateOne(query, incVote, option);
      res.send(result);
    })

    app.post("/product/report/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      // console.log(query)
      const incReport = {
        $inc: {report : 1}
      }
      const option = {upsert : true}
      const result = await productsCollection.updateOne(query, incReport, option);
      res.send(result);
    })

    app.get("/reports", async(req, res)=>{
      const result = await reportCollection.find().toArray();
      res.send(result)
    })

    // app.get("/users", async(req, res)=>{
    //   const result = await usersCollection.find().toArray();
    //   res.send(result)
    // })

    // app.get("/products", async(req, res)=>{
    //   let query = {};
    //   if(req.query?.email){
    //     query = {email: req.query.email}
    //   }
    //   const result = await productsCollection.find(query).toArray();
    //   res.send(result)
    // })

    // app.post("/product/downVote/:id", async(req, res)=>{
    //   const id = req.params.id;
    //   const query = {_id : new ObjectId(id)};
    //   // console.log(query)
    //   const incVote = {
    //     $inc: {downVote : 1}
    //   }
    //   const option = {upsert : true}
    //   const result = await productsCollection.updateOne(query, incVote, option);
    //   res.send(result);
    // })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{
    res.send("tech-fusion server is running")
})

app.listen(port, ()=>{
    console.log(`Listening to the port: ${port}`)
})
