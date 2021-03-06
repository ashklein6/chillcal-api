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
        SELECT connections.id AS connection_id, to_user.username, to_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections
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
    SELECT friends.username AS friend_username, friends.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details, requests.requester_id AS request_from_id, requests.id AS request_id FROM (
        SELECT connections.id AS connection_id, to_user.username, to_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS friends 
    JOIN chills ON chills.created_user_id = friends.id
    JOIN chills_users ON chills_users.chill_id = chills.id
    LEFT JOIN requests ON requests.chills_users_id = chills_users.id
    WHERE requested_user_id IS NULL
    ORDER BY username ASC;
    `,[id])
        .then((result) => {
            let resultRows = result.rows;
            for (let i=0; i<resultRows.length; i++) {
                if (resultRows[i].request_from_id != id && resultRows[i].request_from_id != null) {
                    resultRows[i] = { ...resultRows[i], request_from_id: null}
                }
            }
            res.send(resultRows);
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
    SELECT requests.id AS request_id, chills_users_id, requester_id, created_user_id, requested_user_id, chill_id, connection_id, start_time, end_time, details, person.username AS friend_username FROM requests
    JOIN chills_users ON chills_users.id = requests.chills_users_id
    JOIN chills ON chills.id = chills_users.chill_id
    JOIN person ON person.id = requests.requester_id
    WHERE (created_user_id=$1) AND (requested_user_id IS NULL);
    `, [id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET chills/pending', error);
            res.sendStatus(500);  
    });
});

// get user's upcoming 5 scheduled chills
router.get('/upcoming/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/upcoming' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT connections.username AS friend_username, connections.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details FROM (
        SELECT connections.id AS connection_id, to_user.username, to_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (from_user.id=$1) AND (accepted = true)
        UNION ALL
        SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections
        LEFT JOIN person AS from_user ON from_user.id=from_user_id
        LEFT JOIN person AS to_user ON to_user.id=to_user_id
        WHERE (to_user_id=$1) AND (accepted = true)
    ) AS connections
    JOIN chills_users ON chills_users.connection_id=connections.connection_id
    JOIN chills ON chills_users.chill_id=chills.id
    WHERE chills_users.requested_user_id IS NOT NULL
    ORDER BY start_time ASC
    LIMIT 5;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/upcoming', error);
            res.sendStatus(500);  
    });
});

// get user's created chills
router.get('/created/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js GET for '/chills/created' req.params:`,req.params);
    let id=req.params.id;
    pool.query(`
    SELECT chills_users.id AS chills_users_id, chill_id, created_user_id, requested_user_id, connection_id, start_time, end_time, details, person.username AS friend_username FROM chills_users
    JOIN chills ON chills.id = chills_users.chill_id
    LEFT JOIN person ON person.id = chills_users.requested_user_id
    WHERE (created_user_id=$1)
    ORDER BY start_time ASC;
    `,[id])
        .then((result) => {
            res.send(result.rows);
        }).catch((error) => {
            console.log('Error GET /chills/created', error);
            res.sendStatus(500);  
    });
});

// to create a new chill
router.post('/', rejectUnauthenticated, async (req, res) => {
    console.log(`in chills.router.js POST for '/chills' req.body:`,req.body);
    let newChill = req.body.newChill;
    let id = req.body.id;
    console.log('newChill:', newChill, 'id:', id);

    const client = await pool.connect();

    try {
        await client.query(`BEGIN;`);
        let result = await client.query(`INSERT into chills (start_time, end_time, details, created_user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id;`,[newChill.start_time, newChill.end_time, newChill.details, id]);
        console.log('result:', result.rows[0].id);
        let chillId = result.rows[0].id;
        await client.query(`INSERT into chills_users (chill_id)
        VALUES ($1);`,[chillId]);
        await client.query(`COMMIT;`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('Error POST /chills', error);
        return res.status(500).send(error);
    } finally {
        client.release();
        return res.sendStatus(201)
    }
});

// to update a chill's times/details
router.put('/edit', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js PUT for '/chills/edit' req.body:`,req.body);
    let newChill = req.body.newChill;
    let chillId = req.body.chillId;
    console.log('newChill:', newChill, 'chillId:', chillId);

    pool.query(`
    UPDATE chills 
    SET start_time=$1, end_time=$2, details=$3
    WHERE id=$4;
    `,[newChill.start_time, newChill.end_time, newChill.details, chillId])
        .then((result) => {
            console.log(result);
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error PUT /chills/edit', error);
            res.sendStatus(500);  
    });
});

// to delete a chill
router.delete('/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js DELETE for '/chills' req.params:`,req.params);
    let chillId=req.params.id;
    pool.query(`
    DELETE FROM chills WHERE id=$1;
    `, [chillId])
        .then((result) => {
            console.log(result);
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error DELETE /chills', error);
            res.sendStatus(500);  
    });
});

// to request to chill
router.post('/request', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js POST for '/chills/request' req.body:`,req.body);
    let chillsUsersId = req.body.chillsUsersId;
    let userId = req.body.id;
    console.log('chillsUsersId:', chillsUsersId, 'userId:', userId);
    pool.query(`
    INSERT into requests (chills_users_id, requester_id)
    VALUES ($1, $2);
    `, [chillsUsersId, userId])
        .then((result) => {
            console.log(result);
            res.sendStatus(201);
        }).catch((error) => {
            console.log('Error POST /chills/request', error);
            res.sendStatus(500);  
    });
});

// to accept a chill request
router.put('/request/accept', rejectUnauthenticated, async (req, res) => {
    console.log(`in chills.router.js PUT for '/chills/request/accept' req.body:`,req.body);
    let userId = req.body.id;
    let friendId = req.body.friendId;
    let chillsUsersId = req.body.chillsUsersId;
    let requestId = req.body.requestId;
    console.log('userId:', userId, 'friendId:', friendId, 'chillsUsersId:', chillsUsersId, 'requestId:', requestId);

    const client = await pool.connect();

    try {
        await client.query(`BEGIN;`);
        let result = await client.query(`SELECT * FROM connections 
        WHERE (from_user_id=$1 AND to_user_id=$2) OR (from_user_id=$2 AND to_user_id=$1) AND (accepted=true);
        `,[userId, friendId]);
        let connectionId = result.rows[0].id
        await client.query(`UPDATE chills_users SET requested_user_id=$1, connection_id=$2 WHERE id=$3;
        `, [userId, connectionId, chillsUsersId]);
        await client.query(`DELETE FROM requests where id=$1`, [requestId]);
        await client.query(`COMMIT;`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('Error PUT /request/accept', error);
        return res.status(500).send(error);
    } finally {
        client.release();
        console.log('accept chill request was successful');
        return res.sendStatus(200)
    }
});

// to decline a chill request or cancel a chill request
router.delete('/request/decline/:id', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js DELETE for '/chills/request/decline' req.params:`,req.params);
    let requestId=req.params.id;
    pool.query(`
    DELETE FROM requests WHERE id=$1;
    `, [requestId])
        .then((result) => {
            console.log(result);
            console.log('decline chill request was successful');
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error DELETE /chills', error);
            res.sendStatus(500);  
    });
});

// to cancel a chill that a user didn't create
router.put('/cancel', rejectUnauthenticated, (req, res) => {
    console.log(`in chills.router.js PUT for '/chills/cancel' req.body:`,req.body);
    let chillsUsersId = req.body.chillsUsersId;

    pool.query(`
    UPDATE chills_users SET requested_user_id=NULL, connection_id=NULL WHERE id=$1;
    `,[chillsUsersId])
        .then((result) => {
            console.log(result);
            res.sendStatus(200);
        }).catch((error) => {
            console.log('Error PUT /chills/cancel', error);
            res.sendStatus(500);  
    });
});

module.exports = router;