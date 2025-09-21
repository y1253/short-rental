import type {Request,Response} from 'express'
import { servicesChat } from '../services/services.chat';
import z from 'zod';
const userInput= z.object({
    prompt:z.string().trim().min(1).max(1000,' Max 1000 characters '),
    conversationId:z.string().min(1,'conversationId is required ')
})
export const controllersChat={
    async sendMassage(req:Request,res:Response){

    const schemaResults= userInput.safeParse(req.body);
        if(!schemaResults.success){
            return res.json(schemaResults.error.issues)
        }
    
        try {
            
            const {prompt,conversationId}=req.body;
            const respond=await servicesChat.sendMassage(prompt,conversationId);
            res.json({massage:respond.massage})
        } catch (error) {
            console.log(error);
            
            return res.status(500).json({error:'failed'})
        }
    
    }
}