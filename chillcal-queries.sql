CREATE TABLE "person" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR (80) UNIQUE NOT NULL,
    "password" VARCHAR (1000) NOT NULL
);

CREATE TABLE "chills" (
	"id" SERIAL PRIMARY KEY,
	"start_time" TIMESTAMP NOT NULL,
	"end_time" TIMESTAMP NOT NULL,
	"details" VARCHAR(1000) NOT NULL
);

CREATE TABLE "chills_users" (
	"id" SERIAL PRIMARY KEY,
	"created_user_id" INT NOT NULL,
	"requested_user_id" INT,
	"chill_id" INT NOT NULL,
	"connection_id" INT
);

CREATE TABLE "connections" (
	"id" SERIAL PRIMARY KEY,
	"from_user_id" INT NOT NULL,
	"to_user_id" INT NOT NULL,
	"accepted" BOOLEAN
);

CREATE TABLE "requests" (
	"id" SERIAL PRIMARY KEY,
	"chills_users_id" INT NOT NULL,
	"requester_id" INT NOT NULL
);

DROP TABLE "connections";

INSERT INTO "connections" ("from_user_id","to_user_id","accepted")
VALUES (5,6,true), (7,5,true), (5,8,false);

DROP TABLE "chills";

INSERT INTO "chills" ("start_time","end_time","details")
VALUES ('2018-12-01 08:00:00','2018-12-01 09:00:00','Coffee'),
('2018-12-02 11:15:00','2018-12-02 11:45:00','Lunch');

DROP TABLE "chills_users";

INSERT INTO "chills_users" ("created_user_id","requested_user_id","chill_id","connection_id")
VALUES (6,5,1,5), (5,7,2,6);

DROP TABLE "requests";

INSERT INTO "requests" ("chills_users_id","requester_id")
VALUES (1,2);

-- Get a user's connections (in this case from 'Ashley'/id=5)
SELECT * FROM (
	SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (from_user.id=5) AND (accepted = true)
	UNION ALL
	SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (to_user_id=5) AND (accepted = true)
) AS friends ORDER BY username ASC;

-- Get a user's pending connections (in this case from 'Ashley'/id=5
SELECT * FROM (
    SELECT connections.id AS connection_id, from_user.username, from_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
    LEFT JOIN person AS to_user ON to_user.id=to_user_id
    WHERE (to_user.id=5) AND (accepted = false)
) AS pending_friends ORDER BY username ASC;

-- Search for user on the Add Friend Screen (GET) ( where A is the search query and id is not the current user )
SELECT id, username FROM person WHERE (username ILIKE 'A%') AND (id != 5);

-- Get a user's scheduled chills (in this case from 'Ashley'/id=5)
SELECT connections.username AS friend_username, connections.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details FROM (
	SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (from_user.id=5) AND (accepted = true)
	UNION ALL
	SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (to_user_id=5) AND (accepted = true)
) AS connections
JOIN chills_users ON chills_users.connection_id=connections.connection_id
JOIN chills ON chills_users.chill_id=chills.id
WHERE chills_users.requested_user_id IS NOT NULL
ORDER BY start_time ASC;

-- Get a user's open chills (in this case for 'Ashley'/id=5)
SELECT * FROM chills_users
JOIN chills ON chills.id = chills_users.chill_id
WHERE (created_user_id=5) AND (requested_user_id IS NULL)
ORDER BY chills.start_time;

-- Get a user's available chills (in this case for 'Ashley'/id=5)
SELECT * FROM (
	SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (from_user.id=5) AND (accepted = true)
	UNION ALL
	SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (to_user_id=5) AND (accepted = true)
) AS friends 
JOIN chills_users ON chills_users.created_user_id = friends.id
WHERE requested_user_id IS NULL
ORDER BY username ASC;

-- Add a new connection (in this case for 'Ashley'/id=5 and user with id=8)
INSERT into connections (from_user_id, to_user_id, accepted)
VALUES (5, 8, false);

-- Accept connection request (in this case for connection_id=12)
UPDATE connections SET accepted = true WHERE id=12;

-- Delete connection (unfriend) (in this case for connection_id=12)
DELETE FROM connections WHERE id=12;

-- Delete connection request (in this case for requester Ashley/id=5 and requested id=13)
DELETE FROM connections WHERE (from_user_id=5) AND (to_user_id=13);

-- Get a user's scheduled chills with a specific connection (in this case for connection_id=6)
SELECT * FROM chills_users
JOIN chills ON chills_users.chill_id=chills.id
WHERE connection_id=6;

-- Delete account (in this case for id=13)
DELETE FROM person WHERE id=13;

-- Update account info (in this case for id=13)
UPDATE person SET username='newest username', password='newest password' WHERE id=13;

-- Add a new chill (in this case for Ashley/id=5 (and added chill_id was 5) )
BEGIN;
INSERT into chills (start_time, end_time, details)
VALUES ('2018-12-05 11:45:00','2018-12-05 13:00:00','Sushi')
RETURNING id;
INSERT into chills_users (created_user_id, chill_id)
VALUES (5, 5);
COMMIT;

-- Update to edit a chill's details (in this case for chill with id=5)
UPDATE chills 
SET start_time='2018-12-06 11:45:00', end_time='2018-12-06 13:00:00', details='Sushi special'
WHERE id=5;

-- Delete a chill (in this case for chill with id=6)
DELETE FROM chills WHERE id=6;

-- Request to chill (in this case for chill with id=6 and user Ashley/id=5)
INSERT into requests (chills_users_id, requester_id)
VALUES (6, 5);

-- Get a user's chill requests (in this case for lauren/id=6)
SELECT requests.id AS request_id, chills_users_id, requester_id, created_user_id, requested_user_id, chill_id, connection_id, start_time, end_time, details FROM requests
JOIN chills_users ON chills_users.id = requests.chills_users_id
JOIN chills ON chills.id = chills_users.chill_id
WHERE (created_user_id=6) AND (requested_user_id IS NULL);

-- Accept a chill request (in this case for chill with id=6...)
BEGIN;
SELECT * FROM connections WHERE (from_user_id=5 AND to_user_id=6) OR (from_user_id=6 AND to_user_id=5) AND (accepted=true);
UPDATE chills_users SET requested_user_id=5, connection_id=5 WHERE id=6;
DELETE FROM requests WHERE id=2;
COMMIT;

-- Decline a chill request
DELETE FROM requests WHERE id=2;

-- Cancel a chill (that wasn't created by the user) (in this case for chill with id=6)
UPDATE chills_users SET requested_user_id=NULL, connection_id=NULL WHERE id=6;

-- Get a user's 5 next scheduled chills (in this case from 'Ashley'/id=5)
SELECT connections.username AS friend_username, connections.id AS friend_id, chills_users.id AS chills_users_id, created_user_id, requested_user_id, chill_id, chills_users.connection_id, start_time, end_time, details FROM (
	SELECT connections.id as connection_id, to_user.username, to_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (from_user.id=5) AND (accepted = true)
	UNION ALL
	SELECT connections.id as connection_id, from_user.username, from_user.id FROM connections 
	LEFT JOIN person AS from_user ON from_user.id=from_user_id
	LEFT JOIN person AS to_user ON to_user.id=to_user_id
	WHERE (to_user_id=5) AND (accepted = true)
) AS connections
JOIN chills_users ON chills_users.connection_id=connections.connection_id
JOIN chills ON chills_users.chill_id=chills.id
WHERE chills_users.requested_user_id IS NOT NULL
ORDER BY start_time ASC
LIMIT 5;