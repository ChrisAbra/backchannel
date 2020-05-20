// Simple Express server setup to serve the build output
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const path = require('path');
const { AsyncNedb } = require('nedb-async');
const bodyParser = require('body-parser');

const app = express();



app.use(helmet());
app.use(bodyParser.json());

app.use(compression());

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const DIST_DIR = './dist';
const DATABASE_DIR = './data';

const db = new AsyncNedb(
    {
        filename: path.resolve(DATABASE_DIR, 'database'),
        autoload: true
    }
);

//#region Utilities
const generateRoomId = () => {
    let length = 12;
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
//#endregion




//#region Logic

const joinRoom = async (req) => {
    let roomData;
    if (req.query.roomCode) {
        roomData = await db.asyncFindOne({_id: req.query.roomCode});
    }
    return roomData;
}


const createRoom = async (req) => {
    if (req.body.roomName) {
        let roomCode = generateRoomId();

        let roomData = {
            _id: roomCode,
            roomName: req.body.roomName,
            roomCode: roomCode,
            members : []
        }
        db.asyncInsert(roomData);

        return roomData;
    }
    return null;

}


const registerUser = async(req) => {
    if(req.body.userId && req.body.userName && req.body.roomCode){
        let userId = req.body.userId;
        let userName = req.body.userName;
        let roomCode = req.body.roomCode;
        let roomData = await db.asyncFindOne({_id: roomCode});
        if((roomData.members.filter(member => member.userId == userId)).length == 0){ // if the member isnt already registered
            roomData.members.push({
                userName:userName,
                userId: userId
            })
            roomData = await db.asyncUpdate({_id: roomData._id},roomData);

        }
        return roomData;
    }
    return null;

}

//#endregion



//#region Sever

app.use(express.static(DIST_DIR));


app.get('/api/join', async (req, res) => {
    let roomData = await joinRoom(req);
    res.json(roomData);
});

app.post('/api/create', async (req, res) => {
    let roomData = await createRoom(req);
    res.json(roomData);
});

app.post('/api/register', async (req, res) => {
    let roomData = await registerUser(req);
    res.json(roomData);
});

app.listen(PORT, () =>
    console.log(`✅  Server started: http://${HOST}:${PORT}`)
);

app.get('*', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
});


//#endregion 



