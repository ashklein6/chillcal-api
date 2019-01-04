const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// to get existing connections
router.get('/scheduled/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/scheduled' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT connections.username AS friend_username, connections.id AS friend_id, appointments_users.id AS appointments_users_id, created_user_id, requested_user_id, appointment_id, appointments_users.connection_id, start_time, end_time, details FROM (
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
    JOIN appointments_users ON appointments_users.connection_id=connections.connection_id
    JOIN appointments ON appointments_users.appointment_id=appointments.id
    WHERE appointments_users.requested_user_id IS NOT NULL
    ORDER BY appointments.start_time ASC;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/scheduled', error);
            res.sendStatus(500);  
    });
});

// to get pending connections (people that have requested to be friends with them)
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
    let search = req.query.search;
    let userId = req.query.user;
    console.log('search:', search, 'userId:', userId);
    pool.query(`
    SELECT id, username FROM person WHERE username ILIKE '$1%' AND id != $2;
    `, [search, userId])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /friend/search', error);
            res.sendStatus(500);  
    });
});


/**
 * POST route template
 */
router.post('/', rejectUnauthenticated, (req, res) => {

});

module.exports = router;