const express = require('express');
const cors = require('cors');
const restaurantsRouter = require('./routes/restaurants.routes');
const submissionsRouter = require('./routes/submissions.routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const mongoose = require('mongoose');

function createApp() {
  const app = express();

  // ✅ Netlify 배포 도메인을 허용
  const allowedOrigins = [
    'http://localhost:5173',             // 개발용 Vite
    'https://pwd-week3-kyeongsu.netlify.app', // Netlify 프론트
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true, // 필요시 쿠키 포함 허용
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({ status: 'ok', db: state });
  });

  app.use('/api/restaurants', restaurantsRouter);
  app.use('/api/submissions', submissionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
