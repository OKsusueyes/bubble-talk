// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 🌟 1. 접속하지 않아도 유지되는 게시판 데이터 저장 배열 (서버 메모리)
let boardMessages = [];
const MAX_BOARD_MESSAGE = 10; // 메모리 보호를 위해 최대 30개까지만 저장

// 🤖 봇이 혼자 있는 유저에게 해줄 귀여운 랜덤 답변 리스트
const botReplies = [
    "보글보글... 무슨 일 있어?",
    "하늘 높이 날아가라~ 🫧",
    "오늘 날씨 너~~무 좋다! 그치?",
    "나랑 같이 비눗방울 불자! 😗💨",
    "귀여운 이름이네?",
    "홉! 방금 엄청 큰 방울이 터졌어!",
    "심심했는데 말 걸어줘서 고마워!"
];

io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다!');

    // 🌟 2. 유저가 접속하자마자 서버에 저장되어 있던 게시판 목록을 전송합니다.
    socket.emit('load board', boardMessages);

    // 사용자가 접속하며 닉네임을 알려주면 서버가 기억합니다.
    socket.on('user connect notification', (nickname) => {
        socket.nickname = nickname; 
        socket.broadcast.emit('user joined', nickname);
    });

    // 채팅 데이터를 받았을 때
    socket.on('chat message', (data) => {
        // 먼저 다른 사람들에게 메시지를 뿌려줍니다.
        socket.broadcast.emit('chat message', data);

        // 🌟 3. [봇 기능] 만약 현재 전체 접속자 수가 1명(나 혼자)이라면?
        const currentUsersCount = io.engine.clientsCount;
        if (currentUsersCount === 1) {
            // 사람이 치는 것처럼 자연스럽게 1초(1000ms) 뒤에 봇이 대답합니다.
            setTimeout(() => {
                const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                // 나 혼자 있는 화면에 봇의 메시지를 전송합니다.
                socket.emit('chat message', {
                    nickname: "익명의 동물친구🐶",
                    message: randomReply
                });
            }, 1000);
        }
    });

    // 🌟 4. 유저가 게시판에 새 글을 남겼을 때
    socket.on('save board message', (boardData) => {
        // 새 글을 배열 맨 앞에 추가 (최신글이 위로 오도록)
        boardMessages.unshift(boardData);
        
        // 제한 개수를 넘으면 오래된 글 삭제
        if (boardMessages.length > MAX_BOARD_MESSAGE) {
            boardMessages.pop();
        }

        // 현재 접속 중인 모든 사람에게 업데이트된 게시판 데이터를 전송합니다.
        io.emit('load board', boardMessages);
    });

    // 사용자가 나갔을 때
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
