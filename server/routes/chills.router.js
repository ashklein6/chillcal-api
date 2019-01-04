const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// get user's scheduled chills
router.get('/scheduled/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/scheduled' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT connections.username AS friend_username, connections.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details FROM (
        SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS connections
    JOIN chills_users ON chills_users.connection_id=connections.connection_id
    JOIN chills ON chills_users.chill_id=chills.id
    WHERE chills_users.requested_user_id IS NOT NULL
    ORDER BY start_time ASC;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/scheduled', error);
            res.sendStatus(500);  
    });
});

// get user's available chills (their friends' open chills)
router.get('/available/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/available' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT * FROM (
        SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS friends 
    JOIN chills ON chills.created_user_id = friends.id
    JOIN chills_users ON chills_users.chill_id = chills.id
    WHERE requested_user_id IS NULL
    ORDER BY username ASC;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/available', error);
            res.sendStatus(500);  
    });
});

// get chills scheduled with a specific friend
router.get('/friend/scheduled/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/friend/scheduled' req.params:`,req.params);
    let connectionId=req.params.id;
    console.log('userId:', userId, 'friendId:', friendId);
    pool.query(`
    SELECT * FROM chills_users
    JOIN chills ON chills.id = chills_users.chill_id
    WHERE connection_id=$1
    ORDER BY chills.start_time;
    `, [connectionId])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET chills/friend/scheduled', error);
            res.sendStatus(500);  
    });
});

// get a specific friend's available chills
router.get('/friend/available/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/friend/available' req.params:`,req.params);
    let friendId=req.params.id;
    pool.query(`
    SELECT * FROM chills_users
    JOIN chills ON chills.id = chills_users.chill_id
    WHERE (created_user_id=$1) AND (requested_user_id IS NULL)
    ORDER BY chills.start_time;
    `, [friendId])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET chills/friend/available', error);
            res.sendStatus(500);  
    });
});

// get user's chill requests
router.get('/pending/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/pending' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT requests.id AS request_id, chills_users_id, requester_id, created_user_id, requested_user_id, chill_id, connection_id, start_time, end_time, details FROM requests
    JOIN chills_users ON chills_users.id = requests.chills_users_id
    JOIN chills ON chills.id = chills_users.chill_id
    WHERE (created_user_id=$1) AND (requested_user_id IS NULL);
    `, [id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET chills/pending', error);
            res.sendStatus(500);  
    });
});

// get user's upcoming 3 scheduled chills
router.get('/upcoming/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/upcoming' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT connections.username AS friend_username, connections.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details FROM (
        SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS connections
    JOIN chills_users ON chills_users.connection_id=connections.connection_id
    JOIN chills ON chills_users.chill_id=chills.id
    WHERE chills_users.requested_user_id IS NOT NULL
    ORDER BY start_time ASC
    LIMIT 3;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/upcoming', error);
            res.sendStatus(500);  
    });
});

/**
 * POST route template
 */
router.post('/', rejectUnauthenticated, (req, res) => {

});

module.exports = router;