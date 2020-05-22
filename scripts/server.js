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
const orders = new AsyncNedb(
    {
        filename: path.resolve(DATABASE_DIR, 'orders'),
        autoload: true
    }
);

//#region Utilities
const generateRandomId = (length) => {
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

const handleOrder = async (msg) => {
    let room = await rooms.asyncFindOne({_id : msg.roomCode});
    msg.orderRound = room.orderRound;
    await orders.asyncInsert(msg);
}


const resolveRound = async(roomCode) => {
    let room = await rooms.asyncFindOne({_id : roomCode});
    let sentOrders = await orders.asyncFind({roomCode: roomCode, orderRound: room.orderRound});
    sentOrders.sort((a, b) => {
        return a.userId - b.userId || a.time - b.time;        
    });
    room.orderRound++;

    sentOrders.forEach(order => {
        io.to(roomCode).emit('message',order);
    })
    await rooms.asyncUpdate({_id:roomCode}, room);
    io.to(roomCode).emit('message',{
        roomCode:roomCode, 
        postId: generateRandomId(28), 
        message: 'Starting round # ' + room.orderRound,
        type: 'orders',
        recipientId: roomCode + '-orders',
        senderId: 'system',
        senderName: 'System',
        system: true
    });

}


const forwardMessage = async (msg) => {
    let sender = await users.asyncFindOne({_id : msg.senderId});
    msg.postId = generateRandomId(28);
    msg.senderName = sender.userName;
    msg.time = Date.now();
    if(msg.type == 'public'){ // room code
        io.to(msg.recipientId).emit('message',msg);
    }
    else if(msg.type == 'orders'){
        io.to(sender.socketId).emit('message',msg);
        handleOrder(msg);
    }
    else if(msg.type == 'private'){
        let recipient = await users.asyncFindOne({_id : msg.recipientId});
        if(recipient){
            io.to(recipient.socketId).emit('message',msg);
            io.to(sender.socketId).emit('message',msg);
        }
    
    }
}



io.on('connection', (socket) => {
    socket.on('register', async (data) => {
        let user = {
            _id: data.userId,
            socketId: socket.id,
            userName: data.userName,
            roomCode: data.roomCode,
            type: 'private'
        }
        await users.asyncUpdate({ _id: data.userId }, user, { upsert: true });

        socket.join(data.roomCode);
        broadcastMembersToRoom(data.roomCode);
    });

    socket.on('message',async(data) => {
        forwardMessage(data);
    })

    socket.on('logout', async (data) => {
        await users.asyncRemove({_id: data.userId});
        await broadcastMembersToRoom(data.roomCode);
    })
    socket.on('resolveround', async (data) => {
        resolveRound(data.roomCode);
    })

});


async function broadcastMembersToRoom(roomCode){
    let usersInRoom = await users.asyncFind({roomCode: roomCode});
    usersInRoom.forEach(function(member){ delete member.socketId });
    io.to(roomCode).emit('members',usersInRoom);

}

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
        let roomCode = generateRandomId(12);

        let roomData = {
            _id: roomCode,
            roomName: req.body.roomName,
            roomCode: roomCode,
            orderRound : 1
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



