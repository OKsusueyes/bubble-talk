// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 클라이언트에게 화면을 보여주기 위해 public 폴더를 엽니다.
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다!');

    // 🌟 1. 사용자가 접속하며 자신의 닉네임을 알려주면, 서버가 그 닉네임을 '기억'합니다.
    socket.on('user connect notification', (nickname) => {
        socket.nickname = nickname; // 소켓(개인 연결)에 닉네임 저장
        // 본인을 제외한 다른 모든 접속자들에게 새로운 사람의 입장을 알립니다.
        socket.broadcast.emit('user joined', nickname);
    });

    // 클라이언트로부터 채팅 데이터를 받았을 때
    socket.on('chat message', (data) => {
        socket.broadcast.emit('chat message', data);
    });

    // 🌟 2. 사용자가 나갔을 때 (저장해둔 닉네임을 사용해 퇴장 알림 방송)
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
