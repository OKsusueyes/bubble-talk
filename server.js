// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다!');

    // 사용자가 접속하며 자신의 닉네임을 알려주면 서버가 기억합니다.
    socket.on('user connect notification', (nickname) => {
        socket.nickname = nickname; 
        socket.broadcast.emit('user joined', nickname);
    });

    // 채팅 데이터를 받았을 때 다른 사람들에게 뿌려줍니다.
    socket.on('chat message', (data) => {
        socket.broadcast.emit('chat message', data);
    });

    // 사용자가 나갔을 때 저장해둔 닉네임으로 퇴장 알림을 방송합니다.
    socket.on('disconnect', () => {
        if (socket.nickname) {
            socket.broadcast.emit('user left', socket.nickname);
            console.log(`${socket.nickname} 사용자가 떠났습니다.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 정상적으로 실행 중입니다. 포트: ${PORT}`);
});
