require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

const port = process.env.PORT || 4000;
const app = express();

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  optionalSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5yqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  // console.log("its me to verify");
  const token = req.cookies?.token;
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
  });
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const db = client.db("BrainShareDB");
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    const commentsCollection = db.collection("comments");
    const announcementsCollection = db.collection("announcements");
    const tagsCollection = db.collection("tags");
    const paymentsCollection = db.collection("payments");

    // verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      // console.log("data from verifyAdmin middleware--> ", req.user?.email);

      const email = req.user?.email;
      const query = { email };
      const result = await usersCollection.findOne(query);

      if (!result || result?.role !== "admin") {
        res.status(403).send({
          message: "Forbidden access! Admin only action!!",
        });
      }

      next();
    };

    // generating jwt
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      // token creation
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "300d",
      });

      // console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // logout or clear cookie from browser
    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // add a post to db
    app.post("/add-post", verifyToken, async (req, res) => {
      const postData = req.body;
      const result = await postsCollection.insertOne({
        ...postData,
        upVote: 0,
        downVote: 0,
      });
      res.send(result);
    });

    // post details url
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.findOne(query);
      res.send(result);
    });

    // get all posts with search and sortByPopularity functionality
    app.get("/posts", async (req, res) => {
      const { searchParams, sortByPopularity } = req.query;
      let filter = {};

      if (searchParams) {
        filter = {
          tag: { $regex: searchParams, $options: "i" },
        };
      }

      // mongoDB pipeline for sorting and filtering
      const pipeline = [
        { $match: filter },
        {
          $addFields: {
            voteDifference: { $subtract: ["$upVote", "$downVote"] },
          },
        },
      ];

      // If sortByPopularity is true, sort by voteDifference in descending order
      if (sortByPopularity === "true") {
        pipeline.push({ $sort: { voteDifference: -1 } });
      } else {
        // Default sort: newest to oldest
        pipeline.push({ $sort: { createdAt: -1 } });
      }

      try {
        const result = await postsCollection.aggregate(pipeline).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });

    // get all tags
    app.get("/tags", async (req, res) => {
      const tags = await tagsCollection.find().toArray();
      res.send(tags);
    });
    // get all announcements
    app.get("/get-announcements", async (req, res) => {
      const announcements = await announcementsCollection.find().toArray();
      res.send(announcements);
    });

    // get paginated posts of a specific user
    app.get("/user-posts/:email", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      try {
        const totalPosts = await postsCollection.countDocuments({
          authorEmail: email,
        });
        const myPosts = await postsCollection
          .find({ authorEmail: email })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          posts: myPosts,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          currentPage: page,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });

    // delete a posts
    app.delete("/posts/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    // add comments
    app.post("/add-comment", async (req, res) => {
      const commentData = req.body;
      const result = await commentsCollection.insertOne(commentData);
      res.send(result);
    });

    // get all comments for a specific post with pagination
    app.get("/get-comments/:id", async (req, res) => {
      const postId = req.params.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      try {
        const totalComments = await commentsCollection.countDocuments({
          postId,
        });
        const comments = await commentsCollection
          .find({ postId })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          comments,
          totalComments,
          totalPages: Math.ceil(totalComments / limit),
          currentPage: page,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch comments" });
      }
    });

    // update feedback and report status for a comment
    app.patch("/report-comment/:id", async (req, res) => {
      const commentId = req.params.id;
      const { feedback } = req.body;

      try {
        const result = await commentsCollection.updateOne(
          { _id: new ObjectId(commentId) },
          {
            $set: {
              feedback: feedback,
              reported: true,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.send({
            message: "Feedback and report status updated successfully",
          });
        } else {
          res.status(400).send({ message: "Failed to update feedback" });
        }
      } catch (error) {
        res.status(500).send({ error: "Error updating comment" });
      }
    });

    // count upVote
    app.patch("/upVote/:id", async (req, res) => {
      const id = req.params.id;
      const { upVote } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: {
          upVote: 1,
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // count downVote
    app.patch("/downVote/:id", async (req, res) => {
      const id = req.params.id;
      const { downVote } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: {
          downVote: 1,
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get user role
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // get user profile information
    app.get("/userInfo/:email", async (req, res) => {
      const email = req.params.email;
      const userInfo = await usersCollection.findOne({ email });
      const myPosts = await postsCollection
        .find({
          authorEmail: email,
        })
        .toArray();
      res.send({ userInfo, myPosts });
    });

    // save or update users in db
    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;

      // check if user is already exist in db or not
      const isExist = await usersCollection.findOne(query);

      if (isExist) {
        return res.send(isExist);
      }

      const result = await usersCollection.insertOne({
        ...user,
        role: "user",
        timestamp: Date.now(),
        postCount: 0,
        badge: "bronze",
      });
      res.send(result);
    });

    // get all users with pagination and search
    app.get("/allUsers", verifyToken, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const search = req.query.search || "";

      const query = {
        name: { $regex: search, $options: "i" },
      };

      const total = await usersCollection.countDocuments(query);
      const users = await usersCollection
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      res.send({ users, total });
    });

    // make a user admin
    app.patch("/make-admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { role: "admin" },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get all reported comments
    app.get(
      "/reported-comments",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const query = {
          reported: true,
        };

        const result = await commentsCollection.find(query).toArray();
        res.send(result);
      }
    );

    // delete a comment
    app.delete(
      "/reported-comments/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await commentsCollection.deleteOne(query);
        res.send(result);
      }
    );

    // add an announcement to db
    app.post(
      "/add-announcement",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const announcement = req.body;
        const result = await announcementsCollection.insertOne(announcement);
        res.send(result);
      }
    );

    // get admin information
    app.get(
      "/admin-info/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const adminInfo = await usersCollection.findOne({ email });
        const postsCount = await postsCollection.estimatedDocumentCount();
        const commentsCount = await commentsCollection.estimatedDocumentCount();
        const usersCount = await usersCollection.estimatedDocumentCount();

        res.send({ adminInfo, postsCount, commentsCount, usersCount });
      }
    );

    // add tags to database
    app.post("/tags", verifyToken, verifyAdmin, async (req, res) => {
      const tags = req.body;
      const result = await tagsCollection.insertOne(tags);
      res.send(result);
    });

    // create payment intent
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const { amount } = req.body;

      totalPrice = amount * 100;
      // res.send({ totalPrice });

      const { client_secret } = await stripe.paymentIntents.create({
        amount: totalPrice,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({ clientSecret: client_secret });
    });

    // save payment history
    app.post("/save-payment-history", verifyToken, async (req, res) => {
      const paymentInfo = req.body;
      console.log(paymentInfo);

      const filter = { email: paymentInfo.email };
      const updateDoc = {
        $set: {
          badge: "gold",
        },
      };
      const result = await paymentsCollection.insertOne(paymentInfo);

      // update user membership status
      await usersCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BrainShare Server is running..");
});

app.listen(port, () => {
  console.log(`BrainShare is running on port ${port}`);
});
