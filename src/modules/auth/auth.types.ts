export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  role?: "ADMIN" | "STAFF";
}

export interface LoginDto {
  email: string;
  password: string;
}


