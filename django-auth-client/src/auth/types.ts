export type CurrentUser = {
  id: number;
  username: string;
  email: string;
};

export type CurrentUserResponse = {
  status: number;
  data?: {
    user?: CurrentUser;
  };
};