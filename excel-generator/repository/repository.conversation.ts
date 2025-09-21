const conversation= new Map<string,string>();

export const conversationRepository={
    getConversation(conversationId:string){
        return conversation.get(conversationId)
    },
    setConversation(conversationId:string,responseId:string){
        conversation.set(conversationId,responseId)
    }

}