const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { HfInference } = require('@huggingface/inference'); // 🌟 허깅페이스 부품 추가!

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 🚨 허깅페이스 토큰을 여기에 넣어주세요!
const HF_TOKEN = "여기에_허깅페이스_토큰_입력";
const hf = new HfInference(HF_TOKEN);

app.use(express.static('public'));

let boardMessages = [];
const MAX_BOARD_MESSAGE = 30;

let currentNotice = "환영합니다!\n이곳은 픽셀 비눗방울 공원입니다. 🫧\n\n- 주인장 백 -";
const ADMIN_PASSWORD = "oksusu"; 

// AI가 잠들었거나 에러가 났을 때를 대비한 '비상용(Fallback)' 랜덤 답변
const botReplies = [
    "보글보글... 무슨 일 있어?",
    "하늘 높이 날아가라~ 🫧",
    "오늘 날씨 정말 좋다, 그치?",
    "나랑 같이 비눗방울 불자! 😗💨"
];

io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다!');

    socket.emit('load board', boardMessages);
    socket.emit('load notice', currentNotice); 

    socket.on('user connect notification', (nickname) => {
        socket.nickname = nickname; 
        socket.broadcast.emit('user joined', nickname);
    });

    socket.on('chat message', async (data) => {
        // 1. 내가 보낸 메시지를 다른 사람들에게 전달
        socket.broadcast.emit('chat message', data);
        
        const currentUsersCount = io.engine.clientsCount;
        
        // 2. 방에 나 혼자만 있다면 AI 봇이 대답해줌!
        if (currentUsersCount === 1) {
            try {
                // 🌟 허깅페이스 AI에게 대화 요청하기!
                // 한국어 성능이 뛰어난 Qwen 모델을 사용합니다.
                const response = await hf.chatCompletion({
                    model: "Qwen/Qwen2.5-7B-Instruct", 
                    messages: [
                        { role: "system", content: "당신은 매일매일 비눗방울 공원에 놀러오는 동물 친구입니다. 귀엽고 마음이 따뜻하고, 항상 친절한 성격을 가지고 있어요. 사용자가 혼자 있어 심심해할 때 짧고 따뜻하게 한국어로 대화해주세요. 대답은 1~2문장으로 아주 짧게 해주세요." },
                        { role: "user", content: data.message } // 사용자가 채팅창에 친 내용
                    ],
                    max_tokens: 60
                });

                const aiReply = response.choices[0].message.content;

                // AI의 답변을 채팅창에 전송
                socket.emit('chat message', {
                    nickname: "🍀익명의 동물 친구",
                    message: aiReply
                });

            } catch (error) {
                console.error("❌ AI 봇 에러 (무료 서버 지연):", error.message);
                
                // 💡 [안전장치] 무료 AI 서버가 지연되거나 에러가 나면, 자연스럽게 기존 랜덤 답변으로 대처합니다!
                const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                socket.emit('chat message', {
                    nickname: "🤖 동물 로봇",
                    message: randomReply
                });
            }
        }
    });

    socket.on('save board message', (boardData) => {
        boardMessages.unshift(boardData);
        if (boardMessages.length > MAX_BOARD_MESSAGE) boardMessages.pop();
        io.emit('load board', boardMessages);
    });

    socket.on('update notice', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            currentNotice = data.notice;
            io.emit('load notice', currentNotice); 
        } else {
            socket.emit('notice error'); 
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
