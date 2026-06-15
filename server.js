// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 클라이언트(접속자)에게 화면을 보여주기 위해 public 폴더를 엽니다.
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('새로운 사용자가 비눗방울 공원에 입장했습니다!');

    // 🌟 새로운 사용자가 입장해서 자신의 닉네임을 보냈을 때 실행됩니다.
    socket.on('user connect notification', (nickname) => {
        // 본인을 제외한 다른 모든 접속자들에게 새로운 사람의 닉네임을 전송합니다.
        socket.broadcast.emit('user joined', nickname);
    });

    // 클라이언트로부터 'chat message'라는 이름의 데이터를 받았을 때
    socket.on('chat message', (data) => {
        // 메시지를 보낸 사람을 제외한 '다른 모든 접속자'에게 메시지를 뿌려줍니다.
        socket.broadcast.emit('chat message', data);
    });

    // 사용자가 나갔을 때
    socket.on('disconnect', () => {
        console.log('사용자가 공원을 떠났습니다.');
    });
});

// 서버를 3000번 포트에서 켭니다.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 정상적으로 실행 중입니다. 포트: ${PORT}`);
});
