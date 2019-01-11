const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// to get user's connections
router.get('/list/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js GET for '/friends/list' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT * FROM (
        SELECT connections.id AS connection_id, to_user.username, to_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS friends ORDER BY username ASC;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /friend', error);
            res.sendStatus(500); 
    });
});
 

// to get user's pending connections (people that have requested to be friends with them)
router.get('/pending/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js GET for '/friends/pending' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT * FROM (
        SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user.id=$1) AND (accepted = false)
    ) AS pending_friends ORDER BY username ASC;
    `,[id]) 
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /friend/pending', error);
            res.sendStatus(500);  
    });
});

// to get users from search on add friends screen
router.get('/search', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js GET for '/friends/search' req.query:`,req.query);
    let search = req.query.search + '%';
    let userId = req.query.user;
    console.log('search:', search, 'userId:', userId);
    pool.query(`
    SELECT id, username FROM person WHERE (username ILIKE $1) AND (id != $2);
    `, [search, userId])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /friend/search', error);
            res.sendStatus(500);  
    });
});

// to send a friend request/add a new connection
router.post('/', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js POST for '/friends' req.body:`,req.body);
    let friendId = req.body.friendId;
    let userId = req.body.id;
    console.log('userId:', userId, 'friendId:', friendId);
    pool.query(`
    INSERT into connections (from_user_id, to_user_id, accepted)
    VALUES ($1, $2, false);    
    `, [userId, friendId])
        .then((result) => {
            console.log(result);
            res.sendStatus(201);
        }).catch((error) => {
            console.log('Error POST /friend', error);
            res.sendStatus(500);  
    });
});

// to accept a pending friend request (by connection id)
router.put('/accept/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js PUT for '/friends/accept' req.params:`,req.params);
    let connectionId=req.params.id;
    pool.query(`
    UPDATE connections SET accepted = true WHERE id=$1;
    `,[connectionId])
        .then((result) => {
            console.log(result);
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error PUT /friend/accept', error);
            res.sendStatus(500);  
    });
});

// to delete a friend (by connection id) or decline a pending request
router.delete('/decline/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in friends.router.js DELETE for '/friends' req.params:`,req.params);
    let connectionId=req.params.id;
    pool.query(`
    DELETE FROM connections WHERE id=$1;
    `, [connectionId])
        .then((result) => {
            console.log(result);
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error DELETE /friend', error);
            res.sendStatus(500);  
    });
});

module.exports = router;