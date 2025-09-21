import express from 'express';
import { controllersChat } from './controllers/controllers.chat';
const router =express.Router();

router.post('/api/chat',controllersChat.sendMassage)

export default router;