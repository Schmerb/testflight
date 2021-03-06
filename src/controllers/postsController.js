'use strict';

const mongoose = require('mongoose');
const {Post} = require('../models/posts')

mongoose.Promise = global.Promise;


// * * * * * * * * * * * * * * * 
// GET all posts
// * * * * * * * * * * * * * * * 
exports.getPosts = (req, res) => {
    Post
        .find()
        // returns promise
        .exec()
        .then(posts => {
            res.json({
                posts: posts.map(post => post.apiRepr())
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal server error');
        });
};

// * * * * * * * * * * * * * * * 
// GET post by ID
// * * * * * * * * * * * * * * * 
exports.getPostById = (req, res) => {
    Post
        .findById(req.params.id)
        .exec()
        .then(post => {
            res.json(post.apiRepr());
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal server error');
        });
};

// * * * * * * * * * * * * * * * 
// CREATE Post
// * * * * * * * * * * * * * * * 
exports.createPost = (req, res) => {
    const requiredProps = ['title', 'drone', 'content', 'rating'];
    const nestedProps = ['make', 'model'];

    // console.log('CHECK THIS: ', req.body);

    // Check for required fields in request body
    for (let field of requiredProps) {
        if (!(field in req.body)) {
            return res.status(400).send(`Missing ${field} in request body`);
        }
    }
    for (let field of nestedProps) {
        if (!(field in req.body.drone)) {
            return res.status(400).send(`Missing ${field} in request body`);
        }
    }

    // Create new Post object from request body fields
    const newPost = {
        title: req.body.title,
        drone: {
            make: req.body.drone.make,
            model: req.body.drone.model
        },
        content: req.body.content,
        author: {
            username:   req.cookies.loggedIn     // grab username from loggedIn cookie or
                     || req.body.author.username // from req.body (for TESTING)
        },
        rating: req.body.rating,
        created: Date.now()
    };

    // Store post in db
    Post
        .create(newPost)
        .then(post => {
            return res.status(201).json(post.apiRepr())
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal server error');
        });
   
};

// * * * * * * * * * * * * * * * 
// DELETE post by ID
// * * * * * * * * * * * * * * * 
exports.deletePost = (req, res) => {
    Post
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
            console.log(`Deleted blog post with id \`${req.params.id}\``);
            res.status(204).end();
        });
};


// * * * * * * * * * * * * * * * 
// UPDATE post by ID
// * * * * * * * * * * * * * * * 
exports.updatePost = (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
        error: 'Request path id and request body id values must match'
        });
    }
    const updated = {};
    const updateableFields = ['title', 'content', 'rating', 'votes', 'usersVoted', 'imgId'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field]
        }
    });

    Post
        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
        .exec()
        .then(updatedPost => res.status(201).json(updatedPost.apiRepr()))
        .catch(err => res.status(500).json({message: 'Something went wrong'}));
};