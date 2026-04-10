export type ErrorResponse = {
  status: string;
  message: string;
};

export type AuthSuccessResponse = {
  status : string;
  message : string;
  data : {
    id: string;
    email: string;
    displayName: string;
    avatarUrl : string | null;
    emailVerified : boolean;
    createdAt  : Date;
},
}