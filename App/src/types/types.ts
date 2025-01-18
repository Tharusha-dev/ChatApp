export interface Worker {
    _id: string;
    name: string;
    email: string;
    password: string;
    websites: Website[];
    
  }
  
 export interface Website {
    _id: string;
    domain: string;
    workers: Worker[];
    chat_icon: string;
    metadata: {
       title: string;
       description: string;
       msg_1: string;
       msg_2: string;
       msg_3: string;
       msg_4: string;
       allow_telegram: boolean;
       allow_whatsapp: boolean;
       selected_whatsapp_number: string;
    }
  }
  