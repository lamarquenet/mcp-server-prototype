export interface Context {
    authInfo?: AuthInfo;
  }
  
  export interface AuthInfo {
    token: string ;
    chatGptApiKey: string;
  }