const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let boardMessages = [];
const MAX_BOARD_MESSAGE = 30;

// 🌟 [새로 추가] 공지사항 저장용 변수 및 주인장 비밀번호 설정
let currentNotice = "환영합니다!\n이곳은 픽셀 비눗방울 공원입니다. 🫧\n\n- 주인장 백 -";
const ADMIN_PASSWORD = "oksusu"; // ⚠️ 여기서 주인장 비밀번호를 설정하세요!

const botReplies = [
"보글보글... 무슨 일 있어?",
"하늘 높이 날아가라~ 🫧",
"오늘 날씨 정말 좋다, 그치?",
"나랑 같이 비눗방울 불자! 😗💨",
"네 닉네임 정말 귀엽다!",
"여기는 비밀 비눗방울 공원이야.",
"홉! 방금 엄청 큰 방울이 터졌어!",
"심심했는데 말 걸어줘서 고마워!"
"후...후..불면은 날아가는...커다란 비눗방울...",
"오늘 하루는 어때?",
"심심하면 발자국이라도 남겨봐!",
"발자국 남겼어?",
"비눗방울톡~ 야호~💫✌🏻💖"
];

io.on('connection', (socket) => {
console.log('새로운 사용자가 연결되었습니다!');

socket.emit('load board', boardMessages);

// 🌟 [새로 추가] 접속 시 현재 공지사항을 불러와서 전송
socket.emit('load notice', currentNotice); 

socket.on('user connect notification', (nickname) => {
socket.nickname = nickname; 
socket.broadcast.emit('user joined', nickname);
});

socket.on('chat message', (data) => {
socket.broadcast.emit('chat message', data);
const currentUsersCount = io.engine.clientsCount;
if (currentUsersCount === 1) {
setTimeout(() => {
const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
socket.emit('chat message', {
nickname: "🤖 인공지능 봇",
message: randomReply
});
}, 1000);
}
});

socket.on('save board message', (boardData) => {
boardMessages.unshift(boardData);
if (boardMessages.length > MAX_BOARD_MESSAGE) boardMessages.pop();
io.emit('load board', boardMessages);
});

// 🌟 [새로 추가] 주인장이 공지사항을 수정할 때 검증 및 업데이트
socket.on('update notice', (data) => {
if (data.password === ADMIN_PASSWORD) {
currentNotice = data.notice;
io.emit('load notice', currentNotice); // 비밀번호가 맞으면 모든 유저에게 새 공지사항 전송
} else {
socket.emit('notice error'); // 비밀번호가 틀리면 수정을 요청한 사람에게만 경고 전송
}
});

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
