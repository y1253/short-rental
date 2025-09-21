import { conversationRepository } from "../repository/repository.conversation";
import  OpenAi from 'openai';

const client= new OpenAi({
    apiKey:process.env.API_KEY
})

export const servicesChat={
    async sendMassage(prompt:string,conversationId:string){
        const respond = await client.responses.create({
                model:'gpt-4o-mini',
                input:prompt,
                temperature:0.2,
                max_output_tokens:100,
                previous_response_id:conversationRepository.getConversation(conversationId)
            })
            conversationRepository.setConversation(conversationId,respond.id)
            return{
                id:respond.id,
                massage:respond.output_text
            }
    }
}