// Simple Express server setup to serve the build output
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const path = require('path');
const { AsyncNedb } = require('nedb-async');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


app.use(helmet());
app.use(bodyParser.json());

app.use(compression());

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const DIST_DIR = './dist';
const DATABASE_DIR = './data';

const rooms = new AsyncNedb(
    {
        filename: path.resolve(DATABASE_DIR, 'rooms'),
        autoload: true
    }
);
const users = new AsyncNedb(
    {
        filename: path.resolve(DATABASE_DIR, 'users'),
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


//#region Socket.io
io.on('connection', (socket) => {
    socket.on('register', async (data) => {
        let user = {
            _id: data.userId,
            socketId: socket.id,
            userName: data.userName,
            roomCode: data.roomCode,
        }
        await users.asyncUpdate({ _id: data.userId }, user, { upsert: true });

        socket.join(data.roomCode);
        let usersInRoom = await users.asyncFind({roomCode: data.roomCode});
        usersInRoom.forEach(function(member){ delete member.socketId });
        io.to(data.roomCode).emit('members',usersInRoom);
    });
});
//#endregion

//#region Logic

const joinRoom = async (req) => {
    let roomData;
    if (req.query.roomCode) {
        roomData = await rooms.asyncFindOne({ _id: req.query.roomCode });
    }
    return roomData;
}


const createRoom = async (req) => {
    if (req.body.roomName) {
        let roomCode = generateRoomId();

        let roomData = {
            _id: roomCode,
            roomName: req.body.roomName,
            roomCode: roomCode
        }
        await rooms.asyncInsert(roomData);

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

app.get('*', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
});


server.listen(PORT, () =>
    console.log(`✅  Server started: http://${HOST}:${PORT}`)
);


//#endregion 



